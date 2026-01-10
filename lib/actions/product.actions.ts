"use server";
//import {PrismaClient} from '@/lib/generated/prisma';

import { convertToPlainObject, formatError } from "../utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { revalidatePath } from "next/cache";
import { insertProductSchema, updateProductSchema } from "../validators";
import z from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { nanoid } from "nanoid";

// Generate a unique private slug for private listings
function generatePrivateSlug(): string {
  return nanoid(12);
}

/*  Use for logging queries

import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});
prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
}); */

/*  stop logging queries*/

// Get latest products (only published, non-private products)
export async function getLatestProducts() {
  //const prisma = new PrismaClient();
  const data = await prisma.product.findMany({
    where: { isPublished: true, isPrivate: false },
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: "desc" },
  });
  return convertToPlainObject(data);
}

//Get single product by slug (with optional preview mode for admin)
export async function getProductBySlug(slug: string, options?: { preview?: boolean }) {
  const product = await prisma.product.findFirst({
    where: { slug: slug },
    include: {
      ProductCategory: {
        include: {
          Category: true
        }
      }
    }
  });

  if (!product) return null;

  // Allow access if: preview mode OR (published AND not private)
  if (options?.preview || (product.isPublished && !product.isPrivate)) {
    return product;
  }
  return null;
}

// Get product by private slug (for private listings)
export async function getProductByPrivateSlug(privateSlug: string) {
  return await prisma.product.findFirst({
    where: {
      privateSlug: privateSlug,
      isPrivate: true,
      isPublished: true
    },
    include: {
      ProductCategory: {
        include: {
          Category: true
        }
      }
    }
  });
}

// Get product by id (includes category relationships for editing)
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
    include: {
      ProductCategory: {
        include: {
          Category: true
        }
      }
    }
  });

  if (!data) return null;

  // Transform ProductCategory to categories format expected by form
  const transformed = {
    ...data,
    categories: data.ProductCategory.map(pc => ({
      categoryId: pc.categoryId,
      isPrimary: pc.isPrimary,
      category: {
        id: pc.Category.id,
        name: pc.Category.name,
        displayName: pc.Category.displayName,
        slug: pc.Category.slug,
      }
    }))
  };

  return convertToPlainObject(transformed);
}

// Get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
  includeUnpublished = false,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
  includeUnpublished?: boolean;
}) {
  // Visibility filter (admin sees all, public sees only published non-private)
  const visibilityFilter: Prisma.ProductWhereInput = includeUnpublished
    ? {}
    : { isPublished: true, isPrivate: false };

  // Query filter
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== "all"
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          } as Prisma.StringFilter,
        }
      : {};

  // Category filter (updated for new category system)
  const categoryFilter: Prisma.ProductWhereInput =
    category && category !== "all"
      ? {
          ProductCategory: {
            some: {
              Category: {
                OR: [
                  { slug: category },
                  { name: category }
                ]
              }
            }
          }
        }
      : {};

  // Price filter
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== "all"
      ? {
          price: {
            gte: Number(price.split("-")[0]),
            lte: Number(price.split("-")[1]),
          },
        }
      : {};

  // Rating filter
  const ratingFilter =
    rating && rating !== "all"
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  const whereClause = {
    ...visibilityFilter,
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  };

  // Run both queries in parallel to avoid N+1
  const [data, dataCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        ProductCategory: {
          where: { isPrimary: true },
          include: {
            Category: {
              select: {
                id: true,
                name: true,
                displayName: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy:
        sort === "lowest"
          ? { price: "asc" }
          : sort === "highest"
            ? { price: "desc" }
            : sort === "rating"
              ? { rating: "desc" }
              : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({
      where: whereClause,
    }),
  ]);

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a product
export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });
    if (!productExists) throw new Error("Product not found");
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a product
export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const { categoryIds, primaryCategoryId, ...productData } = insertProductSchema.parse(data);

    // Verify all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds }, isActive: true }
    });

    if (categories.length !== categoryIds.length) {
      return { success: false, message: "One or more categories not found or inactive" };
    }

    // Verify primary category is in the category list
    if (!categoryIds.includes(primaryCategoryId)) {
      return { success: false, message: "Primary category must be included in category list" };
    }

    // Generate private slug if product is private
    const privateSlug = productData.isPrivate ? generatePrivateSlug() : null;

    await prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          ...productData,
          privateSlug,
        },
      });

      // Create category relationships
      const categoryRelations = categoryIds.map(categoryId => ({
        productId: product.id,
        categoryId,
        isPrimary: categoryId === primaryCategoryId
      }));

      await tx.productCategory.createMany({
        data: categoryRelations
      });
    });

    revalidatePath("/admin/products");
    return {
      success: true,
      message: "Product created successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// update a product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const { categoryIds, primaryCategoryId, ...productData } = updateProductSchema.parse(data);

    const productExists = await prisma.product.findFirst({
      where: { id: productData.id },
    });
    if (!productExists) throw new Error("Product not found");

    // Verify all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds }, isActive: true }
    });

    if (categories.length !== categoryIds.length) {
      return { success: false, message: "One or more categories not found or inactive" };
    }

    // Verify primary category is in the category list
    if (!categoryIds.includes(primaryCategoryId)) {
      return { success: false, message: "Primary category must be included in category list" };
    }

    // Handle private slug:
    // - Generate new slug if becoming private and doesn't have one
    // - Keep existing slug if staying private
    // - Clear slug if becoming public
    let privateSlug: string | null = productExists.privateSlug;
    if (productData.isPrivate && !productExists.privateSlug) {
      privateSlug = generatePrivateSlug();
    } else if (!productData.isPrivate) {
      privateSlug = null;
    }

    await prisma.$transaction(async (tx) => {
      // Update the product
      await tx.product.update({
        where: { id: productData.id },
        data: {
          ...productData,
          privateSlug,
        },
      });

      // Delete existing category relationships
      await tx.productCategory.deleteMany({
        where: { productId: productData.id }
      });

      // Create new category relationships
      const categoryRelations = categoryIds.map(categoryId => ({
        productId: productData.id,
        categoryId,
        isPrimary: categoryId === primaryCategoryId
      }));

      await tx.productCategory.createMany({
        data: categoryRelations
      });
    });

    revalidatePath("/admin/products");
    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories (updated for new category system)
export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          ProductCategory: {
            where: {
              Product: {
                isPublished: true,
                isPrivate: false,
              },
            },
          },
        },
      },
    },
    orderBy: [
      { parentId: { sort: "asc", nulls: "first" } },
      { sortOrder: "asc" },
      { name: "asc" }
    ]
  });

  return convertToPlainObject(categories);
}

//Get featured products (only published, non-private products)
export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: { isFeatured: true, isPublished: true, isPrivate: false },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return convertToPlainObject(data);
}

// Regenerate private slug for a product
export async function regeneratePrivateSlug(productId: string) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, isPrivate: true }
    });
    if (!product) {
      return { success: false, message: "Product not found or not private" };
    }

    const newSlug = generatePrivateSlug();
    await prisma.product.update({
      where: { id: productId },
      data: { privateSlug: newSlug }
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return {
      success: true,
      message: "Private URL regenerated",
      privateSlug: newSlug
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

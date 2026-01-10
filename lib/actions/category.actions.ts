"use server";

import { convertToPlainObject, formatError } from "../utils";
import { revalidatePath } from "next/cache";
import { 
  insertCategorySchema, 
  updateCategorySchema, 
  categorySortSchema,
  categoryBulkOperationSchema,
  categoryMergeSchema,
  categorySearchSchema,
  categoryProductsSchema
} from "../validators";
import z from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

// Category hierarchy type for tree structure
interface CategoryWithChildren {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryWithChildren[];
  _count?: {
    products?: number;
    ProductCategory?: number;
  };
}

// ===== 3.1 Category Services =====

// Get full category hierarchy
export async function getCategoryTree() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { ProductCategory: true }
        }
      },
      orderBy: { sortOrder: "asc" }
    });

    // Build hierarchical structure
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create all category objects
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...convertToPlainObject(category),
        children: []
      });
    });

    // Second pass: build hierarchy
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children!.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return convertToPlainObject(rootCategories);
  } catch (error) {
    throw new Error(`Failed to get category tree: ${formatError(error)}`);
  }
}

// Get breadcrumb path for a category
export async function getCategoryPath(categoryId: string) {
  try {
    const path: Array<{ id: string; name: string; displayName: string; slug: string }> = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, displayName: true, slug: true, parentId: true }
      });

      if (!category) break;

      path.unshift({
        id: category.id,
        name: category.name,
        displayName: category.displayName,
        slug: category.slug
      });

      currentId = category.parentId || "";
    }

    return convertToPlainObject(path);
  } catch (error) {
    throw new Error(`Failed to get category path: ${formatError(error)}`);
  }
}

// Get products in category with pagination
export async function getCategoryProducts(params: z.infer<typeof categoryProductsSchema>) {
  try {
    const { categoryId, page, limit, sort, order } = categoryProductsSchema.parse(params);
    
    // Get category and all its subcategories
    const categoryIds = await getAllSubcategoryIds(categoryId);
    
    const orderBy: Prisma.ProductOrderByWithRelationInput = 
      sort === "name" ? { name: order } :
      sort === "price" ? { price: order } :
      sort === "rating" ? { rating: order } :
      { createdAt: order };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: {
          ProductCategory: {
            some: {
              categoryId: { in: categoryIds }
            }
          }
        },
        include: {
          ProductCategory: {
            include: {
              Category: {
                select: { id: true, name: true, displayName: true, slug: true }
              }
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({
        where: {
          ProductCategory: {
            some: {
              categoryId: { in: categoryIds }
            }
          }
        }
      })
    ]);

    return {
      data: convertToPlainObject(products),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      currentPage: page
    };
  } catch (error) {
    throw new Error(`Failed to get category products: ${formatError(error)}`);
  }
}

// Search categories with autocomplete
export async function searchCategories(params: z.infer<typeof categorySearchSchema>) {
  try {
    const { query, limit } = categorySearchSchema.parse(params);

    const categories = await prisma.category.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } }
            ]
          }
        ]
      },
      include: {
        _count: {
          select: { ProductCategory: true }
        }
      },
      orderBy: [
        { name: "asc" },
        { sortOrder: "asc" }
      ],
      take: limit
    });

    return convertToPlainObject(categories);
  } catch (error) {
    throw new Error(`Failed to search categories: ${formatError(error)}`);
  }
}

// Get related categories (siblings and popular categories)
export async function getRelatedCategories(categoryId: string, limit = 5) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { parentId: true }
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Get sibling categories (same parent)
    const siblings = await prisma.category.findMany({
      where: {
        AND: [
          { parentId: category.parentId },
          { id: { not: categoryId } },
          { isActive: true }
        ]
      },
      include: {
        _count: {
          select: { ProductCategory: true }
        }
      },
      orderBy: { sortOrder: "asc" },
      take: Math.ceil(limit / 2)
    });

    // Get popular categories (most products)
    const popular = await prisma.category.findMany({
      where: {
        AND: [
          { id: { not: categoryId } },
          { isActive: true }
        ]
      },
      include: {
        _count: {
          select: { ProductCategory: true }
        }
      },
      orderBy: {
        ProductCategory: {
          _count: "desc"
        }
      },
      take: limit - siblings.length
    });

    const related = [...siblings, ...popular].slice(0, limit);
    
    return convertToPlainObject(related);
  } catch (error) {
    throw new Error(`Failed to get related categories: ${formatError(error)}`);
  }
}

// ===== 3.2 Admin APIs =====

// Create category
export async function createCategory(data: z.infer<typeof insertCategorySchema>) {
  try {
    const categoryData = insertCategorySchema.parse(data);
    
    // Check for name uniqueness
    const existing = await prisma.category.findUnique({
      where: { name: categoryData.name }
    });
    
    if (existing) {
      return { success: false, message: "Category name already exists" };
    }

    // Check for slug uniqueness
    const existingSlug = await prisma.category.findUnique({
      where: { slug: categoryData.slug }
    });
    
    if (existingSlug) {
      return { success: false, message: "Category slug already exists" };
    }

    // Validate parent category exists if provided
    if (categoryData.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });
      
      if (!parent) {
        return { success: false, message: "Parent category not found" };
      }
    }

    await prisma.category.create({
      data: {
        ...categoryData,
        updatedAt: new Date()
      }
    });

    revalidatePath("/admin/categories");
    return {
      success: true,
      message: "Category created successfully"
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update category
export async function updateCategory(data: z.infer<typeof updateCategorySchema>) {
  try {
    const categoryData = updateCategorySchema.parse(data);
    
    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id: categoryData.id }
    });
    
    if (!existing) {
      return { success: false, message: "Category not found" };
    }

    // Check for name uniqueness (excluding current category)
    const nameExists = await prisma.category.findFirst({
      where: { 
        name: categoryData.name,
        id: { not: categoryData.id }
      }
    });
    
    if (nameExists) {
      return { success: false, message: "Category name already exists" };
    }

    // Check for slug uniqueness (excluding current category)
    const slugExists = await prisma.category.findFirst({
      where: { 
        slug: categoryData.slug,
        id: { not: categoryData.id }
      }
    });
    
    if (slugExists) {
      return { success: false, message: "Category slug already exists" };
    }

    // Validate parent category and prevent circular reference
    if (categoryData.parentId) {
      if (categoryData.parentId === categoryData.id) {
        return { success: false, message: "Category cannot be its own parent" };
      }

      const parent = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });
      
      if (!parent) {
        return { success: false, message: "Parent category not found" };
      }

      // Check for circular reference
      const isCircular = await checkCircularReference(categoryData.id, categoryData.parentId);
      if (isCircular) {
        return { success: false, message: "Cannot create circular reference" };
      }
    }

    await prisma.category.update({
      where: { id: categoryData.id },
      data: categoryData
    });

    revalidatePath("/admin/categories");
    return {
      success: true,
      message: "Category updated successfully"
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Delete category
export async function deleteCategory(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        other_Category: true,
        ProductCategory: true
      }
    });

    if (!category) {
      return { success: false, message: "Category not found" };
    }

    if (category.other_Category.length > 0) {
      return { success: false, message: "Cannot delete category with subcategories" };
    }

    if (category.ProductCategory.length > 0) {
      return { success: false, message: "Cannot delete category with associated products" };
    }

    await prisma.category.delete({ where: { id } });
    
    revalidatePath("/admin/categories");
    return {
      success: true,
      message: "Category deleted successfully"
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories for admin
export async function getAllCategoriesAdmin() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Category: {
          select: { id: true, name: true, displayName: true }
        },
        _count: {
          select: {
            other_Category: true,
            ProductCategory: true
          }
        }
      },
      orderBy: [
        { parentId: { sort: "asc", nulls: "first" } },
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    });

    return convertToPlainObject(categories);
  } catch (error) {
    throw new Error(`Failed to get categories: ${formatError(error)}`);
  }
}

// Reorder categories
export async function reorderCategories(categories: z.infer<typeof categorySortSchema>[]) {
  try {
    const validatedCategories = categories.map(cat => categorySortSchema.parse(cat));
    
    await prisma.$transaction(
      validatedCategories.map(({ categoryId, sortOrder }) =>
        prisma.category.update({
          where: { id: categoryId },
          data: { sortOrder }
        })
      )
    );

    revalidatePath("/admin/categories");
    return {
      success: true,
      message: "Categories reordered successfully"
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Merge categories
export async function mergeCategories(data: z.infer<typeof categoryMergeSchema>) {
  try {
    const { sourceCategoryId, targetCategoryId } = categoryMergeSchema.parse(data);

    // Verify both categories exist
    const [sourceCategory, targetCategory] = await Promise.all([
      prisma.category.findUnique({ where: { id: sourceCategoryId } }),
      prisma.category.findUnique({ where: { id: targetCategoryId } })
    ]);

    if (!sourceCategory || !targetCategory) {
      return { success: false, message: "One or both categories not found" };
    }

    await prisma.$transaction(async (tx) => {
      // Move all products from source to target category
      await tx.productCategory.updateMany({
        where: { categoryId: sourceCategoryId },
        data: { categoryId: targetCategoryId }
      });

      // Move all child categories to target category
      await tx.category.updateMany({
        where: { parentId: sourceCategoryId },
        data: { parentId: targetCategoryId }
      });

      // Delete the source category
      await tx.category.delete({ where: { id: sourceCategoryId } });
    });

    revalidatePath("/admin/categories");
    return {
      success: true,
      message: `Category "${sourceCategory.name}" merged into "${targetCategory.name}"`
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Bulk operations
export async function bulkCategoryOperation(data: z.infer<typeof categoryBulkOperationSchema>) {
  try {
    const { operation, categoryIds } = categoryBulkOperationSchema.parse(data);

    if (operation === "delete") {
      // Check if any categories have children or products
      const categoriesWithDependencies = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        include: {
          other_Category: true,
          ProductCategory: true
        }
      });

      const hasChildren = categoriesWithDependencies.some(cat => cat.other_Category.length > 0);
      const hasProducts = categoriesWithDependencies.some(cat => cat.ProductCategory.length > 0);

      if (hasChildren) {
        return { success: false, message: "Cannot delete categories with subcategories" };
      }

      if (hasProducts) {
        return { success: false, message: "Cannot delete categories with associated products" };
      }

      await prisma.category.deleteMany({
        where: { id: { in: categoryIds } }
      });
    } else {
      const isActive = operation === "activate";
      await prisma.category.updateMany({
        where: { id: { in: categoryIds } },
        data: { isActive }
      });
    }

    revalidatePath("/admin/categories");
    return {
      success: true,
      message: `Categories ${operation}d successfully`
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ===== Helper Functions =====

// Get all subcategory IDs including the category itself
async function getAllSubcategoryIds(categoryId: string): Promise<string[]> {
  const categoryIds = new Set([categoryId]);
  
  const getChildren = async (parentId: string) => {
    const children = await prisma.category.findMany({
      where: { parentId, isActive: true },
      select: { id: true }
    });
    
    for (const child of children) {
      categoryIds.add(child.id);
      await getChildren(child.id);
    }
  };
  
  await getChildren(categoryId);
  return Array.from(categoryIds);
}

// Check for circular reference in category hierarchy
async function checkCircularReference(categoryId: string, potentialParentId: string): Promise<boolean> {
  let currentId = potentialParentId;
  
  while (currentId) {
    if (currentId === categoryId) {
      return true;
    }
    
    const parent = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });
    
    currentId = parent?.parentId || "";
  }
  
  return false;
}

// Get category by ID
export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        Category: {
          select: { id: true, name: true, displayName: true }
        },
        other_Category: {
          select: { id: true, name: true, displayName: true, slug: true }
        },
        _count: {
          select: { ProductCategory: true }
        }
      }
    });

    if (!category) {
      return null;
    }

    return convertToPlainObject(category);
  } catch (error) {
    throw new Error(`Failed to get category: ${formatError(error)}`);
  }
}

// Get category by slug
export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        Category: {
          select: { id: true, name: true, displayName: true, slug: true }
        },
        other_Category: {
          where: { isActive: true },
          select: { id: true, name: true, displayName: true, slug: true },
          orderBy: { sortOrder: "asc" }
        },
        _count: {
          select: { ProductCategory: true }
        }
      }
    });

    if (!category) {
      return null;
    }

    return convertToPlainObject(category);
  } catch (error) {
    throw new Error(`Failed to get category: ${formatError(error)}`);
  }
}
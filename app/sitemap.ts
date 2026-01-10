import { MetadataRoute } from "next";
import { prisma } from "@/db/prisma";
import { SERVER_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SERVER_URL || "https://pinkcloverusa.com";

  // Get all published, non-private products
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      isPrivate: false,
    },
    select: {
      slug: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get all active categories
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      slug: true,
    },
  });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}

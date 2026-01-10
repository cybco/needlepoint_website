"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Get site settings (creates default if doesn't exist)
export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        id: "default",
        reviewsEnabled: true,
        brandEnabled: true,
      },
    });
  }

  return settings;
}

// Update site settings (admin only)
export async function updateSiteSettings(data: {
  reviewsEnabled?: boolean;
  brandEnabled?: boolean;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        reviewsEnabled: data.reviewsEnabled ?? true,
        brandEnabled: data.brandEnabled ?? true,
      },
    });

    // Invalidate all product pages to "bake in" the new setting
    revalidatePath("/product", "layout");
    revalidatePath("/search", "layout");
    revalidatePath("/");

    return {
      success: true,
      message: "Settings updated. Site is regenerating.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

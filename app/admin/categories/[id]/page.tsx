import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategoriesAdmin, getCategoryById } from "@/lib/actions/category.actions";
import { CategoryForm } from "@/components/admin/category/category-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin | Edit Category",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategoryById(id),
    getAllCategoriesAdmin(),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Category</h1>
        <p className="text-muted-foreground">
          Update category details for &quot;{category.displayName}&quot;.
        </p>
      </div>

      <CategoryForm category={category} categories={categories} />
    </div>
  );
}

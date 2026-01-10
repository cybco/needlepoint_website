import { Metadata } from "next";
import { getAllCategoriesAdmin } from "@/lib/actions/category.actions";
import { CategoryForm } from "@/components/admin/category/category-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin | New Category",
};

export default async function NewCategoryPage() {
  const categories = await getAllCategoriesAdmin();

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
        <h1 className="text-3xl font-bold">Create Category</h1>
        <p className="text-muted-foreground">
          Add a new product category to your store.
        </p>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}

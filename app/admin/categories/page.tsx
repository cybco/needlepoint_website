import { CategoryManager } from "@/components/admin/category/category-manager";
import { getAllCategoriesAdmin } from "@/lib/actions/category.actions";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-muted-foreground">
          Manage your product categories, organize them hierarchically, and control their visibility.
        </p>
      </div>
      
      <CategoryManager categories={categories} allCategories={categories} />
    </div>
  );
}
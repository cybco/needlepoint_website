// User-Facing Components
export { CategoryTree, default as CategoryTreeComponent } from "./category-tree";
export { CategoryBreadcrumb, default as CategoryBreadcrumbComponent } from "./category-breadcrumb";
export { CategoryFilter, default as CategoryFilterComponent } from "./category-filter";
export { CategoryCard, default as CategoryCardComponent } from "./category-card";
export { CategoryMenu, default as CategoryMenuComponent } from "./category-menu";

// Re-export types that components might need
export type { Category } from "../../types";

// Admin Components (for convenience, though they're in admin/category)
export { 
  CategoryManager,
  CategoryForm,
  CategorySelector,
  CategoryTreeAdmin,
  CategoryImporter
} from "../admin/category";
# Category Components

This directory contains both user-facing and admin category components for the SocialHubLink e-commerce platform.

## User-Facing Components

### CategoryTree
Expandable tree navigation for browsing categories hierarchically.

```tsx
import { CategoryTree } from "@/components/category";

<CategoryTree
  categories={categories}
  selectedCategoryId="123"
  onCategorySelect={(category) => console.log(category)}
  showProductCount={true}
  expandAll={false}
/>
```

### CategoryBreadcrumb
Path navigation showing the category hierarchy.

```tsx
import { CategoryBreadcrumb } from "@/components/category";

<CategoryBreadcrumb
  path={[
    { id: "1", name: "electronics", displayName: "Electronics", slug: "electronics" },
    { id: "2", name: "phones", displayName: "Phones", slug: "phones" }
  ]}
  showHome={true}
/>
```

### CategoryFilter
Multi-select filter component for product filtering.

```tsx
import { CategoryFilter } from "@/components/category";

<CategoryFilter
  categories={categories}
  selectedCategories={["123", "456"]}
  onCategoriesChange={(categoryIds) => setSelectedCategories(categoryIds)}
  showCount={true}
  searchable={true}
  collapsible={false}
/>
```

### CategoryCard
Display category with image and product count.

```tsx
import { CategoryCard } from "@/components/category";

<CategoryCard
  category={{
    id: "123",
    name: "electronics",
    displayName: "Electronics",
    slug: "electronics",
    description: "Electronic products and gadgets",
    image: "/images/electronics.jpg",
    _count: { products: 42 }
  }}
  showDescription={true}
  showProductCount={true}
  imageHeight={200}
/>
```

### CategoryMenu
Mega menu for category navigation.

```tsx
import { CategoryMenu } from "@/components/category";

<CategoryMenu
  categories={categories}
  showImages={true}
  columns={4}
  trigger={<Button>Categories</Button>}
/>
```

## Admin Components

### CategoryManager
Full CRUD interface for managing categories.

```tsx
import { CategoryManager } from "@/components/admin/category";

<CategoryManager
  categories={categories}
  allCategories={allCategories}
/>
```

### CategoryForm
Form for creating/editing categories.

```tsx
import { CategoryForm } from "@/components/admin/category";

<CategoryForm
  category={editingCategory}
  categories={allCategories}
  onClose={() => setFormOpen(false)}
/>
```

### CategorySelector
Component for assigning products to categories.

```tsx
import { CategorySelector } from "@/components/admin/category";

<CategorySelector
  categories={categories}
  selectedCategoryIds={["123", "456"]}
  primaryCategoryId="123"
  onCategoriesChange={setSelectedCategories}
  onPrimaryCategoryChange={setPrimaryCategory}
/>
```

### CategoryTreeAdmin
Admin tree with drag-drop reordering.

```tsx
import { CategoryTreeAdmin } from "@/components/admin/category";

<CategoryTreeAdmin
  categories={categories}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAdd={handleAdd}
/>
```

### CategoryImporter
CSV/JSON import functionality.

```tsx
import { CategoryImporter } from "@/components/admin/category";

<CategoryImporter
  open={importerOpen}
  onOpenChange={setImporterOpen}
/>
```

## Custom Hook

### useCategories
Hook for category management and operations.

```tsx
import { useCategories } from "@/hooks/use-categories";

const {
  categories,
  flatCategories,
  loading,
  error,
  getCategoryById,
  getCategoryPath,
  loadCategories
} = useCategories({ searchTerm: "", includeCounts: true });
```

## Actions

The components use the following server actions:

- `getCategoryTree()` - Get hierarchical category structure
- `getCategoryPath(categoryId)` - Get breadcrumb path
- `getCategoryProducts(params)` - Get products in category with pagination
- `searchCategories(params)` - Search categories with autocomplete
- `getRelatedCategories(categoryId)` - Get related categories
- `createCategory(data)` - Create new category
- `updateCategory(data)` - Update existing category
- `deleteCategory(id)` - Delete category
- `reorderCategories(updates)` - Reorder categories
- `mergeCategories(data)` - Merge categories
- `bulkCategoryOperation(data)` - Bulk operations

## Dependencies

The components require the following UI components:
- Button, Input, Textarea, Label
- Card, Badge, Alert
- Dialog, Drawer, Popover
- Table, Checkbox, Switch
- Form components (react-hook-form + Zod)
- Command components (cmdk)
- Progress component
- DnD Kit (for admin tree drag-drop)

## Features Implemented

✅ **User-Facing Components**
- Expandable tree navigation
- Breadcrumb path navigation
- Multi-select category filter
- Category cards with images
- Mega menu navigation

✅ **Admin Components**
- Full CRUD category management
- Product category assignment
- Drag-drop tree reordering
- CSV/JSON import functionality

✅ **Advanced Features**
- Hierarchical category structure
- SEO metadata support
- Bulk operations
- Search and filtering
- Validation and error handling
- Performance optimized queries
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import {
  deleteCategory,
  bulkCategoryOperation,
  getAllCategoriesAdmin
} from "@/lib/actions/category.actions";
import Image from "next/image";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  Category?: {
    id: string;
    name: string;
    displayName: string;
  } | null;
  _count?: {
    other_Category: number;
    ProductCategory: number;
  };
}

interface CategoryManagerProps {
  categories: Category[];
  allCategories?: Category[]; // For parent selection
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories: initialCategories,
}) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCategories = async () => {
    try {
      const updatedCategories = await getAllCategoriesAdmin();
      setCategories(updatedCategories);
    } catch (error) {
      console.error("Failed to refresh categories:", error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteCategory(id);
    
    if (result.success) {
      toast.success(result.message);
      await refreshCategories();
    } else {
      toast.error(result.message);
    }
    
    return result;
  };

  const handleBulkOperation = async (operation: "activate" | "deactivate" | "delete") => {
    if (selectedCategories.length === 0) {
      toast.error("Please select categories first");
      return;
    }

    setIsLoading(true);
    const result = await bulkCategoryOperation({
      operation,
      categoryIds: selectedCategories,
    });

    if (result.success) {
      toast.success(result.message);
      setSelectedCategories([]);
      await refreshCategories();
    } else {
      toast.error(result.message);
    }
    
    setIsLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id));
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {selectedCategories.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkOperation("activate")}
              disabled={isLoading}
            >
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkOperation("deactivate")}
              disabled={isLoading}
            >
              Deactivate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkOperation("delete")}
              disabled={isLoading}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    filteredCategories.length > 0 &&
                    selectedCategories.length === filteredCategories.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleSelectCategory(category.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {category.image && (
                      <div className="relative h-10 w-10 rounded overflow-hidden">
                        <Image
                          src={category.image}
                          alt={category.displayName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{category.displayName}</p>
                      <p className="text-sm text-muted-foreground">{category.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {category.Category ? (
                    <Badge variant="outline">{category.Category.displayName}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{category._count?.ProductCategory || 0}</span>
                    {category._count?.other_Category ? (
                      <Badge variant="secondary" className="text-xs">
                        +{category._count.other_Category} sub
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/categories/${category.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <DeleteDialog id={category.id} action={handleDeleteCategory} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoryManager;
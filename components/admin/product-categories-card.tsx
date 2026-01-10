"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCategoryTree } from "@/lib/actions/category.actions";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    products?: number;
    ProductCategory?: number;
  };
}

interface ProductCategoriesCardProps {
  selectedCategoryIds: string[];
  onCategoriesChange: (categoryIds: string[], primaryCategoryId: string) => void;
  primaryCategoryId?: string;
  onHasChanges?: (hasChanges: boolean) => void;
}

export const ProductCategoriesCard: React.FC<ProductCategoriesCardProps> = ({
  selectedCategoryIds,
  onCategoriesChange,
  primaryCategoryId,
  onHasChanges,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setHasChanges] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedCategoryIds);
  const [tempPrimaryId, setTempPrimaryId] = useState<string>(primaryCategoryId || "");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryTree = await getCategoryTree();
        setCategories(flattenCategories(categoryTree));
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setTempSelectedIds(selectedCategoryIds);
    setTempPrimaryId(primaryCategoryId || "");
  }, [selectedCategoryIds, primaryCategoryId]);

  const flattenCategories = (categories: Category[]): Category[] => {
    const flat: Category[] = [];
    
    const flatten = (cats: Category[], level = 0) => {
      cats.forEach(cat => {
        flat.push({ ...cat, level } as Category & { level: number });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };
    
    flatten(categories);
    return flat;
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = tempSelectedIds.includes(categoryId)
      ? tempSelectedIds.filter(id => id !== categoryId)
      : [...tempSelectedIds, categoryId];
    
    setTempSelectedIds(newSelected);
    
    // If we unchecked the primary category, set primary to the first remaining category
    let newPrimaryId = tempPrimaryId;
    if (categoryId === tempPrimaryId && !newSelected.includes(categoryId)) {
      newPrimaryId = newSelected[0] || "";
    }
    // If we don't have a primary category and we're adding the first one, make it primary
    else if (!tempPrimaryId && newSelected.length === 1) {
      newPrimaryId = newSelected[0];
    }
    
    setTempPrimaryId(newPrimaryId);
    setHasChanges(true);
    
    // Immediately apply changes
    const finalPrimaryId = newPrimaryId || newSelected[0];
    if (newSelected.length > 0) {
      onCategoriesChange(newSelected, finalPrimaryId);
    }
    
    // Notify parent about changes
    if (onHasChanges) {
      onHasChanges(true);
    }
  };

  const handlePrimaryChange = (categoryId: string) => {
    if (tempSelectedIds.includes(categoryId)) {
      setTempPrimaryId(categoryId);
      setHasChanges(true);
      
      // Immediately apply primary change
      onCategoriesChange(tempSelectedIds, categoryId);
      
      // Notify parent about changes
      if (onHasChanges) {
        onHasChanges(true);
      }
    }
  };


  const renderCategory = (category: Category & { level?: number }) => {
    const isSelected = tempSelectedIds.includes(category.id);
    const isPrimary = category.id === tempPrimaryId;
    const level = category.level || 0;

    return (
      <div
        key={category.id}
        className={cn(
          "flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors",
          level > 0 && "ml-6"
        )}
      >
        <Checkbox
          id={category.id}
          checked={isSelected}
          onCheckedChange={() => handleCategoryToggle(category.id)}
        />
        <div className="flex-1 flex items-center justify-between">
          <div>
            <label
              htmlFor={category.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {category.displayName}
            </label>
            {category.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {category._count && (category._count.products ?? category._count.ProductCategory ?? 0) > 0 && (
              <Badge variant="secondary" className="text-xs">
                {category._count.products ?? category._count.ProductCategory ?? 0}
              </Badge>
            )}
            {isPrimary && (
              <Badge variant="default" className="text-xs">
                Primary
              </Badge>
            )}
            {isSelected && !isPrimary && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handlePrimaryChange(category.id)}
              >
                Set Primary
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Loading categories...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>
          Select categories for this product. Choose a primary category that best represents the product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-1">
          {categories.map(renderCategory)}
        </div>
        
        {tempSelectedIds.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
            <span>{tempSelectedIds.length} categories selected</span>
            {tempPrimaryId && (
              <span>
                • Primary: {categories.find(c => c.id === tempPrimaryId)?.displayName}
              </span>
            )}
          </div>
        )}
        
        {tempSelectedIds.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No categories selected. Please select at least one category.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCategoriesCard;
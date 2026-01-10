"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  parentId?: string | null;
  parent?: {
    displayName: string;
  } | null;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryIds: string[];
  primaryCategoryId: string;
  onCategoriesChange: (categoryIds: string[]) => void;
  onPrimaryCategoryChange: (categoryId: string) => void;
  className?: string;
  error?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryIds,
  primaryCategoryId,
  onCategoriesChange,
  onPrimaryCategoryChange,
  className,
  error,
}) => {
  const [open, setOpen] = useState(false);

  const selectedCategories = categories.filter(cat => 
    selectedCategoryIds.includes(cat.id)
  );

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      // Remove category
      const newSelected = selectedCategoryIds.filter(id => id !== categoryId);
      onCategoriesChange(newSelected);
      
      // If removing primary category, set new primary
      if (categoryId === primaryCategoryId && newSelected.length > 0) {
        onPrimaryCategoryChange(newSelected[0]);
      }
    } else {
      // Add category
      const newSelected = [...selectedCategoryIds, categoryId];
      onCategoriesChange(newSelected);
      
      // If no primary category set, make this the primary
      if (!primaryCategoryId) {
        onPrimaryCategoryChange(categoryId);
      }
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    const newSelected = selectedCategoryIds.filter(id => id !== categoryId);
    onCategoriesChange(newSelected);
    
    // If removing primary category, set new primary
    if (categoryId === primaryCategoryId && newSelected.length > 0) {
      onPrimaryCategoryChange(newSelected[0]);
    }
  };

  const handleSetPrimary = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onPrimaryCategoryChange(categoryId);
    }
  };

  const getCategoryPath = (category: Category): string => {
    if (category.parent) {
      return `${category.parent.displayName} > ${category.displayName}`;
    }
    return category.displayName;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label>Product Categories</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedCategories.length > 0
                ? `${selectedCategories.length} categories selected`
                : "Select categories..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={`${category.name} ${category.displayName}`}
                      onSelect={() => handleSelectCategory(category.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategoryIds.includes(category.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{category.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {getCategoryPath(category)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Categories</Label>
          <div className="space-y-2">
            {selectedCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.displayName}</span>
                    {category.id === primaryCategoryId && (
                      <Badge variant="default" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getCategoryPath(category)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {category.id !== primaryCategoryId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(category.id)}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCategory(category.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            The primary category is used for main navigation and breadcrumbs.
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  _count?: {
    products: number;
  };
  children?: Category[];
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categoryIds: string[]) => void;
  showCount?: boolean;
  searchable?: boolean;
  collapsible?: boolean;
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onCategoriesChange,
  showCount = true,
  searchable = true,
  collapsible = false,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState(categories);

  const filterCategories = useCallback((cats: Category[], term: string): Category[] => {
    return cats.reduce((acc: Category[], cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(term) ||
        cat.displayName.toLowerCase().includes(term);

      const filteredChildren = cat.children ? filterCategories(cat.children, term) : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...cat,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = filterCategories(categories, searchTerm.toLowerCase());
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchTerm, categories, filterCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
    setSearchTerm("");
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isSelected = selectedCategories.includes(category.id);
    
    return (
      <div key={category.id} className={cn("space-y-2", level > 0 && "ml-4")}>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={category.id}
            checked={isSelected}
            onCheckedChange={() => handleCategoryToggle(category.id)}
          />
          <Label
            htmlFor={category.id}
            className="flex-1 flex items-center justify-between cursor-pointer"
          >
            <span className="text-sm font-normal">
              {category.displayName}
            </span>
            {showCount && category._count && (
              <Badge variant="secondary" className="ml-2">
                {category._count.products}
              </Badge>
            )}
          </Label>
        </div>
        
        {category.children && category.children.length > 0 && (
          <div className="space-y-2">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {searchable && (
        <Input
          type="search"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      )}
      
      {selectedCategories.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedCategories.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 px-2"
          >
            Clear all
            <X className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => renderCategory(category, 0))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No categories found
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {collapsible ? (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-between"
          >
            <span>Categories</span>
            {selectedCategories.length > 0 && (
              <Badge>{selectedCategories.length}</Badge>
            )}
          </Button>
          {!isCollapsed && content}
        </div>
      ) : (
        content
      )}
    </div>
  );
};

export default CategoryFilter;
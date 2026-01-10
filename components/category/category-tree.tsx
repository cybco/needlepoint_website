"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
    products: number;
  };
}

interface CategoryTreeProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategorySelect?: (category: Category) => void;
  showProductCount?: boolean;
  expandAll?: boolean;
  className?: string;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  selectedCategoryId?: string;
  onCategorySelect?: (category: Category) => void;
  showProductCount?: boolean;
  defaultExpanded?: boolean;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  selectedCategoryId,
  onCategorySelect,
  showProductCount = true,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = category.id === selectedCategoryId;

  const handleClick = () => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors",
          isSelected && "bg-accent",
          level > 0 && "ml-4"
        )}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={handleToggle}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && (
          <div className="w-5" />
        )}
        
        <div className="flex items-center gap-2 flex-1" onClick={handleClick}>
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <Tag className="h-4 w-4 text-muted-foreground" />
          )}
          
          <Link
            href={`/category/${category.slug}`}
            className="flex-1 text-sm hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {category.displayName}
          </Link>
          
          {showProductCount && category._count && (
            <Badge variant="secondary" className="text-xs">
              {category._count.products}
            </Badge>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={onCategorySelect}
              showProductCount={showProductCount}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  showProductCount = true,
  expandAll = false,
  className,
}) => {
  return (
    <div className={cn("w-full space-y-1", className)}>
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={onCategorySelect}
          showProductCount={showProductCount}
          defaultExpanded={expandAll}
        />
      ))}
    </div>
  );
};

export default CategoryTree;
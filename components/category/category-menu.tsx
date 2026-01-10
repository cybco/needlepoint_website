"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

interface CategoryMenuProps {
  categories: Category[];
  className?: string;
  trigger?: React.ReactNode;
  showImages?: boolean;
  columns?: number;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({
  categories,
  className,
  trigger,
  showImages = true,
  columns = 4,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 200);
  };

  const handleCategoryHover = (category: Category) => {
    setActiveCategory(category);
  };

  return (
    <div 
      ref={menuRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          Categories
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 bg-background border rounded-lg shadow-lg min-w-[600px]">
          <div className="flex">
            {/* Main Categories */}
            <div className="w-64 border-r">
              <div className="p-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  CATEGORIES
                </h3>
                <nav className="space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors",
                        activeCategory?.id === category.id && "bg-accent"
                      )}
                      onMouseEnter={() => handleCategoryHover(category)}
                    >
                      <span>{category.displayName}</span>
                      {category.children && category.children.length > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Subcategories and Featured */}
            {activeCategory && (
              <div className="flex-1">
                <div className="p-4">
                  {/* Category Header */}
                  <div className="mb-4">
                    <Link 
                      href={`/category/${activeCategory.slug}`}
                      className="inline-block"
                    >
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                        {activeCategory.displayName}
                      </h3>
                    </Link>
                    {activeCategory.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeCategory.description}
                      </p>
                    )}
                  </div>

                  {/* Subcategories Grid */}
                  {activeCategory.children && activeCategory.children.length > 0 && (
                    <div 
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${Math.min(columns, activeCategory.children.length)}, 1fr)` }}
                    >
                      {activeCategory.children.map((subCategory) => (
                        <Link
                          key={subCategory.id}
                          href={`/category/${subCategory.slug}`}
                          className="group"
                        >
                          <div className="space-y-2">
                            {showImages && subCategory.image && (
                              <div className="relative h-24 rounded-md overflow-hidden bg-muted">
                                <Image
                                  src={subCategory.image}
                                  alt={subCategory.displayName}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  sizes="200px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                {subCategory.displayName}
                              </p>
                              {subCategory._count && (
                                <p className="text-xs text-muted-foreground">
                                  {subCategory._count.products} products
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Featured Image */}
                  {showImages && activeCategory.image && (
                    <Link 
                      href={`/category/${activeCategory.slug}`}
                      className="block mt-4"
                    >
                      <div className="relative h-32 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={activeCategory.image}
                          alt={activeCategory.displayName}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                          sizes="400px"
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-end p-4">
                          <div>
                            <p className="text-white font-semibold">
                              Shop All {activeCategory.displayName}
                            </p>
                            {activeCategory._count && (
                              <p className="text-white/80 text-sm">
                                {activeCategory._count.products} products
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMenu;
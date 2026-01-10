"use client";

import { useState, useEffect, useMemo } from "react";
import { getCategoryTree, searchCategories } from "@/lib/actions/category.actions";

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

interface UseCategoriesOptions {
  searchTerm?: string;
  includeCounts?: boolean;
  autoLoad?: boolean;
}

export const useCategories = (options: UseCategoriesOptions = {}) => {
  const { searchTerm = "", includeCounts = true, autoLoad = true } = options;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (searchTerm.trim()) {
        const results = await searchCategories({ 
          query: searchTerm,
          limit: 50 
        });
        setCategories(results);
      } else {
        const tree = await getCategoryTree();
        setCategories(tree);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadCategories();
    }
  }, [searchTerm, autoLoad]);

  // Flatten categories for easier manipulation
  const flatCategories = useMemo(() => {
    const flatten = (cats: Category[]): Category[] => {
      const result: Category[] = [];
      
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          result.push(...flatten(cat.children));
        }
      });
      
      return result;
    };
    
    return flatten(categories);
  }, [categories]);

  // Get root categories (no parent)
  const rootCategories = useMemo(() => {
    return categories.filter(cat => !cat.parentId);
  }, [categories]);

  // Get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return flatCategories.find(cat => cat.id === id);
  };

  // Get category by slug
  const getCategoryBySlug = (slug: string): Category | undefined => {
    return flatCategories.find(cat => cat.slug === slug);
  };

  // Get children of a category
  const getCategoryChildren = (categoryId: string): Category[] => {
    const category = getCategoryById(categoryId);
    return category?.children || [];
  };

  // Get parent category
  const getCategoryParent = (categoryId: string): Category | undefined => {
    const category = getCategoryById(categoryId);
    if (!category?.parentId) return undefined;
    return getCategoryById(category.parentId);
  };

  // Get category path (breadcrumb trail)
  const getCategoryPath = (categoryId: string): Category[] => {
    const path: Category[] = [];
    let currentCategory = getCategoryById(categoryId);
    
    while (currentCategory) {
      path.unshift(currentCategory);
      currentCategory = currentCategory.parentId 
        ? getCategoryById(currentCategory.parentId)
        : undefined;
    }
    
    return path;
  };

  // Check if category has children
  const hasChildren = (categoryId: string): boolean => {
    const category = getCategoryById(categoryId);
    return !!(category?.children && category.children.length > 0);
  };

  // Get all descendants of a category
  const getCategoryDescendants = (categoryId: string): Category[] => {
    const descendants: Category[] = [];
    const children = getCategoryChildren(categoryId);
    
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...getCategoryDescendants(child.id));
    });
    
    return descendants;
  };

  return {
    categories,
    flatCategories,
    rootCategories,
    loading,
    error,
    loadCategories,
    getCategoryById,
    getCategoryBySlug,
    getCategoryChildren,
    getCategoryParent,
    getCategoryPath,
    hasChildren,
    getCategoryDescendants,
  };
};

export default useCategories;
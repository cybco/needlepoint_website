"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { reorderCategories, updateCategory } from "@/lib/actions/category.actions";

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
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  children?: Category[];
  _count?: {
    products: number;
    children: number;
  };
}

interface CategoryTreeAdminProps {
  categories: Category[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAdd?: (parentId?: string) => void;
  className?: string;
}

interface SortableItemProps {
  category: Category;
  level: number;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAdd?: (parentId?: string) => void;
  onToggleActive?: (category: Category) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  category,
  level,
  onEdit,
  onDelete,
  onAdd,
  onToggleActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = category.children && category.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md border bg-background hover:bg-accent transition-colors",
          level > 0 && "ml-6",
          isDragging && "shadow-lg"
        )}
      >
        {/* Drag Handle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>

        {/* Expand/Collapse */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Category Info */}
        <div className="flex-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{category.displayName}</span>
              {!category.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {category.slug}
              {category._count && (
                <span className="ml-2">
                  • {category._count.products} products
                  {category._count.children > 0 && (
                    <span> • {category._count.children} subcategories</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onToggleActive?.(category)}
              title={category.isActive ? "Deactivate" : "Activate"}
            >
              {category.isActive ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onAdd?.(category.id)}
              title="Add subcategory"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEdit?.(category)}
              title="Edit category"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onDelete?.(category)}
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          <SortableContext
            items={category.children!.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {category.children!.map((child) => (
              <SortableItem
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                onToggleActive={onToggleActive}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

export const CategoryTreeAdmin: React.FC<CategoryTreeAdminProps> = ({
  categories: initialCategories,
  onEdit,
  onDelete,
  onAdd,
  className,
}) => {
  const router = useRouter();
  const [categories] = useState(initialCategories);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find the categories being reordered
      const flatCategories = flattenCategories(categories);
      const oldIndex = flatCategories.findIndex(cat => cat.id === active.id);
      const newIndex = flatCategories.findIndex(cat => cat.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCategories = arrayMove(flatCategories, oldIndex, newIndex);
        
        // Update sort orders and send to server
        const sortUpdates = reorderedCategories.map((category, index) => ({
          categoryId: category.id,
          sortOrder: index,
        }));

        setIsReordering(true);
        const result = await reorderCategories(sortUpdates);
        
        if (result.success) {
          toast.success("Categories reordered successfully");
          router.refresh();
        } else {
          toast.error(result.message);
        }
        
        setIsReordering(false);
      }
    }
  };

  const handleToggleActive = async (category: Category) => {
    const result = await updateCategory({
      ...category,
      isActive: !category.isActive,
      description: category.description || "",
      image: category.image || "",
      seoTitle: category.seoTitle || "",
      seoDescription: category.seoDescription || "",
      seoKeywords: category.seoKeywords || [],
    });

    if (result.success) {
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  // Flatten categories for drag and drop
  const flattenCategories = (cats: Category[]): Category[] => {
    const flattened: Category[] = [];
    
    const flatten = (categories: Category[], level = 0) => {
      categories.forEach(cat => {
        flattened.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };
    
    flatten(cats);
    return flattened;
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Category Tree</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd?.()}
          disabled={isReordering}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Root Category
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((category) => (
            <SortableItem
              key={category.id}
              category={category}
              level={0}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              onToggleActive={handleToggleActive}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isReordering && (
        <div className="text-center text-sm text-muted-foreground">
          Reordering categories...
        </div>
      )}
    </div>
  );
};

export default CategoryTreeAdmin;
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

interface CategoryBreadcrumbProps {
  path: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  path,
  className,
  showHome = true,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm", className)}>
      {showHome && (
        <>
          <Link
            href="/"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          {path.length > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </>
      )}
      
      {path.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-1">
          {index > 0 && !showHome && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {index === path.length - 1 ? (
            <span className="font-medium text-foreground">
              {item.displayName}
            </span>
          ) : (
            <Link
              href={`/category/${item.slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.displayName}
            </Link>
          )}
          {index < path.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </nav>
  );
};

export default CategoryBreadcrumb;
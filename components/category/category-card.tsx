import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    _count?: {
      products: number;
    };
  };
  className?: string;
  showDescription?: boolean;
  showProductCount?: boolean;
  imageHeight?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  className,
  showDescription = true,
  showProductCount = true,
  imageHeight = 200,
}) => {
  return (
    <Link href={`/category/${category.slug}`}>
      <Card 
        className={cn(
          "group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden",
          className
        )}
      >
        {category.image && (
          <div 
            className="relative overflow-hidden bg-muted"
            style={{ height: imageHeight }}
          >
            <Image
              src={category.image}
              alt={category.displayName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        
        <CardContent className={cn("p-4", !category.image && "pt-6")}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            {category.displayName}
          </h3>
          
          {showDescription && category.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {category.description}
            </p>
          )}
          
          {showProductCount && category._count && (
            <Badge variant="secondary" className="mb-3">
              {category._count.products} {category._count.products === 1 ? 'Product' : 'Products'}
            </Badge>
          )}
        </CardContent>
        
        <CardFooter className="px-4 pb-4 pt-0">
          <div className="flex items-center text-sm text-primary font-medium">
            Browse Category
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CategoryCard;
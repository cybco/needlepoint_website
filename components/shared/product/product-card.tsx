import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductPrice from "./product-price";
import { Product } from "@/types";
import Rating from "./rating";
import AddToCartButton from "./add-to-cart-button";

const ProductCard = ({
  product,
  priority = false,
  showRating = true,
  showBrand = true,
}: {
  product: Product;
  priority?: boolean;
  showRating?: boolean;
  showBrand?: boolean;
}) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-0 items-center">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            height={300}
            width={300}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={80}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        {showBrand && <div className="text-xs text-muted-foreground">{product.brand}</div>}
        <Link href={`/product/${product.slug}`} className="hover:underline">
          <h2 className="text-sm font-medium">{product.name}</h2>
        </Link>
        <div className="flex-between gap-4">
          {showRating && <Rating value={Number(product.rating)} />}
          {product.stock > 0 ? (
            <ProductPrice value={Number(product.price)} />
          ) : (
            <p className="text-destructive text-sm">Out of Stock</p>
          )}
        </div>
        {product.stock > 0 && (
          <AddToCartButton
            item={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              qty: 1,
              image: product.images[0],
            }}
          />
        )}
        <Link
          href={`/product/${product.slug}`}
          className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          View Details
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

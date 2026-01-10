import { getProductByPrivateSlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getMyCart } from "@/lib/actions/cart.actions";

import { Card, CardContent } from "@/components/ui/card";
import ProductPrice from "@/components/shared/product/product-price";
import ProductImages from "@/components/shared/product/product-images";
import AddToCart from "@/components/shared/product/add-to-cart";
import ReviewList from "../../product/[slug]/review-list";
import { auth } from "@/auth";
import Rating from "@/components/shared/product/rating";
import { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata(props: {
  params: Promise<{ privateSlug: string }>;
}): Promise<Metadata> {
  const { privateSlug } = await props.params;
  const product = await getProductByPrivateSlug(privateSlug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = product.seoTitle || `${product.name} | ${APP_NAME}`;
  const description = product.seoDescription || product.description.substring(0, 160);

  return {
    title,
    description,
    // Prevent search engines from indexing private listings
    robots: {
      index: false,
      follow: false,
    },
  };
}

const PrivateProductPage = async (props: { params: Promise<{ privateSlug: string }> }) => {
  const { privateSlug } = await props.params;
  const product = await getProductByPrivateSlug(privateSlug);
  if (!product) notFound();

  // Type assertion for product with categories relation
  const productWithCategories = product as typeof product & {
    ProductCategory?: Array<{ isPrimary: boolean; Category: { displayName: string } }>;
  };

  const session = await auth();
  const userId = session?.user?.id;

  const cart = await getMyCart();

  return (
    <>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Images Column*/}
          <div className="cols-span-2">
            <ProductImages images={product.images}></ProductImages>
          </div>
          {/* Details Column*/}
          <div className="col-span-2 p-5">
            <div className="flex flex-col gap-6">
              <p>
                {product.brand} {productWithCategories.ProductCategory?.find(pc => pc.isPrimary)?.Category.displayName || productWithCategories.ProductCategory?.[0]?.Category.displayName || ''}
              </p>
              <h1 className="h3-bold">{product.name}</h1>
              <Rating value={Number(product.rating)} />
              <p>{product.rating} Reviews</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <ProductPrice
                  value={Number(product.price)}
                  className="w-25 rounded-full bg-green-100 text-green-700 px-5 py-2"
                />
              </div>
            </div>
            <div className="mt-10">
              <p className="font-semibold">Description</p>
              <p>{product.description}</p>
            </div>
          </div>
          {/* Action Column */}
          <div>
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex justify-between">
                  <div>Price</div>
                  <div>
                    <ProductPrice value={Number(product.price)} />
                  </div>
                </div>
                <div className="mb-2 flex justify-between">
                  <div>Status</div>
                  {product.stock > 0 ? (
                    <Badge variant="outline">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out Of Stock</Badge>
                  )}
                </div>
                {product.stock > 0 && (
                  <div className="flex-center">
                    <AddToCart
                      cart={cart}
                      item={{
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        qty: 1,
                        image: product.images![0],
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="h2-bold">Customer Reviews</h2>
        <ReviewList
          userId={userId || ""}
          productId={product.id}
          productSlug={product.slug}
        />
      </section>
    </>
  );
};

export default PrivateProductPage;

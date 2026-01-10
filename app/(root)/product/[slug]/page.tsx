import { getProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getSiteSettings } from "@/lib/actions/settings.actions";

import { Card, CardContent } from "@/components/ui/card";
import ProductPrice from "@/components/shared/product/product-price";
import ProductImages from "@/components/shared/product/product-images";
import AddToCart from "@/components/shared/product/add-to-cart";
import ReviewList from "./review-list";
import { auth } from "@/auth";
import Rating from "@/components/shared/product/rating";
import { Metadata } from "next";
import { APP_NAME, SERVER_URL } from "@/lib/constants";

// Revalidate product pages every 10 minutes
export const revalidate = 600;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const { preview } = await props.searchParams;

  // Check if admin for preview mode
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const isPreviewMode = preview === "true" && isAdmin;

  const product = await getProductBySlug(slug, { preview: isPreviewMode });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = product.seoTitle || `${product.name} | ${APP_NAME}`;
  const description = product.seoDescription || product.description.substring(0, 160);
  const keywords = product.seoKeywords?.length > 0 ? product.seoKeywords : undefined;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SERVER_URL}/product/${product.slug}`,
      images: product.images?.length > 0 ? [{ url: product.images[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images?.length > 0 ? [product.images[0]] : undefined,
    },
  };
}

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) => {
  const { slug } = await props.params;
  const { preview } = await props.searchParams;

  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";
  const isPreviewMode = preview === "true" && isAdmin;

  const product = await getProductBySlug(slug, { preview: isPreviewMode });
  if (!product) notFound();

  // Type assertion for product with categories relation
  const productWithCategories = product as typeof product & {
    ProductCategory?: Array<{ isPrimary: boolean; Category: { displayName: string } }>;
  };

  const [cart, settings] = await Promise.all([
    getMyCart(),
    getSiteSettings(),
  ]);

  return (
    <>
      {/* Preview Mode Banner for Draft Products */}
      {!product.isPublished && isAdmin && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center mb-4 rounded-md">
          <strong>Preview Mode:</strong> This product is not published and is only visible to admins.
        </div>
      )}
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
                {settings.brandEnabled && product.brand}{settings.brandEnabled && " "}{productWithCategories.ProductCategory?.find(pc => pc.isPrimary)?.Category.displayName || productWithCategories.ProductCategory?.[0]?.Category.displayName || ''}
              </p>
              <h1 className="h3-bold">{product.name}</h1>
              {settings.reviewsEnabled && (
                <>
                  <Rating value={Number(product.rating)} />
                  <p>{product.numReviews} Reviews</p>
                </>
              )}
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
      {settings.reviewsEnabled && (
        <section className="mt-10">
          <h2 className="h2-bold">Customer Reviews</h2>
          <ReviewList
            userId={userId || ""}
            productId={product.id}
            productSlug={product.slug}
          />
        </section>
      )}
    </>
  );
};

export default ProductDetailsPage;

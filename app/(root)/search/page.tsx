import ProductCard from "@/components/shared/product/product-card";
import { Button } from "@/components/ui/button";
import { getAllProducts, getAllCategories } from "@/lib/actions/product.actions";
import { getSiteSettings } from "@/lib/actions/settings.actions";
import Link from "next/link";

// Revalidate search results every 5 minutes
export const revalidate = 300;

const prices = [
  { name: "$1 to $50", value: "1-50" },
  { name: "$51 to $100", value: "51-100" },
  { name: "$101 to $200", value: "101-200" },
  { name: "$201 to $500", value: "201-500" },
  { name: "$501 to $1000", value: "501-1000" },
];

const ratings = [4, 3, 2, 1];
const sortOrders = ["newest", "lowest", "highest", "rating"];

/* Generate dynamic metadata */
export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string;
    category: string;
    price: string;
    rating: string;
  }>;
}) {
  const {
    q = "all",
    category = "all",
    price = "all",
    rating = "all",
  } = await props.searchParams;

  const isQuerySet = q && q !== "all" && q.trim() !== "";
  const isCategorySet = category && category !== "all" && category.trim() !== "";
  const isPriceSet = price && price !== "all" && price.trim() !== "";
  const isRatingSet = rating && rating !== "all" && rating.trim() !== "";

  if (isQuerySet || isCategorySet || isPriceSet || isRatingSet) {
    return {
      title: `
      Search ${isQuerySet ? q : ""} 
      ${isCategorySet ? `: Category ${category}` : ""}
      ${isPriceSet ? `: Price ${price}` : ""}
      ${isRatingSet ? `: Rating ${rating}` : ""}`,
    };
  } else {
    return {
      title: "Search Products",
    };
  }
}

const SearchPage = async (props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  }>;
}) => {
  const {
    category = "all",
    price = "all",
    rating = "all",
    sort = "newest",
    page = "1",
    q = "all",
  } = await props.searchParams;

  // Construct filter URL
  const getFilterURL = ({
    c,
    s,
    p,
    r,
    pg,
  }: {
    c?: string;
    s?: string;
    p?: string;
    r?: string;
    pg?: string;
  }) => {
    const params = { q, category, price, rating, sort, page };
    if (c) params.category = c;
    if (p) params.price = p;
    if (s) params.sort = s;
    if (r) params.rating = r;
    if (c) params.category = c;
    if (pg) params.page = pg;

    return `/search?${new URLSearchParams(params).toString()}`;
  };

  const [products, categories, settings] = await Promise.all([
    getAllProducts({
      query: q,
      category,
      price,
      rating,
      sort,
      page: Number(page),
    }),
    getAllCategories(),
    getSiteSettings(),
  ]);

  return (
    <div className="grid md:grid-cols-5 md:gap-5">
      <div className="filter-links">
        {/* Category links */}
        <div className="text-xl mb-2 mt-3">Department</div>
        <div>
          <ul className="space-y-1">
            <li>
              <Link
                className={`${(category === "all" || category === "") && "font-bold"}`}
                href={getFilterURL({ c: "all" })}
              >
                Any
              </Link>
            </li>
            {categories.map((x) => (
              <li key={x.id}>
                <Link
                  className={`${category === x.slug && "font-bold"}`}
                  href={getFilterURL({ c: x.slug })}
                >
                  {x.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Price links */}
        <div className="text-xl mb-2 mt-8">Price</div>
        <div>
          <ul className="space-y-1">
            <li>
              <Link
                className={`${price === "all" && "font-bold"}`}
                href={getFilterURL({ p: "all" })}
              >
                Any
              </Link>
            </li>
            {prices.map((p) => (
              <li key={p.value}>
                <Link
                  className={`${price === p.value && "font-bold"}`}
                  href={getFilterURL({ p: p.value })}
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Rating links */}
        {settings.reviewsEnabled && (
          <>
            <div className="text-xl mb-2 mt-8">Rating</div>
            <div>
              <ul className="space-y-1">
                <li>
                  <Link
                    className={`${rating === "all" && "font-bold"}`}
                    href={getFilterURL({ r: "all" })}
                  >
                    Any
                  </Link>
                </li>
                {ratings.map((r) => (
                  <li key={r}>
                    <Link
                      className={`${rating === r.toString() && "font-bold"}`}
                      href={getFilterURL({ r: `${r}` })}
                    >
                      {`${r} stars & up`}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="md:col-span-4 space-y-4">
        <div className="flex-between flex-colmd:flex-row my-4">
          <div className="flex items-center">
            {q !== "all" && q !== "" && " Search: " + q}
            {category !== "all" && category !== "" && " Category: " + category}
            {price !== "all" && price !== "" && " Price: " + price}
            {settings.reviewsEnabled && rating !== "all" && rating !== "" && " Rating: " + rating + " stars & up"}
            &nbsp;
            {(q !== "all" && q !== "") ||
            (category !== "all" && category !== "") ||
            rating !== "all" ||
            price !== "all" ? (
              <Button variant={"link"} asChild>
                <Link href="/search">Clear</Link>
              </Button>
            ) : null}
          </div>
          {/* sort */}
          <div>
            {" "}
            Sort by{" "}
            {sortOrders.map((s) => (
              <Link
                key={s}
                className={`mx-2 ${sort == s && "font-bold"}`}
                href={getFilterURL({ s })}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.data.length === 0 && <div>No products found</div>}
          {products.data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showRating={settings.reviewsEnabled}
              showBrand={settings.brandEnabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

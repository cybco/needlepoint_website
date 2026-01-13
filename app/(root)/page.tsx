import ProductList from "@/components/shared/product/product-list";
import { getLatestProducts, getFeaturedProducts } from "@/lib/actions/product.actions";
import { getSiteSettings } from "@/lib/actions/settings.actions";
import ProductCarousel from "@/components/shared/product/product-carousel";
import ViewAllProductsButton from "@/components/view-all-products-button";
import IconBoxes from "@/components/ui/icon-boxes";
import DealCountdown from "@/components/deal-countdown";
import SoftwareCTA from "@/components/software-cta";

// Revalidate homepage every 5 minutes
export const revalidate = 300;

const Homepage = async () => {
  const [latestProducts, featuredProducts, settings] = await Promise.all([
    getLatestProducts(),
    getFeaturedProducts(),
    getSiteSettings(),
  ]);

  return (
    <>
      {featuredProducts.length > 0 && <ProductCarousel data={featuredProducts} />}
      <SoftwareCTA />
      <ProductList
        data={latestProducts}
        title="Newest Arrivals"
        showRating={settings.reviewsEnabled}
        showBrand={settings.brandEnabled}
      />
      <ViewAllProductsButton />
      <DealCountdown />
      <IconBoxes></IconBoxes>
    </>
  );
};

export default Homepage;

"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Product } from "@/types";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import Image from "next/image";

const ProductCarousel = ({ data }: { data: Product[] }) => {
  // Filter out products without valid banners
  const productsWithBanners = data.filter((product) => product.banner && product.banner.trim() !== "");

  if (productsWithBanners.length === 0) {
    return null;
  }

  return (
    <Carousel
      className="w-full mb-12"
      opts={{ loop: true }}
      plugins={[Autoplay({ delay: 100000, stopOnInteraction: true })]}
    >
      <CarouselContent>
        {productsWithBanners.map((product: Product) => (
          <CarouselItem key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <Image
                src={product.banner!}
                alt={product.name}
                height="0"
                width="0"
                sizes="100vw"
                className="w-full h-auto"
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious></CarouselPrevious>
      <CarouselNext></CarouselNext>
    </Carousel>
  );
};

export default ProductCarousel;

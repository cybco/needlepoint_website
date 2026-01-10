"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ProductImages = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);

  return (
    <div className="space-y-4">
      <Image
        src={images[current]}
        alt="product image"
        width={300}
        height={300}
        priority
        quality={85}
        className="m-h-[300px] object-cover object-center"
      />
      <div className="flex">
        {images.map((image, index) => (
          <div
            key={image}
            onClick={() => setCurrent(index)}
            className={cn(
              "border-2 mr-2 hover:border-black rounded-md cursor-pointer",
              current === index && " border-black"
            )}
          >
            {images.length > 1 && (
              <Image
                src={image}
                alt={`Product thumbnail ${index + 1}`}
                width={100}
                height={100}
                loading="lazy"
                quality={75}
                className="rounded-md"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;

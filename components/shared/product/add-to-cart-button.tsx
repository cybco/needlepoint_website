"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addItemToCart } from "@/lib/actions/cart.actions";
import { CartItem } from "@/types";

const AddToCartButton = ({ item }: { item: CartItem }) => {
  const router = useRouter();

  const handleAddToCart = async () => {
    const res = await addItemToCart(item);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    toast(res.message, {
      action: {
        label: "Go To Cart",
        onClick: () => router.push("/cart"),
      },
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      className="w-full"
      onClick={handleAddToCart}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      Add to Cart
    </Button>
  );
};

export default AddToCartButton;

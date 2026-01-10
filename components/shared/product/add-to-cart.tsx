"use client";

import { Button } from "@/components/ui/button";
import { Cart, CartItem } from "@/types";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
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

  const handleRemoveFromCart = async () => {
    const res = await removeItemFromCart(item.productId);

    // toast(res.message);
    toast(`${res.message} removed from cart`, {
      action: {
        label: "Go To Cart",
        onClick: () => router.push("/cart"),
      },
    });
    return;
  };

  // check if item is in cart
  const existItem = cart && cart.items.find((x) => x.productId === item.productId);

  return existItem ? (
    <div>
      <Button type="button" variant="outline" onClick={handleRemoveFromCart}>
        <Minus className="h-4 w-4"></Minus>
      </Button>
      <span className="px-2">{existItem.qty}</span>
      <Button type="button" variant="outline" onClick={handleAddToCart}>
        <Plus className="h-4 w-4"></Plus>
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      Add To Cart
    </Button>
  );
};
export default AddToCart;

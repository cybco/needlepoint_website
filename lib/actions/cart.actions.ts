"use server";

import { CartItem } from "@/types";
import { cookies } from "next/headers";
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
//import { copyFileSync } from "fs";

// Calculate cart price
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
    shippingPrice = itemsPrice > 100 ? 0 : 10, //$10 shipping over $100
    taxPrice = 0.15 * itemsPrice, // need to get this to calculate based off state
    totalPrice = itemsPrice + taxPrice + shippingPrice;
  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart sesssion not found");

    //get session and user id
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    //Get Cart
    const cart = await getMyCart();

    // Parse and validate item
    const item = cartItemSchema.parse(data);

    //find product in database
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    if (!product) throw new Error("Product not found");
    // if no cart create one
    if (!cart) {
      // create new cart object if not exists
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...calcPrice([item]),
      });

      // add item to database
      await prisma.cart.create({
        data: newCart,
      });

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`);
      return {
        success: true,
        message: `${product.name} \n added to cart`,
      };
    } else {
      // Handle Qty
      // Check if item is in cart
      const existItem = (cart.items as CartItem[]).find((x) => x.productId === item.productId);
      if (existItem) {
        //check stock
        if (product.stock < existItem.qty + 1) {
          throw new Error("Not enough stock");
        }
        // increase qty
        (cart.items as CartItem[]).find((x) => x.productId === item.productId)!.qty = existItem.qty + 1;
      } else {
        // If item does not exist
        // check stock
        if (product.stock < 1) {
          throw new Error("Not enough stock");
        } else {
          cart?.items.push(item);
        }
        // add items to the cart.items
      }
      // save to database
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} \n ${existItem ? "updated in" : "added to"} cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // check for cart cookie
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;
  if (!sessionCartId) throw new Error("Cart sesssion not found");

  //get session and user id
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  //Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) return undefined;

  //convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

export async function removeItemFromCart(productId: string) {
  try {
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart sesssion not found");
    // get product
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) throw new Error("Product not found");

    // Get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error("Cart not found");

    //check for item
    const exist = (cart.items as CartItem[]).find((x) => x.productId === productId);
    if (!exist) throw new Error("Item not found");

    // Check if only 1 item in cart
    if (exist.qty === 1) {
      // remove from cart - filter out the one you don't want
      cart.items = (cart.items as CartItem[]).filter((x) => x.productId !== exist.productId);
    } else {
      // decrease qty
      (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty = exist.qty - 1;
    }

    // update database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calcPrice(cart.items as CartItem[]),
      },
    });
    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      // message: `${product.name} was removed from cart`,
      message: `${product.name}`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

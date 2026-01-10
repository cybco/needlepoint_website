"use server";

import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getMyCart } from "./cart.actions";
import { convertToPlainObject, formatError } from "../utils";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem, PaymentResult, ShippingAddress } from "@/types";
import { paypal } from "../paypal";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "../constants";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../email";

// create order and items
export async function createOrder() {
  try {
    const session = await auth();
    if (!session) throw new Error();
    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
      return { success: false, message: "Your cart is emtpy", redirectTo: "/cart" };
    }
    const userId = session?.user?.id;
    if (!userId) throw new Error("User not found");
    const user = await getUserById(userId);

    if (!cart.shippingAddress) {
      return {
        success: false,
        message: "No shipping address",
        redirectTo: "/shipping-address",
      };
    }
    if (!user.paymentMethod) {
      return {
        success: false,
        message: "No payment method",
        redirectTo: "/payment-method",
      };
    }

    // Create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: cart.shippingAddress,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    //create a trascation (succeed or fail as a whole) to create order and items
    const insertedOrderId = await prisma.$transaction(async (tx) => {
      //create order
      const insertedOrder = await tx.order.create({ data: order });
      // create order items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: item.price,
            orderId: insertedOrder.id,
          },
        });
      }
      // Clear cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
          shippingAddress: Prisma.DbNull,
        },
      });
      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error("Order not created");
    return {
      success: true,
      message: "Order Created",
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}

// Get order by Id
export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      OrderItem: true,
      User: { select: { firstName: true, email: true } },
    },
  });
  return convertToPlainObject(data);
}

// create new paypal order
export async function createPayPalOrder(orderId: string) {
  try {
    // Get order id from db
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });
    if (order) {
      //create paypal order
      const paypalOrder = await paypal.createOrder(Number(order.totalPrice));
      // Update order with paypal order id
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentResult: {
            id: paypalOrder.id,
            email_address: "",
            status: "",
            pricePaid: 0,
          },
        },
      });
      return {
        success: true,
        message: "Item order created successfully",
        data: paypalOrder.id,
      };
    } else {
      throw new Error("Order not found");
    }
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
// Approve paypal order and update order to paid
export async function approvePayPalOrder(orderId: string, data: { orderID: string }) {
  try {
    // Get order from DB
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });
    if (!order) throw new Error("Order not found");
    const captureData = await paypal.capturePayment(data.orderID);
    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== "COMPLETED"
    ) {
      throw new Error("Error in PayPal payment");
    }
    // call update order to paid
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    revalidatePath(`/order/${orderId}`);
    return {
      success: true,
      message: "Your order has been paid",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

//update order to paid
export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  
  // Get order from DB
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      OrderItem: true,
    },
  });
  if (!order) throw new Error("Order not found");
  if (order.isPaid) {
    // Get the order with email details to send email
    const orderWithDetails = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        OrderItem: true,
        User: { select: { firstName: true, email: true } },
      },
    });
    
    if (orderWithDetails) {
      try {
        await sendEmail({
          order: {
            ...orderWithDetails,
            shippingAddress: orderWithDetails.shippingAddress as ShippingAddress,
            paymentResult: orderWithDetails.paymentResult as PaymentResult,
            orderItems: orderWithDetails.OrderItem,
            user: orderWithDetails.User,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email for already paid order:", emailError);
      }
    }
    return;
  }

  // Transaction to update order - could update product stock but not doing right now
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
      },
    });
  });
  // Get updated order after tx
  const updatedOrder = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      OrderItem: true,
      User: { select: { firstName: true, email: true } },
    },
  });
  if (!updatedOrder) throw new Error("Order not found");
  
  // Send email notification
  try {
    await sendEmail({
      order: {
        ...updatedOrder,
        shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
        paymentResult: updatedOrder.paymentResult as PaymentResult,
        orderItems: updatedOrder.OrderItem,
        user: updatedOrder.User,
      },
    });
  } catch (emailError) {
    console.error("Failed to send purchase receipt email:", emailError);
    // Don't throw the error to avoid breaking the order completion
  }
}

// Get user's orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error("User is not authorized");
  const data = await prisma.order.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit /*determine right amount to skip*/,
  });
  const dataCount = await prisma.order.count({
    where: { userId: session?.user?.id },
  });
  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Get sales data and order summary
type SalesDataType = {
  month: string;
  totalSales: number;
}[];
export async function getOrderSummary() {
  // Get counts for each resource
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.order.count();
  const usersCount = await prisma.order.count();
  // Calculate total sales
  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true }, // prisma function
  });
  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`
  select to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" from "Order" group by to_char("createdAt", 'MM/YY')`;

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  // Get latest sales
  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      User: { select: { firstName: true } },
    },
    take: 6,
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestSales,
    salesData,
  };
}

// Get all orders
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.OrderWhereInput =
    query && query !== "all"
      ? {
          User: {
            firstName: {
              contains: query,
              mode: "insensitive",
            } as Prisma.StringFilter,
          },
        }
      : {};

  const data = await prisma.order.findMany({
    where: { ...queryFilter },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: { User: { select: { firstName: true } } },
  });
  const dataCount = await prisma.order.count();
  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete an order
export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({ where: { id } });
    revalidatePath("/admin/orders");
    return {
      success: true,
      message: "Order deleted successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

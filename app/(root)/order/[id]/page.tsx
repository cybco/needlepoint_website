import { getOrderById } from "@/lib/actions/order.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShippingAddress } from "@/types";
import Stripe from "stripe";
import OrderDetailsTable from "./orders.details.table";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const order = await getOrderById(id);
  if (!order) notFound();

  // Type assertion for order with included relations
  const orderWithItems = order as typeof order & {
    OrderItem: Array<{ productId: string; slug: string; image: string; name: string; qty: number; price: string }>;
    user: { firstName: string; email: string };
  };

  let client_secret = null;
  // check if is not paid and using stripe
  if (order.paymentMethod === "Credit Card" && !order.isPaid) {
    // Initialize stripe instance
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalPrice) * 100),
      currency: "USD",
      metadata: { orderId: order.id },
    });
    client_secret = paymentIntent.client_secret;
  }
  return (
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
        orderItems: orderWithItems.OrderItem,
        user: orderWithItems.user,
        paymentResult: (order.paymentResult as { id: string; status: string; email_address: string; pricePaid: string }) || { id: "", status: "", email_address: "", pricePaid: "" },
      }}
      stripeClientSecret={client_secret}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
    />
  );
};

export default OrderDetailsPage;

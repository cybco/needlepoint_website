import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrderToPaid } from "@/lib/actions/order.actions";

// Validate webhook secret at startup
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Early validation of webhook secret
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the raw body as text first
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature header" }, { status: 400 });
    }

    // Build and verify the webhook event
    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature";
      console.error("Webhook signature verification failed:", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Check for successful payment
    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;

      // Validate required metadata
      if (!charge.metadata?.orderId) {
        console.error("Webhook missing orderId in metadata:", charge.id);
        return NextResponse.json({ error: "Missing orderId in metadata" }, { status: 400 });
      }

      // Validate billing email
      const email = charge.billing_details?.email;
      if (!email) {
        console.error("Webhook missing billing email:", charge.id);
        return NextResponse.json({ error: "Missing billing email" }, { status: 400 });
      }

      // Update order status
      await updateOrderToPaid({
        orderId: charge.metadata.orderId,
        paymentResult: {
          id: charge.id,
          status: "COMPLETED",
          email_address: email,
          pricePaid: (charge.amount / 100).toFixed(2),
        },
      });

      return NextResponse.json({
        message: "updateOrderToPaid was successful",
      });
    }

    // Acknowledge other event types
    return NextResponse.json({
      message: `Event type ${event.type} received`,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

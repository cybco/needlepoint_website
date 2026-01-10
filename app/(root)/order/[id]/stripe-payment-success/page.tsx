import { Button } from '@/components/ui/button';
import { getOrderById, updateOrderToPaid } from '@/lib/actions/order.actions';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Stripe from 'stripe';

const SuccessPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_intent: string }>;
}) => {
  const { id } = await props.params;
  const { payment_intent: paymentIntentId } = await props.searchParams;

  // Initialize Stripe inside the function to avoid build-time errors
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  // Fetch order
  const order = await getOrderById(id);
  if (!order) notFound();

  // Type assertion for order with user relation
  const orderWithUser = order as {
    id: string;
    User: { firstName: string; email: string };
    OrderItem: Array<{ productId: string; slug: string; image: string; name: string; qty: number; price: string }>;
  };

  // Retrieve payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // Check if payment intent is valid
  if (
    paymentIntent.metadata.orderId == null ||
    paymentIntent.metadata.orderId !== order.id.toString()
  ) {
    return notFound();
  }

  // Check if payment is successful
  const isSuccess = paymentIntent.status === 'succeeded';

  if (!isSuccess) return redirect(`/order/${id}`);

  // Update order to paid if payment succeeded
  if (isSuccess) {
    try {
      await updateOrderToPaid({
        orderId: id,
        paymentResult: {
          id: paymentIntent.id,
          status: 'COMPLETED',
          email_address: paymentIntent.receipt_email || orderWithUser.User.email,
          pricePaid: (paymentIntent.amount / 100).toString(),
        },
      });
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  }

  return (
    <div className='max-w-4xl w-full mx-auto space-y-8'>
      <div className='flex flex-col gap-6 items-center'>
        <h1 className='h1-bold'>Thanks for your purchase</h1>
        <div>We are processing your order.</div>
        <Button asChild>
          <Link href={`/order/${id}`}>View Order</Link>
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;

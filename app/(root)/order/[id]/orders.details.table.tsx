"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Order } from "@/types";
import { BadgeCheckIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { createPayPalOrder, approvePayPalOrder } from "@/lib/actions/order.actions";
import { toast } from "sonner";
import StripePayment from "./stripe-payment";

const OrderDetailsTable = ({
  order,
  paypalClientId,
  stripeClientSecret,
}: {
  order: Order;
  paypalClientId: string;
  stripeClientSecret: string | null;
}) => {
  const {
    shippingAddress,
    orderItems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
  } = order;

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    let status = "";
    if (isPending) {
      status = "Loading PayPal...";
    } else if (isRejected) {
      status = "Error Loading PayPal";
    }
    return status;
  };

  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(order.id);
    if (!res.success) {
      toast.warning(res.message);
    }
    return res.data;
  };

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(order.id, data);
    if (!res.success) {
      toast.warning(res.message);
    } else {
      toast.success(res.message);
    }
  };
  return (
    <>
      <h1 className="py-4 text-2xl">Order Number: {formatId(order.id)}</h1>
      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="col-span-2 sace-4-y overflow-x-auto">
          <Card>
            <CardContent>
              <h2 className="text-xl pb-4">Payment Method</h2>
              <p className="mb-2">{paymentMethod}</p>
              {isPaid ? (
                <Badge
                  variant="secondary"
                  className="bg-blue-500 text-white dark:bg-blue-600"
                >
                  <BadgeCheckIcon />
                  Paid on {formatDateTime(paidAt!).dateOnly}
                </Badge>
              ) : (
                <Badge variant="destructive">Not Paid</Badge>
              )}
            </CardContent>
          </Card>
          <Card className="my-2">
            <CardContent>
              <h2 className="text-xl pb-4">Shipping Address44</h2>
              <p>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              <p>
                {shippingAddress.streetAddress}, {shippingAddress.city}
              </p>
              <p>
                {shippingAddress.state}, {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item: { slug: string; image: string; name: string; qty: number; price: string }) => (
                    <TableRow key={item.slug}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          />
                          <span className="px-2">{item.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="px-2">{item.qty}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-right">$ {item.price}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-4 gap-4 space-y-4">
              <div className="flex justify-between">
                <div>Items</div>
                <div>{formatCurrency(itemsPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Tax</div>
                <div>{formatCurrency(taxPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Shipping</div>
                <div>{formatCurrency(shippingPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Total</div>
                <div>{formatCurrency(totalPrice)}</div>
              </div>
              {/* PayPal Payment */}

              {!isPaid && paymentMethod === "PayPal" && (
                <div>
                  <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                    <PrintLoadingState></PrintLoadingState>
                    <PayPalButtons
                      createOrder={handleCreatePayPalOrder}
                      onApprove={handleApprovePayPalOrder}
                    />
                  </PayPalScriptProvider>
                </div>
              )}

              {/* Stripe Payment */}

              {!isPaid && paymentMethod === "Credit Card" && stripeClientSecret && (
                <StripePayment
                  priceInCents={Number(order.totalPrice) * 100}
                  orderId={order.id}
                  clientSecret={stripeClientSecret}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsTable;

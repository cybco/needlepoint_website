"use client";
import { createOrder } from "@/lib/actions/order.actions";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

const PlaceOrderForm = () => {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await createOrder();
    if (res.redirectTo) {
      router.push(res.redirectTo);
    }
  };

  const PlaceOrderButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button disabled={pending} className="w-full">
        {pending ? <Loader className="w-4 h-4 animate-spin" /> : ""} Enter Payment Details
      </Button>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <PlaceOrderButton />
    </form>
  );
};

export default PlaceOrderForm;

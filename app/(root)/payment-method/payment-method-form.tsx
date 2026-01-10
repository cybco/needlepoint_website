"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { paymentMethodSchema } from "@/lib/validators";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/constants";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateUserPaymentMethod } from "@/lib/actions/user.actions";

const PaymentMethodForm = ({ preferredPaymentMethod }: { preferredPaymentMethod: string | null }) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  });

  const onSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    const res = await updateUserPaymentMethod(values);
    if (!res.success) {
      toast(res.message);
      return;
    }
    router.push("/place-order");
  };
  return (
    <>
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-semibold mt-4">Payment Method</h1>
        <p className="text-sm text-muted-foreground"> Please select payment method</p>
        <Form {...form}>
          <form method="post" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} className="flex flex-col space-y-2">
                        {PAYMENT_METHODS.map((paymentMethod) => (
                          <FormItem key={paymentMethod} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={paymentMethod} checked={field.value === paymentMethod} />
                            </FormControl>
                            <FormLabel className="font-normal">{paymentMethod}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage></FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex gap-2">
                <Button type="submit">Continue</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default PaymentMethodForm;

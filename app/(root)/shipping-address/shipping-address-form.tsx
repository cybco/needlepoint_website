"use client";

import { ShippingAddress } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { shippingAddressSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps, useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { shippingAddressDefaultValues } from "@/lib/constants";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUserAddress } from "@/lib/actions/user.actions";

const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: address || shippingAddressDefaultValues, //remove default values before deploy
  });

  const onSubmit: SubmitHandler<z.infer<typeof shippingAddressSchema>> = async (values) => {
    const res = await updateUserAddress(values);

    if (!res.success) {
      toast(res.message);
      return;
    }
    router.push("/payment-method");
  };

  return (
    <>
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-semibold mt-4">Shipping Address</h1>
        <p className="text-sm text-muted-foreground"> Please enter shipping information</p>
        <Form {...form}>
          <form method="post" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "firstName"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "lastName"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "streetAddress"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="city"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "city"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="state"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "state"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "postalCode"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter postal code" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <FormField
                control={form.control}
                name="country"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof shippingAddressSchema>, "country"> }) => (
                  <FormItem className="w-full">
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default ShippingAddressForm;

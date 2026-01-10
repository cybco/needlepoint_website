"use client";
import { updateUserSchema } from "@/lib/validators";
import z from "zod";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { USER_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatError } from "@/lib/utils";
import { updateUser } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

const UpdateUserForm = ({ user }: { user: z.infer<typeof updateUserSchema> }) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user,
  });

  const onSubmit = async (values: z.infer<typeof updateUserSchema>) => {
    try {
      const res = await updateUser({
        ...values,
        id: user.id,
      });
      if (!res.success) {
        toast.error(formatError(res.message));
        return;
      }
      toast.success("User updated successfully");
      form.reset();
      router.push("/admin/users");
    } catch (error) {
      toast.error(formatError(error));
    }
    return;
  };

  return (
    <Form {...form}>
      <form method="POST" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email */}
        <div>
          <FormField
            control={form.control}
            name="email"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "email">;
            }) => (
              <FormItem className="w-full mt-4">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input disabled={true} placeholder="Enter user email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* First Name */}
        <div>
          <FormField
            control={form.control}
            name="firstName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "firstName">;
            }) => (
              <FormItem className="w-full mt-4">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter user first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Last Name */}
        <div>
          <FormField
            control={form.control}
            name="lastName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "lastName">;
            }) => (
              <FormItem className="w-full mt-4">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter user last name" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Phone */}
        <div>
          <FormField
            control={form.control}
            name="phone"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "phone">;
            }) => (
              <FormItem className="w-full mt-4">
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Street Address Line 1 */}
        <div>
          <FormField
            control={form.control}
            name="streetAddressHouseNumStreet"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "streetAddressHouseNumStreet">;
            }) => (
              <FormItem className="w-full mt-4">
                <FormLabel>Street Address Line 1</FormLabel>
                <FormControl>
                  <Input placeholder="Enter street address" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Street Address Line 2 */}
        <div>
          <FormField
            control={form.control}
            name="streetAddressLine2"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "streetAddressLine2">;
            }) => (
              <FormItem className="w-full mt-4">
                <FormLabel>Street Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Apt, suite, unit, etc. (optional)" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* City, State, Zip */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <FormField
            control={form.control}
            name="city"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "city">;
            }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="State"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "State">;
            }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="State" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "zip">;
            }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Role */}
        <div className="w-full mt-4">
          <FormField
            control={form.control}
            name="role"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof updateUserSchema>, "role">;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-between mt-4">
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating..." : "Update User"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateUserForm;

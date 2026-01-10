"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateProfile, changePassword, changeEmail, signOutUser } from "@/lib/actions/user.actions";
import { updateProfileSchema, changePasswordSchema, changeEmailSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
  user: {
    lastName: string;
    phone: string;
    streetAddressHouseNumStreet: string;
    streetAddressLine2: string;
    city: string;
    State: string;
    zip: string;
  };
}

const ProfileForm = ({ user }: ProfileFormProps) => {
  const { data: session, update } = useSession();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    emailCurrentPassword: false,
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const profileForm = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: session?.user?.name ?? "",
      lastName: user.lastName,
      email: session?.user?.email ?? "",
      phone: user.phone,
      streetAddressHouseNumStreet: user.streetAddressHouseNumStreet,
      streetAddressLine2: user.streetAddressLine2,
      city: user.city,
      State: user.State,
      zip: user.zip,
    },
  });

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<z.infer<typeof changeEmailSchema>>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      currentPassword: "",
      newEmail: "",
      confirmEmail: "",
    },
  });

  const onProfileSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
    const res = await updateProfile(values);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const newSession = {
      ...session,
      user: {
        ...session?.user,
        name: values.firstName,
      },
    };

    await update(newSession);
    toast.success(res.message);
    profileForm.reset(values);
  };

  const onPasswordSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    const formData = new FormData();
    formData.append("currentPassword", values.currentPassword);
    formData.append("newPassword", values.newPassword);
    formData.append("confirmPassword", values.confirmPassword);

    const res = await changePassword(null, formData);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    toast.success(res.message);
    passwordForm.reset();
    setIsChangingPassword(false);
    setShowPasswords((prev) => ({
      ...prev,
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    }));
  };

  const onEmailSubmit = async (values: z.infer<typeof changeEmailSchema>) => {
    const res = await changeEmail(values);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    toast.success(res.message);
    emailForm.reset();
    setIsChangingEmail(false);
    setShowPasswords((prev) => ({ ...prev, emailCurrentPassword: false }));

    // Sign out user since email changed
    if (res.requiresSignOut) {
      await signOutUser();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form className="flex flex-col gap-5" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Email" className="input-field" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" className="input-field" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" className="input-field" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone Number" className="input-field" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Address</h3>
                <div className="flex flex-col gap-4">
                  <FormField
                    control={profileForm.control}
                    name="streetAddressHouseNumStreet"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street Address" className="input-field" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="streetAddressLine2"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt, Suite, Unit, etc. (optional)" className="input-field" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" className="input-field" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="State"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" className="input-field" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP Code" className="input-field" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="button w-full" disabled={profileForm.formState.isSubmitting || !profileForm.formState.isDirty}>
                {profileForm.formState.isSubmitting ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Change your account email address.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingEmail ? (
            <Button onClick={() => setIsChangingEmail(true)} variant="outline">
              Change Email
            </Button>
          ) : (
            <Form {...emailForm}>
              <form className="flex flex-col gap-5" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
                <p className="text-sm text-muted-foreground">
                  After changing your email, you will be signed out and need to sign in with your new email address.
                </p>
                <FormField
                  control={emailForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.emailCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            className="input-field pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => togglePasswordVisibility("emailCurrentPassword")}
                          >
                            {showPasswords.emailCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>New Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter new email" className="input-field" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="confirmEmail"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Confirm New Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Confirm new email" className="input-field" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="lg" className="flex-1" disabled={emailForm.formState.isSubmitting}>
                    {emailForm.formState.isSubmitting ? "Changing..." : "Change Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setIsChangingEmail(false);
                      emailForm.reset();
                      setShowPasswords((prev) => ({ ...prev, emailCurrentPassword: false }));
                    }}
                    disabled={emailForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button onClick={() => setIsChangingPassword(true)} variant="outline">
              Change Password
            </Button>
          ) : (
            <Form {...passwordForm}>
              <form className="flex flex-col gap-5" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.currentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            className="input-field pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => togglePasswordVisibility("currentPassword")}
                          >
                            {showPasswords.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.newPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="input-field pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => togglePasswordVisibility("newPassword")}
                          >
                            {showPasswords.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.confirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="input-field pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => togglePasswordVisibility("confirmPassword")}
                          >
                            {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="lg" className="flex-1" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setIsChangingPassword(false);
                      passwordForm.reset();
                      setShowPasswords((prev) => ({
                        ...prev,
                        currentPassword: false,
                        newPassword: false,
                        confirmPassword: false,
                      }));
                    }}
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;

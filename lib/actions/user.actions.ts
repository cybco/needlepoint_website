"use server";

import {
  shippingAddressSchema,
  signInFormSchema,
  paymentMethodSchema,
  updateUserSchema,
  changePasswordSchema,
  changeEmailSchema,
} from "../validators";
import { signUpFormSchema } from "../validators";
import { auth, signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync, compareSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatError } from "../utils";
import { ShippingAddress } from "@/types";
import { redirect } from "next/navigation";

import { PAGE_SIZE } from "../constants";
import { revalidatePath } from "next/cache";
import z from "zod";
import { Prisma } from "@prisma/client";

// Sign in user with credentials
export async function signInWithCredentials(prevState: unknown, formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await signIn("credentials", {
      ...user,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    // Check if error message contains suspended account info
    // NextAuth wraps errors in CallbackRouteError with cause property
    const errorMessage = error instanceof Error ? error.message : String(error);
    const causeMessage = (error as { cause?: Error })?.cause?.message || "";
    if (errorMessage.includes("suspended") || causeMessage.includes("suspended")) {
      return { success: false, message: "Your account has been suspended. Please contact support." };
    }
    return { success: false, message: "Invalid email or password" };
  }
}

// Sign user out
export async function signOutUser() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
  }
  revalidatePath("/");
  redirect("/");
}

//Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    const plainPassword = user.password;
    user.password = hashSync(user.password, 10);
    await prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
        updatedAt: new Date(),
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
      redirect: false,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  redirect(callbackUrl);
}

// Get user by id

export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error("User not found");
  return user;
}

// Update the cart shipping address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User not found");

    const address = shippingAddressSchema.parse(data);

    // Get the user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) throw new Error("Cart not found");

    // Update the cart with shipping address
    await prisma.cart.update({
      where: { id: cart.id },
      data: { shippingAddress: address },
    });

    return {
      success: true,
      message: "Shipping address saved successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// update users payment method
export async function updateUserPaymentMethod(data: z.infer<typeof paymentMethodSchema>) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });
    if (!currentUser) throw new Error("User not found");
    const paymentMethod = paymentMethodSchema.parse(data);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.type },
    });
    return {
      success: true,
      message: "User updated successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update the user profile
export async function updateProfile(user: {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  streetAddressHouseNumStreet?: string;
  streetAddressLine2?: string;
  city?: string;
  State?: string;
  zip?: string;
}) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });
    if (!currentUser) throw new Error("User not found");
    await prisma.user.update({
      where: { id: session?.user?.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName || null,
        email: user.email,
        phone: user.phone || null,
        streetAddressHouseNumStreet: user.streetAddressHouseNumStreet || null,
        streetAddressLine2: user.streetAddressLine2 || null,
        city: user.city || null,
        State: user.State || null,
        zip: user.zip || null,
      },
    });
    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

//Get all the users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  try {
  const queryFilter: Prisma.UserWhereInput =
    query && query !== "all"
      ? {
          firstName: {
            contains: query,
            mode: "insensitive",
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.user.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });
  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
  } catch (error) {
    console.error('Error fetching users:', error)
    
      return { success: false, message: "Failed to get users" };
   
  }
}
// Delete a user
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch {
    return { success: false, message: "Failed to delete user" };
  }
}

// Toggle user active status (suspend/unsuspend)
export async function toggleUserStatus(id: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { id },
      select: { isActive: true },
    });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const newStatus = !user.isActive;
    await prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
    });

    revalidatePath("/admin/users");
    return {
      success: true,
      message: newStatus ? "User activated successfully" : "User suspended successfully"
    };
  } catch {
    return { success: false, message: "Failed to update user status" };
  }
}

//Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    const userID = user.id;

    await prisma.user.findFirst({
      where: { id: userID },
    });
    if (!user) throw new Error("User not found");

    const updatedUser = updateUserSchema.parse(user);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        streetAddressHouseNumStreet: updatedUser.streetAddressHouseNumStreet,
        streetAddressLine2: updatedUser.streetAddressLine2,
        city: updatedUser.city,
        State: updatedUser.State,
        zip: updatedUser.zip,
      },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "User updated successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Change password for logged in user
export async function changePassword(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    const passwordData = changePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const currentUser = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!currentUser || !currentUser.password) {
      return { success: false, message: "User not found" };
    }

    const isCurrentPasswordValid = compareSync(passwordData.currentPassword, currentUser.password);
    if (!isCurrentPasswordValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    const hashedNewPassword = hashSync(passwordData.newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword },
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Change email for logged in user
export async function changeEmail(data: {
  currentPassword: string;
  newEmail: string;
  confirmEmail: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    const emailData = changeEmailSchema.parse(data);

    const currentUser = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { password: true, email: true },
    });

    if (!currentUser || !currentUser.password) {
      return { success: false, message: "User not found" };
    }

    // Verify current password
    const isPasswordValid = compareSync(emailData.currentPassword, currentUser.password);
    if (!isPasswordValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Check if new email is same as current
    if (emailData.newEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return { success: false, message: "New email is the same as current email" };
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: emailData.newEmail, mode: "insensitive" }
      },
    });

    if (existingUser) {
      return { success: false, message: "Email is already in use" };
    }

    // Update email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: emailData.newEmail },
    });

    return {
      success: true,
      message: "Email changed successfully. Please sign in with your new email.",
      requiresSignOut: true,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

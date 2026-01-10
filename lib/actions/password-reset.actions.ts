"use server";

import { prisma } from "@/db/prisma";
import { formatError } from "../utils";
import { hashSync } from "bcrypt-ts-edge";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "../email";
import { headers } from "next/headers";

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3; // 3 requests per hour per IP

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

export async function requestPasswordReset(prevState: unknown, formData: FormData) {
  try {
    const email = formData.get("email") as string;

    if (!email) {
      return { success: false, message: "Email is required" };
    }

    // Rate limiting by IP address
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ||
               headersList.get("x-real-ip") ||
               "unknown";

    const rateCheck = checkRateLimit(`password-reset:${ip}`);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: `Too many password reset requests. Please try again in ${rateCheck.retryAfter} minutes.`
      };
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email }
    });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = "If your email address exists in our system, you will receive a password reset link shortly.";

    if (!user) {
      return { success: true, message: successMessage };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    return { success: true, message: successMessage };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    if (!token || !password) {
      return { success: false, message: "Token and password are required" };
    }

    // Validate password requirements
    if (password.length < 7) {
      return { success: false, message: "Password must be at least 7 characters long" };
    }

    if (!/\d/.test(password)) {
      return { success: false, message: "Password must include at least one number" };
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, message: "Invalid or expired reset token" };
    }

    // Hash new password and clear reset token
    const hashedPassword = hashSync(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { success: true, message: "Password has been reset successfully. You can now sign in with your new password." };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
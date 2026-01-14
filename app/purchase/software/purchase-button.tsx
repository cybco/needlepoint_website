"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { purchaseLicense } from "@/lib/actions/licensing.actions";

interface PurchaseButtonProps {
  email: string;
  price: number;
  userId: string;
  disabled?: boolean;
}

export default function PurchaseButton({ email, price, userId, disabled }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      // In production, this would redirect to Stripe Checkout
      // For now, we'll use a mock payment flow
      const result = await purchaseLicense({
        email,
        userId,
        amount: price,
        paymentMethod: "mock",
      });

      if (result.success && result.licenseKey) {
        // Redirect to success page with license key
        router.push(`/purchase/software/success?key=${encodeURIComponent(result.licenseKey)}`);
      } else {
        alert(result.message || "Purchase failed. Please try again.");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full text-lg py-6"
      size="lg"
      onClick={handlePurchase}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          Processing...
        </>
      ) : (
        `Purchase for $${price}`
      )}
    </Button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin -ml-1 mr-3 h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

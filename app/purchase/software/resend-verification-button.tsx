"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/actions/user.actions";

interface ResendVerificationButtonProps {
  email: string;
}

export default function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await resendVerificationEmail(email);
      setMessage(result.message);
      setIsSuccess(result.success);
    } catch {
      setMessage("Failed to resend verification email. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleResend}
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Resend verification email"}
      </Button>
      {message && (
        <p className={`text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

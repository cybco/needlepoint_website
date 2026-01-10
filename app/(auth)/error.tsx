"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">Authentication Error</h2>
      <p className="text-muted-foreground text-center max-w-md">
        There was a problem with authentication. Please try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/sign-in")}>
          Back to Sign In
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">Admin Error</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Something went wrong in the admin panel. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/admin/overview")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

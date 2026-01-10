"use client";

import { Button } from "@/components/ui/button";
import { toggleUserStatus } from "@/lib/actions/user.actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle } from "lucide-react";

interface SuspendButtonProps {
  userId: string;
  isActive: boolean;
}

const SuspendButton = ({ userId, isActive }: SuspendButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleUserStatus(userId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button
      variant={isActive ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isActive ? (
        <>
          <Ban className="h-4 w-4 mr-1" />
          Suspend
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-1" />
          Activate
        </>
      )}
    </Button>
  );
};

export default SuspendButton;

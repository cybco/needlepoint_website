"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

const DeleteDialog = ({ id, action }: { id: string; action: (id: string) => Promise<{ success: boolean; message: string }> }) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const handleDeleteClick = () => {
    startTransition(async () => {
      const res = await action(id);
      if (!res.success) {
        toast.warning(res.message);
      } else {
        setOpen(false);
        toast.message(res.message);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="ml-2">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutly sure</AlertDialogTitle>
          <AlertDialogDescription>This action can not be undone</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={isPending} onClick={handleDeleteClick}>
            {" "}
            {isPending ? "Deleting..." : "Delete"}{" "}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
export { DeleteDialog };

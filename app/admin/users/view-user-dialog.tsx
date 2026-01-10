"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
  phone?: string | null;
  streetAddressHouseNumStreet?: string | null;
  streetAddressLine2?: string | null;
  city?: string | null;
  State?: string | null;
  zip?: string | null;
  isActive: boolean;
  createdAt: Date;
}

const ViewUserDialog = ({ user }: { user: User }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div>{user.id}</div>
          <div>{user.firstName} {user.lastName || ''}</div>
          <div>{user.email}</div>
          <div>{user.role}</div>
          <div>{user.isActive ? 'Active' : 'Suspended'}</div>
          <div>{user.phone || '-'}</div>
          <div>{user.streetAddressHouseNumStreet || '-'}</div>
          <div>{user.streetAddressLine2 || '-'}</div>
          <div>{user.city || '-'}, {user.State || '-'} {user.zip || '-'}</div>
          <div>{new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewUserDialog;

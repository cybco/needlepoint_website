"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/shared/delete-dialog";
import { deleteProduct } from "@/lib/actions/product.actions";
import { toast } from "sonner";
import { Copy, Eye } from "lucide-react";
import { SERVER_URL } from "@/lib/constants";

interface ProductActionsProps {
  productId: string;
  productSlug: string;
  isPrivate: boolean;
  privateSlug: string | null;
}

export default function ProductActions({
  productId,
  productSlug,
  isPrivate,
  privateSlug,
}: ProductActionsProps) {
  const handleCopyLink = () => {
    if (isPrivate && privateSlug) {
      navigator.clipboard.writeText(`${SERVER_URL}/p/${privateSlug}`);
      toast.success("Private link copied!");
    } else {
      navigator.clipboard.writeText(`${SERVER_URL}/product/${productSlug}`);
      toast.success("Product link copied!");
    }
  };

  const previewUrl = isPrivate && privateSlug
    ? `/p/${privateSlug}`
    : `/product/${productSlug}?preview=true`;

  return (
    <div className="flex gap-1">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/products/${productId}`}>Edit</Link>
      </Button>

      {/* Copy Link button - shown for all products */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        title={isPrivate ? "Copy private link" : "Copy product link"}
      >
        <Copy className="h-3 w-3" />
      </Button>

      <Button asChild variant="ghost" size="sm" title="Preview">
        <Link href={previewUrl} target="_blank">
          <Eye className="h-3 w-3" />
        </Link>
      </Button>

      <DeleteDialog id={productId} action={deleteProduct} />
    </div>
  );
}

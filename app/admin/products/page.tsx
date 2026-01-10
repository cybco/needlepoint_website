import Link from "next/link";
import { getAllProducts } from "@/lib/actions/product.actions";
import { formatCurrency, formatId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/shared/pagination";
import ProductActions from "@/components/admin/product-actions";
import { Lock } from "lucide-react";

const AdminProductPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || "";
  const category = searchParams.category || "";
  const products = await getAllProducts({
    query: searchText,
    page,
    category,
    includeUnpublished: true, // Admin sees all products
  });

  return (
    <div className="space-y-2">
      <div className="flex-between">
        <div className="flex items center gap-3">
          <h1 className="h2-bold">Products</h1>
          {searchText && (
            <div className="mt-2 ml-2">
              Filtered by <i>&quot;{searchText}&quot;</i>{" "}
              <Link href="/admin/products">
                <Button variant="outline" size="sm" className="ml-2">
                  Clear Filter
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Button asChild variant="default">
          <Link href="/admin/products/create">Create Product</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.data.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{formatId(product.id)}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {!product.isPublished && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Draft
                    </Badge>
                  )}
                  {product.isPrivate && (
                    <Badge variant="outline" className="border-purple-500 text-purple-600">
                      <Lock className="h-3 w-3 mr-1" /> Private
                    </Badge>
                  )}
                  {product.isPublished && !product.isPrivate && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Published
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell>
                {product.ProductCategory?.[0]?.Category?.displayName || "No category"}
              </TableCell>
              <TableCell>{product.rating}</TableCell>
              <TableCell>
                <ProductActions
                  productId={product.id}
                  productSlug={product.slug}
                  isPrivate={product.isPrivate}
                  privateSlug={product.privateSlug}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {products?.totalPages && products.totalPages > 1 && (
        <Pagination page={page} totalPages={products.totalPages}></Pagination>
      )}
    </div>
  );
};

export default AdminProductPage;

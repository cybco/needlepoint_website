# Implementation Plan: Draft Status & Private Listings

## Overview
Add two product visibility features:
1. **Draft Status**: Products can be "draft" (admin-only) or "published" (public). This will be able to be turned on and off from the product page for each listing.
2. **Private Listings**: Products with unique unguessable URLs, hidden from public listings but purchasable.  There will be a visual indicator in the admin product page for private listings.  when a listing is privte it will also have a copy link button.

## Requirements Summary
- Draft products: Not visible to public, admin preview via `?preview=true`
- Private products: Accessible via `/p/[privateSlug]`, hidden from search/browse, fully purchasable
- No scheduled publishing (manual toggle only)

---

## Step 1: Database Schema Changes

**File:** `prisma/schema.prisma`

Add 3 fields to the Product model (after line 114):

```prisma
isPublished     Boolean           @default(true)
isPrivate       Boolean           @default(false)
privateSlug     String?           @unique(map: "product_private_slug_idx")
```

Then run: `npx prisma db push` or `npx prisma migrate dev`

---

## Step 2: Update Types

**File:** `types/index.ts`

Add to `ProductBase` type:
```typescript
isPublished: boolean;
isPrivate: boolean;
privateSlug: string | null;
```

---

## Step 3: Update Validators

**File:** `lib/validators.ts`

Add to `insertProductSchema`:
```typescript
isPublished: z.boolean().default(true),
isPrivate: z.boolean().default(false),
```

Note: `privateSlug` is auto-generated, not part of form validation.

---

## Step 4: Update Constants

**File:** `lib/constants/index.ts`

Add to `productDefaultValues`:
```typescript
isPublished: true,
isPrivate: false,
```

---

## Step 5: Update Server Actions

**File:** `lib/actions/product.actions.ts`

### 5.1 Add nanoid import and helper
```typescript
import { nanoid } from 'nanoid';

function generatePrivateSlug(): string {
  return nanoid(12);
}
```

### 5.2 Update `getLatestProducts()` (line 33)
Add where clause:
```typescript
where: { isPublished: true, isPrivate: false },
```

### 5.3 Update `getFeaturedProducts()` (line 317)
Update where clause:
```typescript
where: { isFeatured: true, isPublished: true, isPrivate: false },
```

### 5.4 Update `getProductBySlug()` (line 43)
Add preview parameter and visibility check:
```typescript
export async function getProductBySlug(slug: string, options?: { preview?: boolean }) {
  const product = await prisma.product.findFirst({
    where: { slug },
    include: { ProductCategory: { include: { Category: true } } }
  });

  if (!product) return null;

  // Allow access if: preview mode OR (published AND not private)
  if (options?.preview || (product.isPublished && !product.isPrivate)) {
    return product;
  }
  return null;
}
```

### 5.5 Update `getAllProducts()` (line 66)
Add `includeUnpublished` parameter:
```typescript
includeUnpublished = false,
```

Add visibility filter in where clause:
```typescript
const visibilityFilter = includeUnpublished
  ? {}
  : { isPublished: true, isPrivate: false };

// In findMany where:
where: { ...visibilityFilter, ...queryFilter, ...categoryFilter, ...priceFilter, ...ratingFilter },

// Also update count query with same filter
```

### 5.6 Add new function: `getProductByPrivateSlug()`
```typescript
export async function getProductByPrivateSlug(privateSlug: string) {
  return await prisma.product.findFirst({
    where: { privateSlug, isPrivate: true, isPublished: true },
    include: { ProductCategory: { include: { Category: true } } }
  });
}
```

### 5.7 Update `createProduct()` (line 193)
Generate privateSlug when isPrivate is true:
```typescript
const privateSlug = productData.isPrivate ? generatePrivateSlug() : null;

// In tx.product.create data:
data: { ...productData, privateSlug },
```

### 5.8 Update `updateProduct()` (line 240)
Handle privateSlug generation/removal:
```typescript
let privateSlug: string | null = productExists.privateSlug;
if (productData.isPrivate && !productExists.privateSlug) {
  privateSlug = generatePrivateSlug();
} else if (!productData.isPrivate) {
  privateSlug = null;
}

// In tx.product.update data:
data: { ...productData, privateSlug },
```

### 5.9 Add new function: `regeneratePrivateSlug()`
```typescript
export async function regeneratePrivateSlug(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isPrivate: true }
  });
  if (!product) return { success: false, message: "Product not found or not private" };

  const newSlug = generatePrivateSlug();
  await prisma.product.update({
    where: { id: productId },
    data: { privateSlug: newSlug }
  });

  revalidatePath("/admin/products");
  return { success: true, message: "Private URL regenerated", privateSlug: newSlug };
}
```

---

## Step 6: Create Private Product Route

**New File:** `app/(root)/p/[privateSlug]/page.tsx`

```typescript
import { getProductByPrivateSlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
// Import same components as product/[slug]/page.tsx

export async function generateMetadata({ params }) {
  const { privateSlug } = await params;
  const product = await getProductByPrivateSlug(privateSlug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description.substring(0, 160),
    robots: { index: false, follow: false }, // Prevent indexing
  };
}

export default async function PrivateProductPage({ params }) {
  const { privateSlug } = await params;
  const product = await getProductByPrivateSlug(privateSlug);
  if (!product) notFound();

  // Render same product detail layout as public page
}
```

---

## Step 7: Update Public Product Page (Preview Mode)

**File:** `app/(root)/product/[slug]/page.tsx`

Add preview mode support:
```typescript
import { auth } from "@/auth";

// Update page to accept searchParams
export default async function ProductPage({ params, searchParams }) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const isPreviewMode = preview === "true" && isAdmin;

  const product = await getProductBySlug(slug, { preview: isPreviewMode });
  if (!product) notFound();

  return (
    <>
      {!product.isPublished && isAdmin && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center">
          <strong>Preview Mode:</strong> This product is not published.
        </div>
      )}
      {/* Rest of product page */}
    </>
  );
}
```

---

## Step 8: Update Admin Product Form

**File:** `components/admin/product-form.tsx`

Add visibility settings section (after SEO section):

```tsx
{/* Visibility Settings */}
<Card>
  <CardHeader>
    <CardTitle>Visibility Settings</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Published Toggle - allows draft/publish from product page */}
    <FormField
      control={form.control}
      name="isPublished"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel>Published</FormLabel>
            <p className="text-sm text-muted-foreground">
              Toggle to publish or unpublish this product
            </p>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />

    {/* Private Listing Toggle */}
    <FormField
      control={form.control}
      name="isPrivate"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel>Private Listing</FormLabel>
            <p className="text-sm text-muted-foreground">
              Private products have a unique shareable URL
            </p>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />

    {/* Show private URL with Copy Link button when product is private */}
    {type === "Update" && product?.privateSlug && (
      <div className="p-4 bg-muted rounded-lg border-2 border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="h-4 w-4" />
          <p className="text-sm font-medium">Private URL</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={`${window.location.origin}/p/${product.privateSlug}`}
            className="text-xs font-mono"
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/p/${product.privateSlug}`);
              toast.success("Link copied to clipboard!");
            }}
          >
            <CopyIcon className="h-4 w-4 mr-1" /> Copy Link
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={handleRegenerateSlug}
        >
          Regenerate URL
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

---

## Step 9: Update Admin Product List

**File:** `app/admin/products/page.tsx`

### 9.1 Pass `includeUnpublished: true` to getAllProducts()

### 9.2 Add Status column with visual indicators:
```tsx
<TableHead>Status</TableHead>
// ...
<TableCell>
  <div className="flex gap-1">
    {!product.isPublished && (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Draft
      </Badge>
    )}
    {product.isPrivate && (
      <Badge variant="outline" className="border-purple-500 text-purple-600">
        <LockIcon className="h-3 w-3 mr-1" /> Private
      </Badge>
    )}
    {product.isPublished && !product.isPrivate && (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Published
      </Badge>
    )}
  </div>
</TableCell>
```

### 9.3 Add Copy Link button for private listings in actions column:
```tsx
<TableCell className="flex gap-1">
  <Button asChild variant="outline" size="sm">
    <Link href={`/admin/products/${product.id}`}>Edit</Link>
  </Button>

  {/* Copy Link button - only shown for private listings */}
  {product.isPrivate && product.privateSlug && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/p/${product.privateSlug}`);
        toast.success("Private link copied!");
      }}
    >
      <CopyIcon className="h-3 w-3 mr-1" /> Copy Link
    </Button>
  )}

  <Button asChild variant="ghost" size="sm">
    <Link
      href={product.isPrivate ? `/p/${product.privateSlug}` : `/product/${product.slug}?preview=true`}
      target="_blank"
    >
      Preview
    </Link>
  </Button>
  <DeleteDialog id={product.id} action={deleteProduct} />
</TableCell>
```

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `prisma/schema.prisma` | Add 3 fields |
| `types/index.ts` | Add 3 fields to type |
| `lib/validators.ts` | Add 2 fields to schema |
| `lib/constants/index.ts` | Add 2 default values |
| `lib/actions/product.actions.ts` | Update 6 functions, add 2 new |
| `app/(root)/p/[privateSlug]/page.tsx` | **NEW FILE** |
| `app/(root)/product/[slug]/page.tsx` | Add preview mode |
| `app/admin/products/page.tsx` | Add status column, preview button |
| `components/admin/product-form.tsx` | Add visibility settings |

---

## Migration Notes
- All existing products will have `isPublished: true` and `isPrivate: false` by default
- No data migration needed beyond schema push
- Cart/checkout works normally for private products (cart stores product data directly)

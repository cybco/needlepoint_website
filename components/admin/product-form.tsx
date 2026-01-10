"use client";

import { productDefaultValues, SERVER_URL } from "@/lib/constants";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { Product } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ControllerRenderProps, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import slugify from "slugify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { createProduct, updateProduct, regeneratePrivateSlug } from "@/lib/actions/product.actions";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
//import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ProductCategoriesCard } from "./product-categories-card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X, Link as LinkIcon, Copy } from "lucide-react";

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: "Create" | "Update";
  product?: Product;
  productId?: string;
}) => {
  const router = useRouter();
  
  // Initialize categories from product if editing
  const initialCategoryIds = product?.categories?.map(pc => pc.categoryId) || [];
  const initialPrimaryCategoryId = product?.categories?.find(pc => pc.isPrimary)?.categoryId || "";
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>(initialPrimaryCategoryId);
  const [hasCategoryChanges, setHasCategoryChanges] = useState<boolean>(false);
  const [seoKeywords, setSeoKeywords] = useState<string[]>(product?.seoKeywords || []);
  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver:
      type === "Update"
        ? zodResolver(updateProductSchema)
        : zodResolver(insertProductSchema),
    defaultValues: product && type === "Update" ? {
      ...product,
      categoryIds: initialCategoryIds,
      primaryCategoryId: initialPrimaryCategoryId,
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
      seoKeywords: product.seoKeywords || [],
      isPublished: product.isPublished ?? true,
      isPrivate: product.isPrivate ?? false,
    } : {
      ...productDefaultValues,
      categoryIds: [],
      primaryCategoryId: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
      isPublished: true,
      isPrivate: false,
    },
  });

  const handleCategoriesChange = (categoryIds: string[], primaryId: string) => {
    setSelectedCategoryIds(categoryIds);
    setPrimaryCategoryId(primaryId);
    form.setValue("categoryIds", categoryIds);
    form.setValue("primaryCategoryId", primaryId);
  };
  
  const handleCategoryChangesDetected = (hasChanges: boolean) => {
    setHasCategoryChanges(hasChanges);
  };

  const onSubmit: SubmitHandler<z.infer<typeof insertProductSchema>> = async (values) => {
    // Ensure we have the latest category and SEO data
    const submitValues = {
      ...values,
      categoryIds: selectedCategoryIds,
      primaryCategoryId: primaryCategoryId,
      seoKeywords: seoKeywords,
    };
    // on create
    if (type === "Create") {
      const res = await createProduct(submitValues);
      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
        setHasCategoryChanges(false);
        router.push("/admin/products");
      }
    }
    //on update
    if (type === "Update") {
      if (!productId) {
        router.push("/admin/products");
        return;
      }

      const res = await updateProduct({ ...submitValues, id: productId });
      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
        setHasCategoryChanges(false);
        router.push("/admin/products");
      }
    }
  };

  const images = form.watch("images");
  const isFeatured = form.watch("isFeatured");
  const banner = form.watch("banner");
  const seoTitle = form.watch("seoTitle");
  const seoDescription = form.watch("seoDescription");

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !seoKeywords.includes(keywordInput.trim())) {
      const newKeywords = [...seoKeywords, keywordInput.trim()];
      setSeoKeywords(newKeywords);
      form.setValue("seoKeywords", newKeywords);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = seoKeywords.filter(k => k !== keyword);
    setSeoKeywords(newKeywords);
    form.setValue("seoKeywords", newKeywords);
  };

  return (
    <Form {...form}>
      <form method="POST" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "name">;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "slug">;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex-auto">
                      <Input placeholder="Enter slug" {...field} />
                    </div>
                    <div className="flex-auto">
                      <Button
                        type="button"
                        className=" bg-gray-500 hover:bg-gray-600 text-white ml-3"
                        onClick={() => {
                          form.setValue(
                            "slug",
                            slugify(form.getValues("name"), { lower: true })
                          );
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-5">
          {/* brand */}
          <FormField
            control={form.control}
            name="brand"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "brand">;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="Enter brand name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-5">
          {/* price */}
          <FormField
            control={form.control}
            name="price"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "price">;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* stock */}
          <FormField
            control={form.control}
            name="stock"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "stock">;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input placeholder="Enter stock" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-5"></div>
        <div className="upload-field flex flex-col md:flex-row gap-5">
          {/* images */}
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem className="w-full">
                <FormLabel>Images</FormLabel>

                <Card>
                  <CardContent className="space-y-2 mt-2 min-h-48">
                    <div className="flex-start space-x-2">
                      {images.map((image: string) => (
                        <Image
                          key={image}
                          src={image}
                          alt="product image"
                          className="w-20 h-20 object-cover object-center rounded-sm"
                          width={100}
                          height={100}
                        />
                      ))}
                      <FormControl>
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res: { url: string }[]) => {
                            form.setValue("images", [...images, res[0].url]);
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(error.message);
                          }}
                        />
                      </FormControl>
                    </div>
                  </CardContent>
                </Card>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="upload-field">
          {/* is featured */}
          <div className="mb-2">
            <span className="font-medium">Featured Product</span>
            <p className="text-sm text-muted-foreground mt-1">
              Featured products appear in the homepage carousel. A banner image is required for featured products.
            </p>
          </div>
          <Card>
            <CardContent>
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="py-2">Is Featured?</FormLabel>
                  </FormItem>
                )}
              />
              {isFeatured && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Banner Image Required:</strong> Upload a wide banner image for the homepage carousel.
                    Recommended size: <strong>1920 x 680 pixels</strong> (approximately 3:1 aspect ratio).
                  </p>
                  {banner ? (
                    <div className="relative">
                      <Image
                        src={banner}
                        alt="banner image"
                        className="w-full object-cover object-center rounded-sm"
                        width={1920}
                        height={680}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => form.setValue("banner", "")}
                      >
                        Remove Banner
                      </Button>
                    </div>
                  ) : (
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res: { url: string }[]) => {
                        form.setValue("banner", res[0].url);
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(error.message);
                      }}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          {/* description */}
          <FormField
            control={form.control}
            name="description"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof insertProductSchema>,
                "description"
              >;
            }) => (
              <FormItem className="w-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Enter description"
                    className="border-1"
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Categories Card */}
        <ProductCategoriesCard
          selectedCategoryIds={selectedCategoryIds}
          onCategoriesChange={handleCategoriesChange}
          primaryCategoryId={primaryCategoryId}
          onHasChanges={handleCategoryChangesDetected}
        />

        {/* Visibility Settings */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">Visibility Settings</h3>
          <p className="text-sm text-muted-foreground">
            Control how this product is displayed and who can access it.
          </p>

          {/* Published Toggle */}
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Published</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Toggle to publish or unpublish this product. Unpublished products are only visible to admins.
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} />
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
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Private Listing</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Private products have a unique shareable URL and are hidden from search/browse pages.
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} />
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
                  value={`${SERVER_URL}/p/${product.privateSlug}`}
                  className="text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${SERVER_URL}/p/${product.privateSlug}`);
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy Link
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={async () => {
                  const result = await regeneratePrivateSlug(product.id);
                  if (result.success) {
                    toast.success(result.message);
                    router.refresh();
                  } else {
                    toast.error(result.message);
                  }
                }}
              >
                Regenerate URL
              </Button>
            </div>
          )}
        </div>

        {/* SEO Settings */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">SEO Settings</h3>
          <p className="text-sm text-muted-foreground">
            Optimize your product for search engines. Leave empty to use the product name and description.
          </p>

          <FormField
            control={form.control}
            name="seoTitle"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "seoTitle">;
            }) => (
              <FormItem>
                <FormLabel>SEO Title</FormLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  The title shown in search results and browser tabs. Include product name, key features, and brand.
                  <br />
                  <span className="italic">Example: &quot;Wireless Bluetooth Headphones - Noise Cancelling | Pink Clover USA&quot;</span>
                </p>
                <FormControl>
                  <Input
                    placeholder="Product Name - Key Feature | Pink Clover USA"
                    maxLength={60}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {(seoTitle?.length || 0)}/60 characters
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seoDescription"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof insertProductSchema>, "seoDescription">;
            }) => (
              <FormItem>
                <FormLabel>SEO Description</FormLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  A compelling summary shown in search results. Include benefits and a call to action.
                  <br />
                  <span className="italic">Example: &quot;Experience crystal-clear sound with our wireless headphones. Features 40-hour battery life and active noise cancellation. Free shipping available.&quot;</span>
                </p>
                <FormControl>
                  <textarea
                    placeholder="Describe benefits and features to attract clicks from search results"
                    className="border-1 w-full"
                    rows={3}
                    maxLength={160}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {(seoDescription?.length || 0)}/160 characters
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>SEO Keywords</FormLabel>
            <p className="text-xs text-muted-foreground mb-2">
              Search terms customers might use to find this product. Add 5-10 relevant keywords.
              <br />
              <span className="italic">Examples: wireless headphones, bluetooth earbuds, noise cancelling, over-ear headphones</span>
            </p>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Enter a keyword and press Add..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button type="button" onClick={handleAddKeyword} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {seoKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Form errors display */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {Object.entries(form.formState.errors).map(([key, error]) => (
                  <li key={key}>{key}: {error?.message?.toString() || "Invalid value"}</li>
                ))}
              </ul>
            </div>
          )}

          {/* submit */}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={cn(
              "button col-span-2 w-full transition-colors",
              hasCategoryChanges && "bg-green-600 hover:bg-green-700"
            )}
            onClick={() => {
              // Log form errors on click for debugging
              if (Object.keys(form.formState.errors).length > 0) {
                console.log("Form validation errors:", form.formState.errors);
              }
            }}
          >
            {form.formState.isSubmitting ? "Submitting" : `${type} Product`}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;

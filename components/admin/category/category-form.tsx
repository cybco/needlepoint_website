"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertCategorySchema, updateCategorySchema } from "@/lib/validators";
import { createCategory, updateCategory } from "@/lib/actions/category.actions";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { toast as uploadToast } from "sonner";

// Client-side schema that accepts "none" for parentId
const clientInsertCategorySchema = insertCategorySchema.extend({
  parentId: z.union([z.string().uuid("Parent ID must be a valid UUID"), z.literal("none")]).optional(),
});

const clientUpdateCategorySchema = updateCategorySchema.extend({
  parentId: z.union([z.string().uuid("Parent ID must be a valid UUID"), z.literal("none")]).optional(),
});

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
}

interface CategoryFormProps {
  category?: Category | null;
  categories: Category[];
  onClose?: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  categories,
  onClose,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(category?.seoKeywords || []);
  const [keywordInput, setKeywordInput] = useState("");

  const formSchema = category ? clientUpdateCategorySchema : clientInsertCategorySchema;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: category ? {
      ...category,
      parentId: category.parentId || "none",
      seoKeywords: category.seoKeywords || [],
    } : {
      name: "",
      displayName: "",
      slug: "",
      description: "",
      image: "",
      parentId: "none",
      sortOrder: 0,
      isActive: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    const formData = {
      ...data,
      parentId: data.parentId === "none" ? null : data.parentId,
      seoKeywords: keywords,
    };

    const result = category
      ? await updateCategory(formData as z.infer<typeof updateCategorySchema>)
      : await createCategory(formData);

    if (result.success) {
      toast.success(result.message);
      if (onClose) {
        onClose();
      } else {
        router.push("/admin/categories");
      }
    } else {
      toast.error(result.message);
    }

    setIsLoading(false);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Filter out current category from parent options to prevent circular reference
  const parentOptions = categories.filter(c => c.id !== category?.id);
  
  // Watch image field for display purposes
  const imageUrl = form.watch("image");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="electronics" />
                </FormControl>
                <FormDescription>
                  Unique identifier used internally
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Electronics" />
                </FormControl>
                <FormDescription>
                  Name shown to customers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input {...field} placeholder="electronics" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const displayName = form.getValues("displayName");
                        if (displayName) {
                          form.setValue("slug", generateSlug(displayName));
                        }
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  URL-friendly version of the name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ""}
                  placeholder="Category description..." 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="image"
            render={() => (
              <FormItem>
                <FormLabel>Category Image</FormLabel>
                <Card>
                  <CardContent className="space-y-2 mt-2 min-h-32">
                    {imageUrl ? (
                      <div className="relative">
                        <Image
                          src={imageUrl}
                          alt="Category image"
                          className="w-full h-32 object-cover object-center rounded-sm"
                          width={200}
                          height={128}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => form.setValue("image", "")}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <FormControl>
                          <UploadButton
                            endpoint="imageUploader"
                            onClientUploadComplete={(res: { url: string }[]) => {
                              form.setValue("image", res[0].url);
                              uploadToast.success("Image uploaded successfully");
                            }}
                            onUploadError={(error: Error) => {
                              uploadToast.error(error.message);
                            }}
                          />
                        </FormControl>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">SEO Settings</h3>
          
          <FormField
            control={form.control}
            name="seoTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SEO Title</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ""}
                    placeholder="Page title for search engines" 
                    maxLength={60}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/60 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seoDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SEO Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ""}
                    placeholder="Page description for search engines" 
                    rows={2}
                    maxLength={160}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/160 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>SEO Keywords</FormLabel>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword..."
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
              {keywords.map((keyword) => (
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

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Make this category visible to customers
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                router.push("/admin/categories");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
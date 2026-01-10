"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Download, FileText, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createCategory } from "@/lib/actions/category.actions";

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportPreviewItem {
  row: number;
  name: string;
  displayName: string;
  slug: string;
  description?: string;
  parentName?: string;
  isActive: boolean;
  errors: ImportError[];
}

interface CategoryImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryImporter: React.FC<CategoryImporterProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewItem[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const csvTemplate = [
    "name,displayName,slug,description,parentName,isActive",
    "electronics,Electronics,electronics,Electronic products and gadgets,,true",
    "phones,Phones,phones,Mobile phones and accessories,electronics,true",
    "computers,Computers,computers,Laptops and desktop computers,electronics,true",
    "fashion,Fashion,fashion,Clothing and accessories,,true",
    "mens-clothing,Men's Clothing,mens-clothing,Clothing for men,fashion,true",
  ].join("\n");

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ImportPreviewItem[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one data row");
    }

    const headers = lines[0].split(",").map(h => h.trim());
    const requiredHeaders = ["name", "displayName", "slug"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
    }

    const items: ImportPreviewItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const errors: ImportError[] = [];
      
      // Validate required fields
      if (!values[headers.indexOf("name")]) {
        errors.push({ row: i + 1, field: "name", message: "Name is required" });
      }
      if (!values[headers.indexOf("displayName")]) {
        errors.push({ row: i + 1, field: "displayName", message: "Display name is required" });
      }
      if (!values[headers.indexOf("slug")]) {
        errors.push({ row: i + 1, field: "slug", message: "Slug is required" });
      }

      // Validate slug format
      const slug = values[headers.indexOf("slug")];
      if (slug && !/^[a-z0-9-]+$/.test(slug)) {
        errors.push({ 
          row: i + 1, 
          field: "slug", 
          message: "Slug can only contain lowercase letters, numbers, and hyphens" 
        });
      }

      items.push({
        row: i + 1,
        name: values[headers.indexOf("name")] || "",
        displayName: values[headers.indexOf("displayName")] || "",
        slug: values[headers.indexOf("slug")] || "",
        description: values[headers.indexOf("description")] || "",
        parentName: values[headers.indexOf("parentName")] || "",
        isActive: values[headers.indexOf("isActive")]?.toLowerCase() !== "false",
        errors,
      });
    }

    return items;
  };

  const parseJSON = (text: string): ImportPreviewItem[] => {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error("JSON file must contain an array of categories");
    }

    return data.map((item: { name?: string; displayName?: string; slug?: string; description?: string; parentName?: string; isActive?: boolean }, index: number) => {
      const errors: ImportError[] = [];
      const row = index + 1;

      if (!item.name) {
        errors.push({ row, field: "name", message: "Name is required" });
      }
      if (!item.displayName) {
        errors.push({ row, field: "displayName", message: "Display name is required" });
      }
      if (!item.slug) {
        errors.push({ row, field: "slug", message: "Slug is required" });
      }

      // Validate slug format
      if (item.slug && !/^[a-z0-9-]+$/.test(item.slug)) {
        errors.push({ 
          row, 
          field: "slug", 
          message: "Slug can only contain lowercase letters, numbers, and hyphens" 
        });
      }

      return {
        row,
        name: item.name || "",
        displayName: item.displayName || "",
        slug: item.slug || "",
        description: item.description || "",
        parentName: item.parentName || "",
        isActive: item.isActive !== false,
        errors,
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      const text = await file.text();
      let preview: ImportPreviewItem[] = [];

      if (file.name.endsWith(".csv")) {
        preview = parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        preview = parseJSON(text);
      } else {
        throw new Error("Only CSV and JSON files are supported");
      }

      setImportPreview(preview);
      toast.success(`Parsed ${preview.length} categories from ${file.name}`);
    } catch (error) {
      toast.error(`Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`);
      setImportPreview([]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    const validItems = importPreview.filter(item => item.errors.length === 0);
    if (validItems.length === 0) {
      toast.error("No valid categories to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;

    // Import in batches to show progress
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      
      try {
        await createCategory({
          name: item.name,
          displayName: item.displayName,
          slug: item.slug,
          description: item.description || null,
          image: null,
          parentId: null, // TODO: Resolve parent by name
          sortOrder: i,
          isActive: item.isActive,
          seoTitle: null,
          seoDescription: null,
          seoKeywords: [],
        });
        
        successCount++;
      } catch (error) {
        console.error(`Failed to import category ${item.name}:`, error);
        errorCount++;
      }

      setImportProgress(((i + 1) / validItems.length) * 100);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} categories`);
      router.refresh();
      onOpenChange(false);
      setImportPreview([]);
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} categories`);
    }
  };

  const validItems = importPreview.filter(item => item.errors.length === 0);
  const invalidItems = importPreview.filter(item => item.errors.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Categories</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to import categories in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
              <CardDescription>
                Upload a CSV or JSON file containing category data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isImporting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  disabled={isUploading || isImporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {uploadedFileName && (
                <p className="text-sm text-muted-foreground">
                  Uploaded: {uploadedFileName}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Import Progress */}
          {isImporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing categories...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Section */}
          {importPreview.length > 0 && !isImporting && (
            <Card>
              <CardHeader>
                <CardTitle>Import Preview</CardTitle>
                <CardDescription>
                  Review the categories before importing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="flex gap-4">
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    {validItems.length} Valid
                  </Badge>
                  {invalidItems.length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <X className="h-3 w-3" />
                      {invalidItems.length} Invalid
                    </Badge>
                  )}
                </div>

                {/* Errors */}
                {invalidItems.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      {invalidItems.length} categories have validation errors and will be skipped.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview Table */}
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((item) => (
                        <TableRow key={item.row}>
                          <TableCell>{item.row}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.displayName}</TableCell>
                          <TableCell className="font-mono text-sm">{item.slug}</TableCell>
                          <TableCell>
                            {item.errors.length === 0 ? (
                              <Badge variant="default" className="gap-1">
                                <Check className="h-3 w-3" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <X className="h-3 w-3" />
                                Invalid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.errors.length > 0 && (
                              <div className="space-y-1">
                                {item.errors.map((error, index) => (
                                  <div key={index} className="text-xs text-destructive">
                                    {error.field}: {error.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Import Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={validItems.length === 0 || isImporting}
                  >
                    Import {validItems.length} Categories
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryImporter;
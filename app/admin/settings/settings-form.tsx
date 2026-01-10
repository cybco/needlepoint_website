"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSiteSettings } from "@/lib/actions/settings.actions";
import { toast } from "sonner";

type SiteSettings = {
  id: string;
  reviewsEnabled: boolean;
  brandEnabled: boolean;
  updatedAt: Date;
};

const SettingsForm = ({ settings }: { settings: SiteSettings }) => {
  const [reviewsEnabled, setReviewsEnabled] = useState(settings.reviewsEnabled);
  const [brandEnabled, setBrandEnabled] = useState(settings.brandEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (
    field: "reviewsEnabled" | "brandEnabled",
    checked: boolean,
    setter: (value: boolean) => void
  ) => {
    setter(checked);
    startTransition(async () => {
      const result = await updateSiteSettings({ [field]: checked });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setter(!checked); // Revert on error
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            Control whether product reviews are displayed on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reviews-enabled">Enable Reviews</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, reviews and ratings will be hidden from all pages.
              </p>
            </div>
            <Switch
              id="reviews-enabled"
              checked={reviewsEnabled}
              onCheckedChange={(checked) =>
                handleToggle("reviewsEnabled", checked, setReviewsEnabled)
              }
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand</CardTitle>
          <CardDescription>
            Control whether product brand names are displayed on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="brand-enabled">Enable Brand Display</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, brand names will be hidden from product cards and pages.
              </p>
            </div>
            <Switch
              id="brand-enabled"
              checked={brandEnabled}
              onCheckedChange={(checked) =>
                handleToggle("brandEnabled", checked, setBrandEnabled)
              }
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsForm;

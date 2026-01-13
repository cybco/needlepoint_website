import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LicenseKeyDisplay from "./license-key-display";

export const metadata: Metadata = {
  title: "Purchase Complete - NeedlePoint Designer",
  description: "Your license key for NeedlePoint Designer",
};

export default async function PurchaseSuccessPage(props: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await props.searchParams;

  if (!key) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No license key found. Please contact support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-green-600"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <Badge variant="default" className="w-fit mx-auto mb-2">
            Purchase Complete
          </Badge>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
          <CardDescription>
            Your NeedlePoint Designer license is ready
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Your License Key</p>
            <LicenseKeyDisplay licenseKey={key} />
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-semibold">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Download NeedlePoint Designer for your platform</li>
              <li>Open the app and click &quot;Activate License&quot;</li>
              <li>Enter your license key above</li>
              <li>Start designing!</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Important:</strong> A copy of your license key has been sent to your email.
              Save it somewhere safe - you&apos;ll need it to activate on new devices.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button asChild className="flex-1">
              <Link href="/download">Download App</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

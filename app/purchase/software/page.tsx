import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PurchaseButton from "./purchase-button";

export const metadata: Metadata = {
  title: "Purchase NeedlePoint Designer",
  description: "Purchase a license for NeedlePoint Designer software",
};

const SOFTWARE_PRICE = 59.99;

export default async function PurchaseSoftwarePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/purchase/software");
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <Badge variant="secondary" className="w-fit mx-auto mb-2">
            Desktop Software
          </Badge>
          <CardTitle className="text-3xl">NeedlePoint Designer</CardTitle>
          <CardDescription className="text-lg">
            Professional needlepoint pattern design software
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <span className="text-5xl font-bold">${SOFTWARE_PRICE}</span>
            <span className="text-muted-foreground ml-2">USD</span>
          </div>

          <div className="border-t border-b py-4 space-y-3">
            <h3 className="font-semibold text-lg">What&apos;s Included:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckIcon /> Perpetual license (buy once, own forever)
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> All v1.x updates included
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Up to 3 device activations
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Windows, macOS, and iPad support
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Export to PDF (no watermark)
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Email support
              </li>
            </ul>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              <strong>Purchasing as:</strong> {session.user.email}
            </p>
            <p className="mt-1">
              Your license key will be displayed after purchase and sent to your email.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <PurchaseButton
            email={session.user.email!}
            price={SOFTWARE_PRICE}
            userId={session.user.id!}
          />
        </CardFooter>
      </Card>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 text-green-500 flex-shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

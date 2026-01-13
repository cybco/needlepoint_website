import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SoftwareCTA() {
  return (
    <section className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-12 my-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              NeedlePoint Designer
            </h2>
            <p className="text-muted-foreground max-w-md">
              Professional pattern design software for Windows, macOS, and iPad.
              Create stunning needlepoint patterns with ease.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl font-bold">$59.99</span>
            <Button asChild size="lg" className="px-8">
              <Link href="/purchase/software">Get Started</Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              30-day free trial available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

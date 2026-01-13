"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LicenseKeyDisplayProps {
  licenseKey: string;
}

export default function LicenseKeyDisplay({ licenseKey }: LicenseKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-3">
      <code className="text-2xl font-mono font-bold tracking-wider block">
        {licenseKey}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="mx-auto"
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <CopyIcon className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </>
        )}
      </Button>
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

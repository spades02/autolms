"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — user can copy manually
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        Join code
      </span>
      <span className="font-mono font-semibold tracking-wider">{code}</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="h-7 px-2"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

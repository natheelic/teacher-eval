"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Small client leaf so the surrounding overview can stay a server component.
 */
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard unavailable (insecure origin, denied permission) — leave the
      // button in its idle state rather than claiming a copy happened.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label} ${value}`}
      className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4"
    >
      {copied ? "Copied" : label}
      {copied ? (
        <Check className="size-3.5 text-[#16b674]" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

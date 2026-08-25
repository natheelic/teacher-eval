"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { useSearch } from "./SearchProvider";
import { SEARCH_ITEMS } from "./search-data";

export function CommandPalette() {
  const { open, setOpen } = useSearch();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return <CommandPaletteDialog onClose={() => setOpen(false)} />;
}

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ITEMS;
    return SEARCH_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setHighlight(0);
  }

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="flex w-[560px] max-w-[90vw] flex-col overflow-hidden rounded-lg border border-black/8 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-black/8 px-4 py-3">
          <Search className="size-4 text-[#696969]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter" && results[highlight]) {
                navigate(results[highlight].href);
              }
            }}
            placeholder="Search pages..."
            className="w-full text-[13px] font-medium text-[#030303] outline-none placeholder:text-[#696969]"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] font-medium text-[#696969]">
              No results found.
            </p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] font-medium ${
                  i === highlight
                    ? "bg-black/4 text-[#030303]"
                    : "text-[#464646]"
                }`}
              >
                <span>{item.label}</span>
                {i === highlight && (
                  <CornerDownLeft className="size-3.5 text-[#696969]" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

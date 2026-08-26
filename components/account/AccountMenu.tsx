"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { type ThemeMode } from "../theme/useTheme";
import { useSyncedTheme } from "../theme/useSyncedTheme";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

export function AccountMenu({
  initial = "U",
  theme = "SYSTEM",
}: {
  initial?: string;
  theme?: "LIGHT" | "DARK" | "SYSTEM";
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const { mode, setMode } = useSyncedTheme(theme);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogOut() {
    // signOutAction revokes this DeviceSession and redirects to /signin.
    startSignOut(async () => {
      await signOutAction();
    });
  }

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex size-8 items-center justify-center rounded-full border border-black/15 bg-[#fdfdfd] hover:bg-black/4"
      >
        <span className="flex size-[30px] items-center justify-center rounded-md bg-[#030303] text-[13px] font-medium text-white">
          {initial}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 flex w-64 flex-col overflow-hidden rounded-lg border border-black/8 bg-white shadow-lg">
          <Link
            href="/account/preferences"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-[13px] font-medium text-[#030303] hover:bg-black/4"
          >
            Account preferences
          </Link>
          <div className="h-px w-full bg-black/8" />
          <div className="flex flex-col gap-2 p-4">
            <p className="text-[13px] font-medium text-[#030303]">Theme</p>
            <div className="grid grid-cols-3 gap-1 rounded-md border border-black/15 bg-black/[0.02] p-1">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  onClick={() => setMode(option.mode)}
                  className={`flex flex-col items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium ${
                    mode === option.mode
                      ? "bg-white text-[#030303] shadow-sm"
                      : "text-[#696969] hover:text-[#030303]"
                  }`}
                >
                  <option.icon className="size-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-black/8" />
          <button
            onClick={handleLogOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-3 text-left text-[13px] font-medium text-[#ab413e] hover:bg-black/4 disabled:opacity-60"
          >
            <LogOut className="size-3.5" />
            {signingOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

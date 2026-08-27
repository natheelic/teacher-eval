"use client";

import { useEffect, useRef } from "react";
import { useTheme, type ThemeMode } from "./useTheme";
import { updateTheme } from "@/lib/actions/preferences";

const OWNER_KEY = "theme-owner";

export function toThemeMode(value: string): ThemeMode {
  return value === "LIGHT" ? "light" : value === "DARK" ? "dark" : "system";
}

function toDbTheme(mode: ThemeMode): "LIGHT" | "DARK" | "SYSTEM" {
  return mode === "light" ? "LIGHT" : mode === "dark" ? "DARK" : "SYSTEM";
}

/**
 * Bridges the two stores that now hold the theme.
 *
 * localStorage stays the paint-blocking cache that the inline script in
 * app/layout.tsx reads synchronously to avoid a flash; UserPreferences.theme is
 * the durable, cross-device source of truth. Writes go to localStorage first so
 * the UI is instant, then to the database in the background.
 *
 * localStorage is shared by every account that ever signs in on this browser,
 * so the cached value is only trustworthy for whichever account last wrote
 * it — tracked separately via OWNER_KEY. If a different account (or none) is
 * signed in now, the cache is stale and this account's own DB value wins
 * instead, the same way a fresh browser with no cache at all does.
 */
export function useSyncedTheme(dbTheme: "LIGHT" | "DARK" | "SYSTEM", userId: string) {
  const { mode, setMode } = useTheme();
  const adopted = useRef(false);

  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;

    let storedOwner: string | null = null;
    try {
      storedOwner = localStorage.getItem(OWNER_KEY);
    } catch {
      return;
    }
    if (storedOwner !== userId) {
      setMode(toThemeMode(dbTheme));
      try {
        localStorage.setItem(OWNER_KEY, userId);
      } catch {}
    }
  }, [dbTheme, userId, setMode]);

  function setThemeMode(next: ThemeMode) {
    setMode(next); // instant, no flash
    try {
      localStorage.setItem(OWNER_KEY, userId);
    } catch {}
    void updateTheme(toDbTheme(next)); // durable, best effort
  }

  return { mode, setMode: setThemeMode };
}

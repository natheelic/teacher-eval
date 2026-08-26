"use client";

import { useEffect, useRef } from "react";
import { useTheme, type ThemeMode } from "./useTheme";
import { updateTheme } from "@/lib/actions/preferences";

const STORAGE_KEY = "theme";

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
 */
export function useSyncedTheme(dbTheme: "LIGHT" | "DARK" | "SYSTEM") {
  const { mode, setMode } = useTheme();
  const adopted = useRef(false);

  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;

    // On a fresh browser there is no cached value, so take the account's.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!stored) setMode(toThemeMode(dbTheme));
  }, [dbTheme, setMode]);

  function setThemeMode(next: ThemeMode) {
    setMode(next); // instant, no flash
    void updateTheme(toDbTheme(next)); // durable, best effort
  }

  return { mode, setMode: setThemeMode };
}

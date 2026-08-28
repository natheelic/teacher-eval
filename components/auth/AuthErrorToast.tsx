"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/layout/ToastProvider";

/**
 * Announces an error that arrived as a URL parameter rather than as a Server
 * Action result — Auth.js reports provider and callback failures by
 * redirecting to /signin?error=..., which a server component reads on load.
 * Renders nothing; it exists only to get that message into the toast queue,
 * since `useToast` cannot be called from the server component that has it.
 */
export function AuthErrorToast({ message }: { message: string }) {
  const { toast } = useToast();
  // React runs effects twice in development's StrictMode; without this the
  // same failure would be announced twice.
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    toast(message, "danger");
  }, [message, toast]);

  return null;
}

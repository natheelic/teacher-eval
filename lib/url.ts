import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Builds an absolute URL for links that leave the app (email, primarily).
 * Prefers `AUTH_URL` (the canonical origin, same variable Auth.js itself
 * uses) when set; otherwise infers it from the current request, the same
 * fallback Auth.js documents for development in `.env.example`.
 */
export async function absoluteUrl(path: string): Promise<string> {
  if (env.AUTH_URL) return new URL(path, env.AUTH_URL).toString();

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return new URL(path, `${proto}://${host}`).toString();
}

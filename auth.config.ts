import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * The half of the Auth.js config that is safe to run anywhere, including the
 * proxy (Next 16's renamed middleware). It must not import Prisma, bcrypt, or
 * anything else that touches the database or Node built-ins.
 *
 * The Credentials provider and the Prisma adapter live in ./auth.ts instead.
 */
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const authConfig = {
  providers: googleEnabled
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          // Never silently attach a Google login to an existing password
          // account — linking is an explicit, authenticated action instead.
          allowDangerousEmailAccountLinking: false,
        }),
      ]
    : [],

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  session: {
    // Forced by the Credentials provider in ./auth.ts — Auth.js refuses the
    // database strategy when credentials are in play.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * Runs in the proxy. It only ever sees the decoded JWT — no database — so
     * this is a redirect layer, not an authorization layer. Real authorization
     * (revocation, roles, org membership) happens in lib/auth/require-session.
     */
    authorized({ auth, request }) {
      return Boolean(auth?.user) || isPublicPath(request.nextUrl.pathname);
    },
  },
} satisfies NextAuthConfig;

const PUBLIC_PREFIXES = ["/signin", "/signup", "/api/auth"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

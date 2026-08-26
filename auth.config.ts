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
          // Overrides the default id/name/email/image mapping entirely, so
          // those three are reproduced here alongside the split name — Google
          // is the only source that ever gives us given/family name apart.
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              firstName: profile.given_name,
              lastName: profile.family_name ?? null,
            };
          },
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

/**
 * Where a freshly signed-in user lands when nothing else was requested. `/` is
 * the public landing page now, so it cannot be the default — `/dashboard` is
 * the signed-in home for every role; `/users` is the user-management screen
 * reachable from there for managers and admins only.
 */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/**
 * "Public" here means "skip the proxy's session-redirect gate" — for `/api`
 * that's not because the routes are unauthenticated, but because a redirect
 * to an HTML sign-in page makes no sense for a machine client. Every route
 * under app/api/ (NextAuth's own handlers, and bearer-token routes like
 * app/api/me) is responsible for its own auth and its own 401, not the
 * proxy's session cookie check.
 */
const PUBLIC_PREFIXES = ["/signin", "/signup", "/api"];

/**
 * Paths that are public but must match exactly. `/` cannot go in
 * PUBLIC_PREFIXES: the `startsWith(`${prefix}/`)` test below would then make
 * every path in the app public.
 */
const PUBLIC_EXACT = ["/", "/terms"];

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import {
  authConfig,
  isPublicPath,
  DEFAULT_SIGNED_IN_PATH,
} from "@/auth.config";

// Next 16 renamed the `middleware` file convention to `proxy`. This file
// imports only auth.config.ts — never ./auth.ts — so no Prisma or bcrypt is
// pulled into the request-path bundle.
//
// This is a redirect layer, not an authorization layer: it can only see the
// decoded JWT. Revocation and role checks belong in lib/auth/require-session.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user);

  if (isPublicPath(pathname)) {
    // Someone already signed in has no business on /signin or /signup.
    if (signedIn && (pathname === "/signin" || pathname === "/signup")) {
      return NextResponse.redirect(new URL(DEFAULT_SIGNED_IN_PATH, req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!signedIn) {
    const signInUrl = new URL("/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next internals, the favicon, and anything with a file extension —
  // without this, redirects would also swallow CSS, JS and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

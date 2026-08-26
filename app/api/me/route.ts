import { NextResponse } from "next/server";
import { authenticateApiToken, hasScope } from "@/lib/auth/api-token";

// Prisma needs Node built-ins, same as the NextAuth route handler.
export const runtime = "nodejs";

/**
 * The first machine API route — exists to prove `authenticateApiToken()`
 * actually protects something (ROADMAP 2.2), and doubles as the canonical
 * "who does this token act as" check a token holder needs before calling
 * anything else. Requires the `identity:read` scope (ROADMAP 2.5) — a token
 * minted with no scopes authenticates fine but is forbidden here, same as
 * every other route that will ever exist.
 */
export async function GET(request: Request) {
  const auth = await authenticateApiToken(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  if (!hasScope(auth, "identity:read")) {
    return NextResponse.json(
      { error: "Forbidden", requiredScope: "identity:read" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    id: auth.user.id,
    email: auth.user.email,
    role: auth.user.role,
    status: auth.user.status,
  });
}

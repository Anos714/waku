import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic gate in front of the publishing endpoints.
 *
 * Proxy runs before the route handler on every matched request, so it must stay
 * cheap: it only checks that a Better Auth cookie is present. Authorship is
 * decided by the route handler against the database — this just keeps
 * unauthenticated POSTs from reaching it.
 */

const AUTH_COOKIE_MARKER = "better-auth";

export default function proxy(request: NextRequest) {
  if (request.method !== "POST") return NextResponse.next();

  // Covers both the dev cookie (better-auth.session_token) and the prefixed
  // secure variant production sets (__Secure-better-auth.session_token).
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes(AUTH_COOKIE_MARKER));

  if (!hasAuthCookie) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Sign in to publish your profile.",
      },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/profiles", "/api/profiles/:path*"],
};

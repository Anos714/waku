import { NextResponse } from "next/server";
import { socialProviderAvailability } from "@/auth";
import { hasDatabase } from "@/lib/db";

/**
 * Non-sensitive server configuration the editor needs to render its publishing
 * UI honestly: whether accounts are available at all, and which social
 * providers have credentials on this server. No session is involved.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    authEnabled: hasDatabase(),
    providers: socialProviderAvailability(),
  });
}

import { NextResponse } from "next/server";
import { socialProviderAvailability } from "@/auth";
import { hasDatabase } from "@/lib/db";

/**
 * Non-sensitive server configuration the editor needs to render its publishing
 * UI honestly: whether accounts are available at all, which social providers
 * have credentials on this server, and whether the GitHub repo import can run.
 * No session is involved.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authEnabled = hasDatabase();
  const providers = socialProviderAvailability();
  return NextResponse.json({
    ok: true,
    authEnabled,
    providers,
    // Repo import needs both a database (to read the stored GitHub token) and
    // the GitHub OAuth app credentials.
    githubRepos: authEnabled && providers.github,
  });
}
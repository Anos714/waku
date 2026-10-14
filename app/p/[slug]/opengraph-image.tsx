import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { getProfileBySlug, getDemoProfile, isDemoSlug } from "@/lib/profile/profile-data";
import { clampText, initials, isCloudinaryPublicId } from "@/lib/profile/format";
import { publicHost } from "@/lib/site";

/**
 * Per-profile Open Graph image.
 *
 * Every published profile (and the bundled demo) gets a shareable card with
 * its name, role, tagline and photo, so pasting a `/p/<slug>` link into a
 * chat or social network previews the person — not the generic brand image
 * from `app/opengraph-image.tsx`, which this file overrides for the segment.
 * Local drafts are unknowable on the server, so unpublished slugs render an
 * honest "not published yet" card instead of someone else's identity.
 */

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "Waku profile card";

// Profiles can be republished with new content; regenerate at most this often
// instead of trusting the first render forever.
export const revalidate = 300;

const pub = (file: string) => path.join(process.cwd(), "public", file);

const fonts = [
  {
    name: "Geist",
    data: fs.readFileSync(pub("fonts/Geist-Regular.woff")),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Geist",
    data: fs.readFileSync(pub("fonts/Geist-SemiBold.woff")),
    weight: 600 as const,
    style: "normal" as const,
  },
];

const mark = `data:image/png;base64,${fs.readFileSync(pub("brand/waku-mark-192.png")).toString("base64")}`;

const INK = "#1a1a16";
const INK_2 = "#4c4a43";
const INK_3 = "#7d7a70";
const BG = "#f5f3ee";
const SUBTLE = "#ece8e0";
const LINE = "#e0dbd1";

// Loopback, RFC1918 and link-local hosts (including the cloud metadata
// endpoint) are never fetched from the server — published avatar URLs are
// user input, so a crafted URL must not turn this route into a proxy.
const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[::)/i;

/**
 * Maps the two avatar shapes the editor stores to a URL this server can
 * fetch: Cloudinary public IDs resolve through this instance's cloud, and
 * anything else must already be an http(s) image URL on a public host.
 */
function avatarDownloadUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  if (isCloudinaryPublicId(raw)) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    return cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload/${raw}`
      : null;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (PRIVATE_HOST.test(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Fetches an avatar as a base64 data URL Satori can inline, or null. */
async function fetchAvatarDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      // A redirect would re-introduce hosts the check above never approved.
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const mime = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!mime.startsWith("image/")) return null;

    const base64 = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch {
    // Unreachable hosts, slow hosts and non-images all fall back to the
    // monogram — a missing photo must never break the preview.
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  const resolved = profile ?? (isDemoSlug(slug) ? await getDemoProfile() : null);

  const name = resolved?.name.trim() || "Profile not published";
  const role = resolved?.role.trim() || "This Waku profile isn't online yet.";
  const tagline = resolved?.tagline.trim() || "";
  const location = resolved?.location.trim() || "";
  const accent = resolved?.theme.accent || "#c6f24e";

  const downloadUrl = resolved ? avatarDownloadUrl(resolved.avatarUrl) : null;
  const avatar = downloadUrl ? await fetchAvatarDataUrl(downloadUrl) : null;

  const nameSize = name.length <= 14 ? 76 : name.length <= 24 ? 60 : 48;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: BG,
          fontFamily: "Geist",
          color: INK,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            paddingTop: 52,
            paddingBottom: 52,
            paddingLeft: 64,
            paddingRight: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={mark} width={46} height={46} alt="Waku" style={{ borderRadius: 13 }} />
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.5px",
                marginLeft: 14,
              }}
            >
              Waku
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 17,
                color: INK_3,
                marginLeft: 16,
                letterSpacing: "2.4px",
              }}
            >
              IDENTITY STUDIO
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: nameSize,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-2px",
              }}
            >
              {clampText(name, 30)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.3,
                color: INK_2,
                marginTop: 16,
              }}
            >
              {clampText(role, 52)}
            </div>
            {tagline ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 25,
                  lineHeight: 1.4,
                  color: INK_3,
                  marginTop: 12,
                }}
              >
                {clampText(tagline, 96)}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: INK,
                color: BG,
                fontSize: 23,
                fontWeight: 600,
                paddingTop: 13,
                paddingBottom: 13,
                paddingLeft: 28,
                paddingRight: 28,
                borderRadius: 999,
              }}
            >
              {publicHost()}
            </div>
            {location ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 21,
                  color: INK_3,
                  marginLeft: 16,
                }}
              >
                {clampText(location, 40)}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: SUBTLE,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 460,
              height: 460,
              borderRadius: "50%",
              border: `2px solid ${LINE}`,
            }}
          />
          {avatar ? (
            <img
              src={avatar}
              width={380}
              height={380}
              alt={name}
              style={{
                position: "relative",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 380,
                height: 380,
                borderRadius: "50%",
                background: accent,
                color: INK,
                fontSize: 150,
                fontWeight: 600,
                letterSpacing: "-4px",
              }}
            >
              {initials(name)}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}

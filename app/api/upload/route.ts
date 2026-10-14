import { NextResponse } from "next/server";

/**
 * Uploads an image to Cloudinary and returns its public ID.
 *
 * Storing the public ID (rather than a baked-in URL) lets the client request
 * AVIF delivery with a WebP fallback via next-cloudinary, so every browser
 * gets the smallest format it understands.
 *
 * Send `kind=project` for project screenshots (downscaled, never cropped);
 * anything else uses the avatar transform (512px face-cropped square).
 *
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.
 * When any is missing the route reports a clear configuration error instead of
 * failing silently.
 */

export const runtime = "nodejs";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

// Avatars are only ever shown small, so a 512px square is plenty and keeps
// delivery fast. Format is chosen at delivery time, not here.
const AVATAR_TRANSFORMATION = "w_512,c_thumb,g_face,q_auto";
// Project screenshots are shown as small thumbnails but carry UI detail, so
// they are downscaled without cropping — never face-cropped like avatars.
const PROJECT_TRANSFORMATION = "w_800,c_limit,q_auto";

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

function hasCloudinaryConfig() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Cloudinary's signed uploads need an SHA-1 signature over the alphabetically
 * sorted request parameters, with the API secret appended. The signature is
 * computed here so the secret never reaches the browser.
 */
async function signRequest(params: Record<string, string>): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const data = new TextEncoder().encode(`${sorted}${API_SECRET}`);
  const buffer = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  if (!hasCloudinaryConfig()) {
    return error(
      503,
      "MISSING_CLOUDINARY_CONFIG",
      "Photo uploads are not configured on this server.",
      "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local (see .env.example) and restart the dev server.",
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error(400, "BAD_BODY", "The request was not a valid multipart form upload.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return error(400, "NO_FILE", "No file was attached to the upload.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return error(
      415,
      "UNSUPPORTED_TYPE",
      `${file.type || "That file type"} is not a supported image format.`,
      "Use JPG, PNG, WebP, AVIF or GIF.",
    );
  }

  if (file.size > MAX_BYTES) {
    return error(
      413,
      "FILE_TOO_LARGE",
      "That image is larger than 8 MB.",
      "Pick a smaller photo, or crop it first.",
    );
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  // The client may request the project transform via `kind=project`. Anything
  // else falls back to the avatar transform, so callers can never inject an
  // arbitrary Cloudinary transformation.
  const kind = formData.get("kind") === "project" ? "project" : "avatar";
  const transformation =
    kind === "project" ? PROJECT_TRANSFORMATION : AVATAR_TRANSFORMATION;

  try {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("api_key", API_KEY as string);
    payload.append("timestamp", timestamp);
    payload.append("transformation", transformation);

    const signature = await signRequest({ timestamp, transformation });
    payload.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: payload },
    );

    const body = (await response.json()) as {
      public_id?: string;
      secure_url?: string;
      error?: { message?: string };
    };

    if (!response.ok || !body.public_id) {
      return error(
        502,
        "UPLOAD_FAILED",
        "Cloudinary rejected the upload.",
        body.error?.message || "Check that the API key and secret are correct.",
      );
    }

    return NextResponse.json({
      ok: true,
      publicId: body.public_id,
      // Kept for contexts that must render a plain URL (e.g. the PNG export,
      // which inlines image bytes and cannot run the delivery-time transform).
      url: body.secure_url,
    });
  } catch {
    return error(
      500,
      "UPLOAD_ERROR",
      "The upload could not reach Cloudinary.",
      "Check your connection and try again.",
    );
  }
}

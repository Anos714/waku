"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * QR code helpers. Clipboard, share and download utilities live in
 * `lib/profile/share`.
 */

export interface QrColors {
  /** Module color for the dark squares. Defaults to near-black. */
  dark?: string;
  /** Background color behind the code. Defaults to white. */
  light?: string;
}

const DEFAULT_QR_COLORS: Required<QrColors> = {
  dark: "#0a0a0a",
  light: "#ffffff",
};

/**
 * Generates a QR code data URL for a value. Returns null while pending or if
 * generation fails — callers render nothing rather than a broken image.
 */
export function useQrCode(
  value: string,
  width = 320,
  colors: QrColors = {},
): string | null {
  const [resolved, setResolved] = useState<{ value: string; url: string | null }>({
    value: "",
    url: null,
  });

  // Reads resolve asynchronously; the derived value is `null` until the QR for
  // the current `value` has been produced.
  const dataUrl = resolved.value === value ? resolved.url : null;

  const dark = colors.dark ?? DEFAULT_QR_COLORS.dark;
  const light = colors.light ?? DEFAULT_QR_COLORS.light;

  useEffect(() => {
    let active = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark, light },
    })
      .then((url) => {
        if (active) setResolved({ value, url });
      })
      .catch(() => {
        if (active) setResolved({ value, url: null });
      });
    return () => {
      active = false;
    };
  }, [value, width, dark, light]);

  return dataUrl;
}

export async function generateQrDataUrl(
  value: string,
  width = 1024,
  colors: QrColors = {},
): Promise<string | null> {
  try {
    return await QRCode.toDataURL(value, {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: colors.dark ?? DEFAULT_QR_COLORS.dark,
        light: colors.light ?? DEFAULT_QR_COLORS.light,
      },
    });
  } catch {
    return null;
  }
}

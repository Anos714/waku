"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * Generates a QR code data URL for a value. Returns null while pending or if
 * generation fails — callers render nothing rather than a broken image.
 */
export function useQrCode(value: string, width = 320): string | null {
  const [resolved, setResolved] = useState<{ value: string; url: string | null }>({
    value: "",
    url: null,
  });

  // Reads resolve asynchronously; the derived value is `null` until the QR for
  // the current `value` has been produced.
  const dataUrl = resolved.value === value ? resolved.url : null;

  useEffect(() => {
    let active = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
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
  }, [value, width]);

  return dataUrl;
}

export async function generateQrDataUrl(
  value: string,
  width = 1024,
): Promise<string | null> {
  try {
    return await QRCode.toDataURL(value, {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export function useCopy(): {
  copied: boolean;
  copy: (value: string) => Promise<boolean>;
} {
  const [copied, setCopied] = useState(false);
  // Tracked so a pending "clear the copied state" timer can be cancelled —
  // both when copy is called again and when the owner unmounts.
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async (value: string) => {
    if (!value) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } else {
        return false;
      }
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { copied, copy };
}

export function canShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export async function shareUrl(
  url: string,
  title: string,
): Promise<"shared" | "copied" | "failed"> {
  if (canShare()) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      // AbortError is the user dismissing the sheet: nothing happened, and
      // silently copying would surprise them. Any other rejection is a real
      // failure, so the link still goes to the clipboard.
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      if (!cancelled && (await copyToClipboard(url))) return "copied";
      return "failed";
    }
  }
  return (await copyToClipboard(url)) ? "copied" : "failed";
}

/** Triggers a browser download from a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

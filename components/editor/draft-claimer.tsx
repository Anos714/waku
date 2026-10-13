"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "./editor-provider";
import { authClient } from "@/lib/auth-client";
import { readStoredDraft } from "@/lib/profile/storage";

/**
 * Imports this browser's local draft as the signed-in user's first published
 * page, so work done before signing in is never lost.
 *
 * Rendered once inside the editor (not inside a tab), so it also runs on the
 * page load that follows an OAuth callback. The endpoint is idempotent — once
 * the user owns a profile it does nothing — so running it after every sign-in
 * can never create duplicate pages. Renders nothing.
 */
export function DraftClaimer() {
  const { form, setImportedSlug } = useEditor();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const attempted = useRef(false);

  useEffect(() => {
    if (sessionPending || !session) return;
    if (attempted.current) return;
    attempted.current = true;

    const draft = readStoredDraft();
    if (!draft) return;

    void (async () => {
      try {
        const response = await fetch("/api/profiles/claim-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const body = (await response.json()) as {
          ok?: boolean;
          claimed?: boolean;
          slug?: string;
        };

        if (!response.ok || !body.ok || !body.slug) return;
        // Point the draft at its new home so the editor's links, QR code and
        // the next publish all target the live page.
        form.setValue("slug", body.slug, { shouldDirty: true });
        setImportedSlug(body.claimed ? body.slug : null);
      } catch {
        // A failed import is not fatal: the draft is still in this browser and
        // can be published manually from the Share panel.
      }
    })();
  }, [session, sessionPending, form, setImportedSlug]);

  return null;
}

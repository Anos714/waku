"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, FileQuestion } from "@/components/icons/ui-icons";
import { PublicProfile } from "./public-profile";
import { createDemoProfile } from "@/lib/profile/demo";
import { isDemoSlug } from "@/lib/profile/profile-data";
import { readLocalDraftForSlug } from "@/lib/profile/storage";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";

type State =
  | { kind: "loading" }
  | { kind: "local"; profile: Profile }
  | { kind: "demo"; profile: Profile }
  | { kind: "missing" };

const serverSnapshot: State = { kind: "loading" };
let cached: { slug: string; state: State } | null = null;

function readDraft(slug: string): State {
  if (cached && cached.slug === slug) return cached.state;

  const draft = readLocalDraftForSlug(slug);
  // The demo slug has no server row by design (the server cannot see the
  // author's localStorage draft), so it resolves here: the author's draft wins
  // when present, otherwise the bundled demo is the public showcase anyone can
  // visit.
  const state: State = draft
    ? { kind: "local", profile: draft }
    : isDemoSlug(slug)
      ? { kind: "demo", profile: createDemoProfile() }
      : { kind: "missing" };
  cached = { slug, state };
  return state;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Resolves a profile for a slug the server has no published copy of. It reads
 * this browser's saved draft so authors can preview their own work — explicitly
 * labeled a local preview, not a published page. The bundled demo profile is
 * the public fallback for its slug, shown to visitors who have no draft.
 */
export function LocalProfileResolver({ slug }: { slug: string }) {
  const state = useSyncExternalStore(
    subscribe,
    () => readDraft(slug),
    () => serverSnapshot,
  );

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 text-ink-3">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-line-2 border-t-ink"
            aria-hidden="true"
          />
          <p className="text-sm">Looking for a local draft…</p>
        </div>
      </div>
    );
  }

  if (state.kind === "local") {
    return <PublicProfile profile={state.profile} localNote />;
  }

  if (state.kind === "demo") {
    return <PublicProfile profile={state.profile} />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line-2 bg-surface">
          <FileQuestion className="h-6 w-6 text-ink-3" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
          This profile is not online
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          There is no published profile at <span className="font-mono">/p/{slug}</span>, and no
          draft for this slug was found in this browser.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-3">
          Drafts live in this browser until they are published. Only published
          pages are reachable at a public link.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
          <Button asChild>
            <Link href="/create">
              Open the editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/p/ada">See the demo profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

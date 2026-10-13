import Link from "next/link";
import { ArrowRight, Eye } from "@/components/icons/ui-icons";
import { ProfileView } from "./profile-view";
import { WakuLogo } from "@/components/icons/waku-logo";
import type { Profile } from "@/types";

/**
 * Frame around a rendered profile: a small top bar identifying Waku and
 * a footer. Used for both the public route and the local preview.
 */
export function PublicProfile({
  profile,
  localNote = false,
}: {
  profile: Profile;
  localNote?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink transition-opacity hover:opacity-70"
          >
            <WakuLogo variant="mark" className="h-6 w-6" />
            Waku
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/30"
          >
            Create your own
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {localNote ? (
        <div className="border-b border-amber-300/70 bg-amber-50">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2.5 px-5 py-2.5 text-amber-900">
            <Eye className="h-4 w-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">Local preview.</span> This profile
              is loaded from a draft saved in this browser. Nobody else can see
              it yet — deploy Waku with a database to publish it.
            </p>
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-fade-up overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-card">
          <ProfileView profile={profile} avatarSize={88} />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-3">
          Profile page and identity card built with{" "}
          <Link href="/" className="font-medium text-ink-2 underline-offset-2 hover:underline">
            Waku
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

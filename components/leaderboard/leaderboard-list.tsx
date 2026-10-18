import Link from "next/link";
import { Star } from "@/components/icons/ui-icons";
import { PlatformIcon } from "@/components/icons/platform-icons";
import { rankTierFor } from "@/lib/rank/score";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/db";

/**
 * The public rank wall. Every row is an account that connected GitHub, scored on
 * public signal only. Rows link to the person's published page when they have
 * one, and to their GitHub profile otherwise.
 */
export function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-card-sm">
        <p className="text-sm font-medium text-ink">No one is ranked yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-3">
          The leaderboard fills as people sign in and import their GitHub. Be the
          first: build a page and connect GitHub in the editor.
        </p>
        <Link
          href="/create"
          className="mt-4 inline-flex text-sm font-medium text-ink underline underline-offset-4 hover:opacity-70"
        >
          Create your profile
        </Link>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((entry, index) => {
        const tier = rankTierFor(entry.score);
        const href = entry.slug
          ? `/p/${entry.slug}`
          : `https://github.com/${entry.login}`;
        const external = !entry.slug;

        return (
          <li key={entry.userId}>
            <Link
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card-sm transition-colors hover:border-ink/20"
            >
              <span
                className={cn(
                  "w-7 shrink-0 text-center text-sm font-semibold tabular-nums",
                  index < 3 ? "text-ink" : "text-ink-3",
                )}
              >
                {index + 1}
              </span>

              <Avatar name={entry.name} image={entry.image} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {entry.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-3">
                  <PlatformIcon platform="github" className="h-3 w-3 shrink-0" />
                  @{entry.login}
                </p>
              </div>

              <span className="hidden items-center gap-3 text-xs text-ink-3 sm:flex">
                <span className="flex items-center gap-1 tabular-nums">
                  <Star className="h-3 w-3" />
                  {entry.totalStars.toLocaleString()}
                </span>
                <span className="tabular-nums">
                  {entry.followers.toLocaleString()} followers
                </span>
              </span>

              <span className="flex w-24 shrink-0 flex-col items-end">
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {entry.score}
                  <span className="text-xs font-medium text-ink-3">/100</span>
                </span>
                <span className="text-[0.6875rem] font-medium text-ink-3">
                  {tier.label}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-bg">
      {initials || "?"}
    </span>
  );
}
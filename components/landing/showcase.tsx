import Link from "next/link";
import { ArrowUpRight } from "@/components/icons/ui-icons";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { profilePath } from "@/lib/profile/format";
import { resolveTheme } from "@/lib/themes";
import type { Profile } from "@/types";

/**
 * Recently published profiles, as real social proof.
 *
 * Renders nothing when the database is off or empty — an empty grid would look
 * broken, so the section vanishes instead. Cards link to the live pages and
 * carry each profile's own accent so the strip reads as many different people,
 * not one template. The final slot is always a "yours could be here" card, so
 * a short list still fills the grid instead of trailing into blank space.
 */
export function Showcase({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) return null;

  return (
    <section id="showcase" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-ink-3">Showcase</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Live pages, owned by the people behind them.
            </h2>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-accent)" }}
              aria-hidden="true"
            />
            <span className="tabular-nums">{profiles.length}</span> live now
          </span>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.slice(0, 7).map((profile) => (
            <li key={profile.slug} className="flex">
              <ShowcaseCard profile={profile} />
            </li>
          ))}
          <li className="flex">
            <YoursCard />
          </li>
        </ul>
      </div>
    </section>
  );
}

function ShowcaseCard({ profile }: { profile: Profile }) {
  const resolved = resolveTheme(profile.theme);
  const accent = resolved.tokens["--pt-accent"];

  return (
    <Link
      href={profilePath(profile.slug)}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6 pt-7 shadow-card-sm transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-line-2 hover:shadow-card"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 25%, transparent))`,
        }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: `radial-gradient(240px 120px at 50% 0%, color-mix(in oklab, ${accent} 18%, transparent), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3">
        <ProfileAvatar
          name={profile.name}
          src={profile.avatarUrl}
          size={44}
          radius={9999}
          className="ring-1 ring-inset ring-black/10"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            {profile.name}
          </p>
          <p className="truncate text-xs text-ink-3">{profile.role}</p>
        </div>
      </div>

      {profile.tagline ? (
        <p className="relative mt-4 line-clamp-2 text-sm leading-relaxed text-ink-2">
          {profile.tagline}
        </p>
      ) : null}

      {profile.skills.length > 0 ? (
        <ul className="relative mt-4 flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 2).map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium text-ink-2"
            >
              {skill}
            </li>
          ))}
          {profile.skills.length > 2 ? (
            <li className="rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-3">
              +{profile.skills.length - 2}
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="relative mt-auto flex items-center justify-between gap-2 pt-6">
        <span className="truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-[0.6875rem] text-ink-3 transition-colors group-hover:text-ink-2">
          waku.app/p/{profile.slug}
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-ink-3 transition-colors duration-200 group-hover:border-ink/30 group-hover:bg-accent group-hover:text-accent-ink">
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

/** Fills the last grid slot so a short showcase never trails into blanks. */
function YoursCard() {
  return (
    <Link
      href="/create"
      className="group flex h-full w-full flex-col rounded-2xl border border-dashed border-line-2 bg-bg-subtle/40 p-6 transition-colors duration-200 hover:border-ink/30 hover:bg-bg-subtle/80"
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full bg-surface ring-1 ring-inset ring-line transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        <ArrowUpRight className="h-4 w-4 text-ink-2" />
      </span>
      <p className="mt-4 text-sm font-semibold tracking-tight text-ink">
        Yours could be here
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
        Publish a page and it joins this strip the moment it goes live.
      </p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-medium text-ink transition-[gap] duration-200 group-hover:gap-2.5">
        Create yours
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

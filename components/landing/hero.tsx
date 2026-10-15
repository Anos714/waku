"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, Globe, Wand2 } from "@/components/icons/ui-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { publicHost } from "@/lib/site";
import { HeroPreview } from "./hero-preview";
import { ThemeSwitcher, useHeroTheme } from "./theme-switcher";

const EYEBROW_CHIPS = [
  { label: "No setup", Icon: Check },
  { label: "Own your link", Icon: Globe },
  { label: "Export PNG", Icon: Download },
  { label: "AI bio writer", Icon: Wand2 },
] as const;

const MARQUEE_COLORS = ["var(--color-accent)", "#f2622e", "#7dd3c0", "#8fdc6f"];

/** The host used in every illustrated link so it matches the live deploy. */
const HOST = publicHost();

const MARQUEE_SLUGS = [
  "ada",
  "m-okafor",
  "the-draft",
  "noor-k",
  "j-velasquez",
  "ren-ito",
  "priya-s",
  "old-glyph",
  "s-halloran",
  "a-beckett",
];

/**
 * The hero. The headline's final phrase rotates with the theme switcher so the
 * promise and the preview move together; the preview itself is the real
 * renderer on the same `resolveTheme()` path as the editor.
 */
export function Hero({ publishedCount = 0 }: { publishedCount?: number }) {
  const { theme, settings, index, select, paused, setPaused } = useHeroTheme();

  return (
    <section className="relative overflow-hidden">
      <div className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-24 pt-16 md:px-8 md:pb-28 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-10 lg:pb-32 lg:pt-24">
        <div className="flex flex-col items-start">
          {/* Phones get a wrapping row of individual pills — the segmented
              bar needs a single line and overflows into a two-row slab below
              sm. From sm up it tightens to a compact segmented bar so it also
              survives the narrow hero column at the lg breakpoint. */}
          <div className="flex flex-wrap items-center gap-1.5 sm:inline-flex sm:flex-nowrap sm:gap-x-0 sm:gap-y-1 sm:rounded-full sm:border sm:border-line sm:bg-surface/90 sm:p-1 sm:shadow-card-sm">
            {EYEBROW_CHIPS.map((chip, i) => (
              <Fragment key={chip.label}>
                {i > 0 ? (
                  <span
                    className="hidden h-3.5 w-px bg-line sm:mx-0.5 sm:block"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-[0.75rem] font-medium whitespace-nowrap text-ink-2 shadow-card-sm sm:border-0 sm:bg-transparent sm:px-2 sm:shadow-none">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full sm:h-4 sm:w-4",
                      chip.label === "Own your link"
                        ? "bg-accent text-accent-ink"
                        : "text-ink-3",
                    )}
                    aria-hidden="true"
                  >
                    <chip.Icon className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                  </span>
                  {chip.label}
                </span>
              </Fragment>
            ))}
          </div>

          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-ink balance sm:text-6xl lg:text-[4.25rem]">
            Your identity,
            <br />
            beautifully{" "}
            <span className="relative whitespace-nowrap">
              <span key={theme.word} className="relative z-10 inline-block animate-fade-up">
                {theme.word}
              </span>
              <span
                className="absolute inset-x-0 bottom-1.5 -z-0 h-3 sm:h-4"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              />
            </span>
          </h1>

          <p className="mt-7 max-w-md text-lg leading-relaxed text-ink-2">
            Build a profile page and a matching identity card in your browser,
            then sign in to publish it at a link you own:{" "}
            <span className="font-medium text-ink">{HOST}/p/you</span>, which
            anyone can open. Nothing leaves your browser until you publish.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="group animate-shine relative overflow-hidden">
              <Link href="/create">
                Create your profile
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="group">
              <Link href="/create">
                Explore the editor
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          {publishedCount > 0 ? (
            <p className="mt-8 flex items-center gap-2 font-mono text-xs text-ink-3">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-ink-2">{publishedCount.toLocaleString()}</span>{" "}
              profiles published
            </p>
          ) : null}
        </div>

        <div>
          <HeroPreview theme={settings} />
          <ThemeSwitcher
            index={index}
            onSelect={select}
            paused={paused}
            onPause={setPaused}
          />
        </div>
      </div>

      <Marquee />
    </section>
  );
}

/**
 * A slow row of published-style slug chips under the hero. The track is
 * duplicated so the loop is seamless, and it pauses on hover. These are
 * illustrative handles derived from the demo — the real links are the published
 * pages in the showcase below.
 */
function Marquee() {
  const items = [...MARQUEE_SLUGS, ...MARQUEE_SLUGS];

  return (
    <div
      className="border-y border-line bg-surface/60"
      aria-hidden="true"
    >
      <div className="marquee-pause relative flex overflow-hidden py-3.5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex shrink-0 items-center gap-2.5 pr-2.5">
          {items.map((slug, position) => (
            <SlugChip
              key={`${slug}-${position}`}
              slug={slug}
              index={position % MARQUEE_SLUGS.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Three alternating chip treatments so the strip reads as many different
 * people rather than one repeated token: dark link chips, avatar chips, and
 * quiet chips with the slug dimmed until the handle itself.
 */
function SlugChip({ slug, index }: { slug: string; index: number }) {
  const color = MARQUEE_COLORS[index % MARQUEE_COLORS.length];
  const monogram = slug
    .split("-")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const variant = index % 3;

  if (variant === 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-bg-deep px-3.5 py-1.5 font-mono text-xs text-white/70">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {HOST}/p/<span className="font-medium text-white">{slug}</span>
      </span>
    );
  }

  if (variant === 1) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3.5 font-mono text-xs text-ink-3">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[0.5625rem] font-semibold tracking-wide text-accent-ink"
          style={{ background: color }}
        >
          {monogram}
        </span>
        {HOST}/p/<span className="font-medium text-ink">{slug}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-xs text-ink-3">
      {HOST}/p/<span className="font-medium text-ink-2">{slug}</span>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

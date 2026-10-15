"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  Palette,
  Sparkles,
  Frame,
  Globe,
  Check,
  EyeOff,
  FileText,
} from "@/components/icons/ui-icons";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/use-in-view";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import {
  HERO_THEMES,
  dispatchHeroTheme,
} from "@/lib/landing/hero-themes";
import { cn } from "@/lib/utils";
import { publicHost } from "@/lib/site";

const TONES = ["Professional", "Casual", "Minimal", "Creative"];

const BIO_VARIATIONS = [
  {
    style: "Professional",
    text: "Analytical engineer pairing mathematical rigor with writing people can actually follow.",
  },
  {
    style: "Casual",
    text: "I turn dense math into code that runs — and notes humans enjoy reading.",
  },
  {
    style: "Minimal",
    text: "Maths in, machines out. Notes for people.",
  },
];

const LAYOUTS = ["Classic", "Banner", "Minimal", "Split"];

const OWN_POINTS = [
  "Live at a link you own",
  "Republish updates in place",
  "Your draft is claimed on sign-in",
];

/**
 * The feature bento — a true mosaic: one tall card, one wide horizontal card,
 * a dark tile, a lime tile and a full flow visual, instead of a lone hero card
 * beside a stacked column. The theme chips are live: clicking one re-themes
 * the hero preview above through a window event, so the grid is not a dead
 * catalogue. Cards lift on hover and carry a cursor-following accent highlight.
 */
export function Features() {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section id="features" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Designed to be shown, not configured.
        </h2>

        <div
          ref={ref}
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12"
        >
          {/* 1 — AI writing, the tall tile */}
          <BentoCard
            className="md:col-span-2 lg:col-span-5 lg:row-span-2"
            inView={inView}
            delay={0}
          >
            <div className="flex h-full flex-col p-7 md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/25 ring-1 ring-inset ring-accent/60 group-hover:animate-wiggle">
                  <Sparkles className="h-5 w-5 text-ink" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  AI bio generation
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                Three variations written from your role, skills and interests —
                never inventing employers, metrics or credentials. Edit
                anything before it lands on your profile. Or skip the blank
                page — import a PDF resume and review every field before it
                fills the form.
              </p>

              <div
                className="mt-6 flex gap-1 rounded-lg border border-line bg-surface-2 p-1"
                aria-hidden="true"
              >
                {TONES.map((tone, i) => (
                  <span
                    key={tone}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium",
                      i === 0
                        ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                        : "text-ink-3",
                    )}
                  >
                    {tone}
                  </span>
                ))}
              </div>

              <ul className="mt-3 flex flex-col gap-2">
                {BIO_VARIATIONS.map((variation, i) => (
                  <li
                    key={variation.style}
                    className={cn(
                      "rounded-xl border p-3",
                      i === 0
                        ? "border-accent/60 bg-accent/10"
                        : "border-line bg-bg-subtle/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-[0.6875rem] font-semibold uppercase tracking-[0.1em]",
                          i === 0 ? "text-ink" : "text-ink-3",
                        )}
                      >
                        {variation.style}
                      </span>
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.625rem] font-semibold text-accent-ink">
                          <Check className="h-2.5 w-2.5" />
                          Used
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-[0.8125rem] leading-snug",
                        i === 0 ? "text-ink" : "text-ink-2",
                      )}
                    >
                      {variation.text}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-auto rounded-xl border border-line bg-bg-subtle/60 p-4 pt-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-ink-3" />
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Generated tagline
                  </p>
                </div>
                <p className="mt-2 font-serif text-lg italic leading-snug text-ink">
                  “Translating mathematical ideas into instructions a machine
                  can run — and notes a human can read.”
                </p>
              </div>

              <div
                className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-bg-subtle/60 p-3.5"
                aria-hidden="true"
              >
                <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1.5 font-mono text-[0.6875rem] text-ink-2 ring-1 ring-inset ring-line">
                  <FileText className="h-3.5 w-3.5 text-ink-3" />
                  resume.pdf
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                <span className="truncate text-xs text-ink-2">
                  name · role · skills ·{" "}
                  <span className="font-medium text-ink">projects</span>
                </span>
              </div>
            </div>
          </BentoCard>

          {/* 2 — Ownership, the wide horizontal tile with a publish mock */}
          <BentoCard
            className="md:col-span-2 lg:col-span-7"
            inView={inView}
            delay={80}
          >
            <div className="flex h-full flex-col gap-7 p-7 md:p-8 lg:flex-row lg:items-center lg:gap-8">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/25 ring-1 ring-inset ring-accent/60 group-hover:animate-wiggle">
                    <Globe className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    Own your link
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-2">
                  Sign in with GitHub or Google, hit publish, and{" "}
                  <span className="font-mono text-xs">/p/your-name</span> is
                  reachable by anyone — the same URL, updated in place on every
                  republish.
                </p>
                <ul className="mt-4 flex flex-col gap-2">
                  {OWN_POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2.5 text-xs font-medium text-ink-2"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0 rounded-xl border border-line bg-bg-subtle/60 p-4 lg:w-64">
                <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--color-accent)" }}
                    aria-hidden="true"
                  />
                  <span className="truncate font-mono text-xs text-ink-3">
                    {publicHost()}/p/
                    <span className="font-medium text-ink">your-name</span>
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[0.625rem] text-ink-3">
                    republish = same URL
                  </span>
                  <span className="rounded-md bg-accent px-2.5 py-1 text-[0.6875rem] font-semibold text-accent-ink">
                    Publish
                  </span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* 3 — Theming, compact tile; chips re-theme the hero */}
          <BentoCard className="lg:col-span-3" inView={inView} delay={160}>
            <div className="flex h-full flex-col p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 ring-1 ring-inset ring-line-2 group-hover:animate-wiggle">
                  <Palette className="h-5 w-5 text-ink" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  Live themes
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                Four themes, each with its own palette and type. Click one —
                the hero preview re-themes live, no reload.
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {HERO_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => dispatchHeroTheme(theme.id)}
                    className="group inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 text-[0.6875rem] font-medium text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
                    title={`Preview the ${theme.label} theme in the hero`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-sm ring-1 ring-inset ring-black/10"
                      style={{
                        background: `linear-gradient(135deg, ${themeSwatch(theme.id)[0]}, ${themeSwatch(theme.id)[1]})`,
                      }}
                      aria-hidden="true"
                    />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* 4 — Cards, the dark tile */}
          <BentoCard className="lg:col-span-4" inView={inView} delay={240} dark>
            <div className="flex h-full flex-col p-7 text-bg">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15 group-hover:animate-wiggle">
                  <Frame className="h-5 w-5 text-white" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  Shareable cards
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Four card layouts exported at 2× as PNG — photo, name, tagline,
                handles and an optional QR code that opens your page.
              </p>
              <div className="mt-auto flex items-end justify-between gap-4 pt-7">
                <div className="flex flex-col gap-1.5">
                  {LAYOUTS.map((layout) => (
                    <span
                      key={layout}
                      className="text-[0.6875rem] font-medium text-white/55"
                    >
                      {layout}
                    </span>
                  ))}
                </div>
                <div
                  className="h-20 w-28 rounded-lg ring-1 ring-inset ring-white/15"
                  style={{
                    background:
                      "linear-gradient(150deg, color-mix(in oklab, var(--color-accent) 40%, #171714), #171714)",
                  }}
                  aria-hidden="true"
                >
                  <div className="flex h-full flex-col justify-between p-3">
                    <div className="h-6 w-6 rounded-full bg-white/20" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-14 rounded-full bg-white/30" />
                      <div className="h-1.5 w-9 rounded-full bg-white/15" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* 5 — Privacy, a full flow strip across the grid */}
          <BentoCard className="md:col-span-2 lg:col-span-8" inView={inView} delay={320}>
            <div className="flex h-full flex-col gap-6 p-7 md:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 ring-1 ring-inset ring-line-2 group-hover:animate-wiggle">
                    <EyeOff className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    Nothing leaves your browser
                  </h3>
                </div>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-2">
                  Your draft is saved on your machine as you type. Nothing is
                  uploaded anywhere until you decide to publish.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-2"
                aria-hidden="true"
              >
                <span className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-2">
                  draft · saved locally
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                <span className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-2">
                  sign in
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                <span className="rounded-lg bg-accent px-3 py-1.5 font-mono text-xs font-medium text-accent-ink">
                  {publicHost()}/p/you
                </span>
              </div>
            </div>
          </BentoCard>

          {/* 6 — No account, the lime tile */}
          <BentoCard className="md:col-span-2 lg:col-span-4" inView={inView} delay={400} accent>
            <div className="flex h-full flex-col p-7 md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-ink/10 ring-1 ring-inset ring-accent-ink/20 group-hover:animate-wiggle">
                  <FileText className="h-5 w-5 text-accent-ink" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-accent-ink">
                  No account to start
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-accent-ink/75">
                The editor opens on an example profile you can overwrite field
                by field. Sign in with GitHub or Google only when you want it
                live.
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {["Free", "No sign-up", "Nothing to install"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-accent-ink/15 bg-accent-ink/5 px-2.5 py-1 text-[0.6875rem] font-medium text-accent-ink"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/create">
              Open the editor
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Theme swatch pairs for the chip row, matching the resolver's presets. */
function themeSwatch(id: (typeof HERO_THEMES)[number]["id"]): [string, string] {
  switch (id) {
    case "mono":
      return ["#ffffff", "#0a0a0a"];
    case "terminal":
      return ["#0d0f0d", "#8fdc6f"];
    case "aurora":
      return ["#0e1014", "#7dd3c0"];
    case "sunrise":
      return ["#fff8f2", "#f2622e"];
    default:
      return ["#f4f0e8", "#b8460e"];
  }
}

/**
 * A bento tile: lifts on hover with an accent ring, and carries a
 * cursor-following highlight (accent tint on light tiles, white on the lime
 * tile, deeper accent on the dark tile). Entrance is staggered via
 * `animate-fade-up` when the grid enters view. The wiggle is applied by the
 * caller on the icon itself (`animate-wiggle` on group hover).
 */
function BentoCard({
  children,
  className,
  inView,
  delay,
  dark,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  inView: boolean;
  delay: number;
  dark?: boolean;
  accent?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  const spotlight = accent
    ? "radial-gradient(280px 150px at var(--spot-x, 50%) var(--spot-y, 0%), rgba(255,255,255,0.55), transparent 70%)"
    : dark
      ? "radial-gradient(280px 150px at var(--spot-x, 50%) var(--spot-y, 0%), color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 70%)"
      : "radial-gradient(280px 150px at var(--spot-x, 50%) var(--spot-y, 0%), color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 70%)";

  return (
    <article
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-card-sm transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card",
        accent
          ? "border-accent-2 bg-accent hover:border-ink/20"
          : dark
            ? "border-white/10 bg-bg-deep hover:border-white/20"
            : "border-line bg-surface hover:border-line-2",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: spotlight }}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative h-full",
          inView ? "animate-fade-up" : "opacity-0",
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </article>
  );
}

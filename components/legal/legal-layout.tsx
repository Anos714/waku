import type { ReactNode } from "react";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Mail } from "@/components/icons/ui-icons";
import { CONTACT_EMAIL, mailto } from "@/lib/site";

/**
 * Shared shell for the legal pages (privacy, cookies, terms), plus the
 * typographic pieces they compose with.
 *
 * Legal copy is skimmed, not read, so every section is a big heading over a
 * point list: scannable, evenly spaced, and quiet on the page. The landing nav
 * and footer are reused so a legal page still reads as the same product.
 */
export function LegalLayout({
  eyebrow,
  title,
  description,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden="true" />

        <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-14 md:px-8 md:pt-20">
          <div className="border-b border-line pb-10">
            <p className="eyebrow text-ink-3">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">{description}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-3">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              />
              Last updated · {lastUpdated}
            </p>
          </div>

          <div className="legal-prose flex flex-col gap-10 pt-12 sm:gap-12">
            {children}
          </div>

          <StillQuestions />
        </div>
      </main>
      <Footer />
    </>
  );
}

/** One section: a big heading, then whatever the page stacks under it. */
export function Section({
  id,
  title,
  number,
  children,
}: {
  id?: string;
  title: string;
  number?: number;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-baseline gap-3 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {number !== undefined ? (
          <span
            className="select-none font-mono text-sm font-semibold text-ink-3"
            aria-hidden="true"
          >
            {String(number).padStart(2, "0")}
          </span>
        ) : null}
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** A small label for a sub-topic inside a section. */
export function SubLabel({ children }: { children: ReactNode }) {
  return (
    <p className="pt-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
      {children}
    </p>
  );
}

/** A lead paragraph — the bridge between a heading and its point list. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-[0.9375rem] leading-relaxed text-ink-2">{children}</p>;
}

/** A point list. Markers are accent dots rather than bullets — quieter, and
 *  they tie the list to the page's accent without a second palette. */
export function Points({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-2.5">{children}</ul>;
}

export function Point({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-2">
      <span
        className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: "var(--color-accent-2)" }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

/** A closing card: the one thing a reader of a legal page actually wants. */
function StillQuestions() {
  return (
    <div className="mt-16 rounded-2xl border border-line bg-surface p-6 shadow-card-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        Still have questions?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        Write to us. A human reads every message and replies as soon as possible.
      </p>
      <a
        href={mailto(CONTACT_EMAIL)}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line-2 bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/30 hover:bg-surface"
      >
        <Mail className="h-4 w-4" />
        {CONTACT_EMAIL}
      </a>
    </div>
  );
}

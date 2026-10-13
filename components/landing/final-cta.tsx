"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons/ui-icons";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/use-in-view";

/**
 * The closing call. Centered on the deep surface with the accent glow, and
 * honest about the account question: starting needs no account, publishing is
 * what asks for one.
 */
export function FinalCta({ publishedCount = 0 }: { publishedCount?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden border-t border-line bg-bg-deep text-bg">
      <div className="accent-glow pointer-events-none" aria-hidden="true" />
      <div
        ref={ref}
        className={inView ? "animate-fade-up relative" : "relative opacity-0"}
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center md:px-8 md:py-28">
          <h2 className="mx-auto max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-white balance sm:text-5xl">
            Put your identity together today.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65">
            Open the editor, replace the example data, and publish a profile
            page and card at a link you own in a few minutes.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="xl"
              variant="accent"
              className="group animate-shine relative overflow-hidden px-8"
            >
              <Link href="/create">
                Create your profile
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:border-white/40"
            >
              <Link href="/p/ada">See the demo profile</Link>
            </Button>
          </div>

          <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-white/45">
            Free, and no account needed to start — sign in with GitHub or Google
            only when you want to publish.
          </p>

          {publishedCount > 0 ? (
            <p className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-white/40">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-white/60">
                {publishedCount.toLocaleString()}
              </span>{" "}
              profiles published so far
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

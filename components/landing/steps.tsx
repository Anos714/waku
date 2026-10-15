"use client";

import { useInView } from "@/lib/use-in-view";
import { publicHost } from "@/lib/site";

const STEPS = [
  {
    number: "01",
    title: "Add your details",
    body: "Name, role, photo and links. Start from the example profile and replace fields as you go.",
  },
  {
    number: "02",
    title: "Write and theme",
    body: "Generate a bio, pick a theme, font and accent. The preview keeps up with every change.",
  },
  {
    number: "03",
    title: "Publish and share",
    body: `Sign in with GitHub or Google, hit publish, and your page is live at a link you own: ${publicHost()}/p/you. Then grab the QR code and the PNG card. Nothing leaves your browser until you publish.`,
  },
];

/**
 * The three-step explanation. The connectors draw in as the section enters view
 * and the numbers fade up with a small stagger; both collapse to instant under
 * `prefers-reduced-motion`.
 */
export function Steps() {
  const [ref, inView] = useInView<HTMLOListElement>();

  return (
    <section
      id="how-it-works"
      className="border-t border-line bg-surface scroll-mt-16"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Three steps, no setup.
        </h2>

        <ol
          ref={ref}
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3"
        >
          {STEPS.map((step, position) => (
            <li
              key={step.number}
              className="relative bg-surface p-7 md:p-8"
            >
              {/* Connector that draws in from this card into the next. */}
              {position < STEPS.length - 1 ? (
                <span
                  className="absolute top-[3.4rem] left-1/2 hidden h-px w-full origin-left bg-line-2 transition-transform duration-700 ease-out md:block"
                  style={{
                    transform: inView ? "scaleX(1)" : "scaleX(0)",
                    transitionDelay: `${position * 140}ms`,
                  }}
                  aria-hidden="true"
                />
              ) : null}
              <div
                className={
                  inView
                    ? "animate-fade-up flex items-baseline justify-between gap-3"
                    : "flex items-baseline justify-between gap-3 opacity-0"
                }
                style={{ animationDelay: `${position * 140}ms` }}
              >
                <span className="font-mono text-sm font-semibold text-ink-3">
                  {step.number}
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: "var(--color-line)" }}
                  aria-hidden="true"
                />
              </div>
              <h3
                className={
                  inView
                    ? "animate-fade-up mt-5 text-lg font-semibold tracking-tight text-ink"
                    : "mt-5 text-lg font-semibold tracking-tight text-ink opacity-0"
                }
                style={{ animationDelay: `${position * 140 + 60}ms` }}
              >
                {step.title}
              </h3>
              <p
                className={
                  inView
                    ? "animate-fade-up mt-2.5 text-sm leading-relaxed text-ink-2"
                    : "mt-2.5 text-sm leading-relaxed text-ink-2 opacity-0"
                }
                style={{ animationDelay: `${position * 140 + 120}ms` }}
              >
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

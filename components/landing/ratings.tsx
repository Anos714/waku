import Link from "next/link";
import { ArrowUpRight, Star } from "@/components/icons/ui-icons";
import type { Rating } from "@/lib/db";

/**
 * Real visitor ratings as social proof — the counterpart to the showcase strip.
 *
 * Renders nothing until at least one approved rating exists, so a fresh install
 * shows a clean page instead of a hollow "rated 0.0" slab. The section is fed
 * server-side from the landing page's own revalidate window, and a new rating
 * revalidates `/` immediately (see app/api/ratings/route.ts).
 */
export function Ratings({
  ratings,
  average,
  count,
}: {
  ratings: Rating[];
  average: number;
  count: number;
}) {
  if (count === 0 || ratings.length === 0) return null;

  return (
    <section id="ratings" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-ink-3">Loved by builders</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Rated {average.toFixed(1)} out of 5 by the people using it.
            </h2>
          </div>
          <Link
            href="/rate"
            className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
          >
            <span className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={
                    i < Math.round(average)
                      ? "h-3.5 w-3.5 text-accent-2"
                      : "h-3.5 w-3.5 text-line-2"
                  }
                />
              ))}
            </span>
            <span className="tabular-nums">{count}</span>
            <span className="text-ink-3">{count === 1 ? "rating" : "ratings"}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ratings.slice(0, 3).map((rating) => (
            <li key={rating.id} className="flex">
              <QuoteCard rating={rating} />
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link
            href="/rate"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-[gap] duration-200 hover:gap-2.5"
          >
            Read every rating — or leave your own
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ rating }: { rating: Rating }) {
  return (
    <article className="flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card-sm transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-line-2 hover:shadow-card">
      <span className="flex gap-0.5" aria-label={`${rating.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={
              i < rating.rating ? "h-4 w-4 text-accent-2" : "h-4 w-4 text-line-2"
            }
          />
        ))}
      </span>

      {rating.message ? (
        <p className="relative mt-4 line-clamp-3 text-sm leading-relaxed text-ink-2">
          “{rating.message}”
        </p>
      ) : (
        <p className="relative mt-4 text-sm italic leading-relaxed text-ink-3">
          Rated without a note.
        </p>
      )}

      <div className="relative mt-auto flex items-center justify-between gap-2 pt-6">
        <span className="truncate text-sm font-medium text-ink">
          — {rating.authorName}
        </span>
        <time
          dateTime={rating.createdAt.toISOString()}
          className="shrink-0 font-mono text-[0.6875rem] text-ink-3"
        >
          {formatDate(rating.createdAt)}
        </time>
      </div>
    </article>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

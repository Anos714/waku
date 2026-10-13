import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { RatingForm } from "@/components/rating/rating-form";
import { RatingList } from "@/components/rating/rating-list";
import { Star } from "@/components/icons/ui-icons";
import { getRatingStats, listApprovedRatings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Rate Waku",
  description:
    "Rate Waku in stars and leave a public note. Every rating helps the next visitor decide, and the best ones make the landing page.",
};

export const revalidate = 300;

export default async function RatePage() {
  const [ratings, stats] = await Promise.all([
    listApprovedRatings(24),
    getRatingStats(),
  ]);

  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden="true" />

        <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-14 md:px-8 md:pt-20">
          <p className="eyebrow text-ink-3">Rate Waku</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink balance sm:text-5xl">
            Two seconds of your time, a real opinion.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
            No account needed. Star us, leave a note if you feel like it, and it
            goes live right here — the best notes make it to the landing page.
          </p>

          {stats.count > 0 ? (
            <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-card-sm">
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(stats.average)
                        ? "h-5 w-5 text-accent-2"
                        : "h-5 w-5 text-line-2"
                    }
                  />
                ))}
              </span>
              <span className="text-sm">
                <span className="font-semibold tabular-nums text-ink">
                  {stats.average.toFixed(1)}
                </span>
                <span className="text-ink-3"> · </span>
                <span className="tabular-nums text-ink-2">{stats.count}</span>
                <span className="text-ink-3">
                  {" "}
                  {stats.count === 1 ? "rating" : "ratings"}
                </span>
              </span>
            </div>
          ) : null}

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col gap-6">
              <RatingForm average={stats.average} count={stats.count} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-ink">
                  What people say
                </h2>
                <span className="font-mono text-xs text-ink-3">
                  {ratings.length} shown
                </span>
              </div>
              <RatingList ratings={ratings} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

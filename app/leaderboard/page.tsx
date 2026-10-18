import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { listLeaderboard } from "@/lib/db";
import { Sparkles } from "@/components/icons/ui-icons";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "The Waku leaderboard: builders ranked by their public GitHub signal. Sign in, connect GitHub, and your rank is live.",
};

export const revalidate = 300;

export default async function LeaderboardPage() {
  const entries = await listLeaderboard(50);

  return (
    <>
      <Nav />
      <main className="flex-1">
        <div
          className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-24"
          aria-hidden="true"
        />

        <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-14 md:px-8 md:pt-20">
          <p className="eyebrow text-ink-3">Leaderboard</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink balance sm:text-5xl">
            Ranked by what you have actually shipped.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
            Every account that connects GitHub gets a rank, scored on public
            stars, followers, projects and languages. No private data, no
            vanity numbers. Connect GitHub in the editor to join.
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm text-ink-3">
            <Sparkles className="h-4 w-4" />
            <span>
              {entries.length}{" "}
              {entries.length === 1 ? "builder ranked" : "builders ranked"}
            </span>
          </div>

          <div className="mt-6">
            <LeaderboardList entries={entries} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
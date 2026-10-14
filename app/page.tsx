import { Nav } from "@/components/landing/nav";
import { PromoBar } from "@/components/landing/promo-bar";
import { Hero } from "@/components/landing/hero";
import { PromoVideo } from "@/components/landing/promo-video";
import { Steps } from "@/components/landing/steps";
import { Features } from "@/components/landing/features";
import { Showcase } from "@/components/landing/showcase";
import { Ratings } from "@/components/landing/ratings";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { countPublishedProfiles, getRatingStats, listApprovedRatings, listRecentPublished } from "@/lib/db";

/**
 * The landing page.
 *
 * The showcase strip, the ratings section, the published count and the rating
 * stats are read server-side and render nothing when the database is off or
 * empty — a first-time visitor on a fresh checkout sees a page with no social
 * proof rather than a broken one.
 *
 * `revalidate` keeps them fresh: the page is prerendered, then regenerated in
 * the background at most this often, so new publishes and new ratings appear
 * without the visitor hitting the database on every request.
 */
export const revalidate = 300;

export default async function Home() {
  // Every read fails closed ([] / 0) when DATABASE_URL is unset, so they are
  // safe to run unconditionally.
  const [recentProfiles, publishedCount, recentRatings, ratingStats] = await Promise.all([
    listRecentPublished(8),
    countPublishedProfiles(),
    listApprovedRatings(3),
    getRatingStats(),
  ]);

  return (
    <>
      <PromoBar />
      <Nav />
      <main className="flex-1">
        <Hero publishedCount={publishedCount} />
        <PromoVideo />
        <Steps />
        <Features />
        <Showcase profiles={recentProfiles} />
        <Ratings ratings={recentRatings} average={ratingStats.average} count={ratingStats.count} />
        <Faq />
        <FinalCta publishedCount={publishedCount} />
      </main>
      <Footer />
    </>
  );
}

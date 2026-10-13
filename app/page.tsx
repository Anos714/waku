import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { PromoVideo } from "@/components/landing/promo-video";
import { Steps } from "@/components/landing/steps";
import { Features } from "@/components/landing/features";
import { Showcase } from "@/components/landing/showcase";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { countPublishedProfiles, listRecentPublished } from "@/lib/db";

/**
 * The landing page.
 *
 * The showcase strip and the published count are read server-side and render
 * nothing when the database is off or empty — a first-time visitor on a fresh
 * checkout sees a page with no social proof rather than a broken one.
 *
 * `revalidate` keeps both fresh: the page is prerendered, then regenerated in
 * the background at most this often, so new publishes appear without the
 * visitor hitting the database on every request.
 */
export const revalidate = 300;

export default async function Home() {
  // Both reads fail closed (returning [] / 0) when DATABASE_URL is unset, so
  // they are safe to run unconditionally.
  const [recentProfiles, publishedCount] = await Promise.all([
    listRecentPublished(8),
    countPublishedProfiles(),
  ]);

  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero publishedCount={publishedCount} />
        <PromoVideo />
        <Steps />
        <Features />
        <Showcase profiles={recentProfiles} />
        <FinalCta publishedCount={publishedCount} />
      </main>
      <Footer />
    </>
  );
}

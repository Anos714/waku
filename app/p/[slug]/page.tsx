import type { Metadata } from "next";
import { PublicProfile } from "@/components/profile/public-profile";
import { LocalProfileResolver } from "@/components/profile/local-profile-resolver";
import { getDemoProfile, getProfileBySlug, isDemoSlug } from "@/lib/profile/profile-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);

  // The bundled demo is resolved client-side, so the server has no row for its
  // slug — fill its metadata in here so link previews stay correct.
  const resolved = profile ?? (isDemoSlug(slug) ? await getDemoProfile() : null);

  if (!resolved) {
    return {
      title: "Profile not found",
      description: "This Waku profile is not published.",
    };
  }

  const title = `${resolved.name} — ${resolved.role}`.trim();
  const description = resolved.tagline || resolved.bio;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function ProfilePage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const profile = await getProfileBySlug(slug);

  if (profile) {
    // Server-side render for profiles the data layer knows about.
    return <PublicProfile profile={profile} />;
  }

  // Nothing on the server. Resolve in the browser: the author's draft (clearly
  // labeled a local preview), the bundled demo for its slug, or an honest
  // "not online" state.
  return <LocalProfileResolver slug={slug} />;
}

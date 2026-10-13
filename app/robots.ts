import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Robots for crawlers. Everything public is indexable; the API and editor are
 * kept out because they are either machine-only or require a session.
 */

const DISALLOWED = ["/api/", "/create"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}

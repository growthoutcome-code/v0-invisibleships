import type { MetadataRoute } from "next";

/**
 * Explicitly open to crawlers, with the sitemap advertised.
 *
 * The only disallowed path is the counted-download endpoint: /api/corpus is a
 * redirect that records an event, so letting crawlers walk it would inflate the
 * download count with traffic that never read anything. The zip itself stays
 * fetchable at its own URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: "https://www.invisibleships.com/sitemap.xml",
    host: "https://www.invisibleships.com",
  };
}

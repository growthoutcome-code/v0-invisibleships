import type { MetadataRoute } from "next";

/**
 * Explicitly open to crawlers, with the sitemap advertised.
 *
 * The only disallowed path is the counted-download endpoint: /api/corpus is a
 * redirect that records an event, so letting crawlers walk it would inflate the
 * download count with traffic that never read anything. The zip itself stays
 * fetchable at its own URL.
 *
 * /capture is the private recording tool. Nothing there is published and the
 * page carries noindex of its own; this is the belt to that pair of braces.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/capture"] }],
    sitemap: "https://www.invisibleships.com/sitemap.xml",
    host: "https://www.invisibleships.com",
  };
}

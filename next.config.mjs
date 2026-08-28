/** @type {import('next').NextConfig} */

/**
 * The corpus zip is a public static file, so a bookmark or a shared link
 * fetched it without /api/corpus ever running and the download went uncounted.
 * As of 28 August the site had recorded exactly one download; anyone who had
 * the direct URL was invisible.
 *
 * This rewrite sends the bare path to the counted route. The route redirects on
 * to the SAME path carrying ?dl=1, and the `missing` clause below means the
 * rewrite ignores that request — so the static file still serves, straight from
 * the CDN, and nothing loops. No streaming through a function, no file tracing.
 *
 * ?dl=1 is not a secret and is not meant to be. Someone who reads this file can
 * still skip the count; the point is that the ordinary paths — the export
 * dialog, a bookmark, a link a reader was sent — all land on the counter.
 */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/invisible-ships-corpus.zip",
        missing: [{ type: "query", key: "dl" }],
        destination: "/api/corpus?from=direct_link",
      },
    ];
  },
};

export default nextConfig;

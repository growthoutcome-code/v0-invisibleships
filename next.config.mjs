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

  /**
   * The ASN dataset has to travel with the two routes that classify networks.
   *
   * Next.js traces the imports of each route and bundles what it finds; a file
   * read at runtime with fs.readFileSync is invisible to that trace, so without
   * this the routes deploy without the dataset and every location silently
   * becomes 'unknown'. Vercel's own includeFiles in vercel.json does NOT work for
   * Next.js projects — outputFileTracingIncludes is the supported route, and in
   * Next 14 it lives under experimental.
   *
   * ~10 MB against a 250 MB uncompressed function limit. Middleware could not do
   * this: its bundle limit is far smaller and it has no filesystem.
   */
  experimental: {
    outputFileTracingIncludes: {
      "/api/gate": ["./data/GeoLite2-ASN.mmdb"],
      "/api/corpus": ["./data/GeoLite2-ASN.mmdb"],
    },
  },
  async rewrites() {
    // beforeFiles, NOT a bare array.
    //
    // A bare array is `afterFiles`, which Next.js evaluates AFTER filesystem
    // routes. /invisible-ships-corpus.zip is a real file in public/, so it was
    // always matched first and the rewrite never ran — the download stayed
    // uncounted exactly as before. Confirmed against the deployed site: a
    // request for the zip produced no /api/corpus entry in the runtime logs at
    // all. The config was right, the phase was wrong, and nothing in the build
    // or the type system says so.
    //
    // beforeFiles runs ahead of the static file, so the bare path reaches the
    // counter. `missing` keeps ?dl=1 out of it, which is how the route hands the
    // reader on to the real file without looping.
    return {
      beforeFiles: [
        {
          source: "/invisible-ships-corpus.zip",
          missing: [{ type: "query", key: "dl" }],
          destination: "/api/corpus?from=direct_link",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

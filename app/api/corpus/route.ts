import { NextResponse } from "next/server";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";

/**
 * Counted download endpoint for the corpus zip.
 *
 * The Export dialog fires `export_downloaded` client-side, but that only sees
 * clicks inside the dialog. This route records the download server-side and
 * then redirects to the file, so the number stands up if it is ever quoted.
 *
 * Three defects fixed 2026-08-28, all found by auditing the one download the
 * site had actually recorded:
 *
 *  1. WRONG LOCATION. PostHog geolocates from the IP it receives, and the IP it
 *     received was the Vercel function's. The single recorded download reads as
 *     Ashburn, Virginia — AWS us-east-1 — not as the Denver home address that
 *     actually clicked it. Every download would have read as Ashburn forever.
 *     Fixed without forwarding the visitor's IP, which this route has never
 *     done and still does not: Vercel resolves geography at the edge and hands
 *     it over as headers, so the country and city travel and the address does
 *     not. `$geoip_disable` stops PostHog stamping its own guess over the top.
 *
 *  2. UNCOUNTED DOWNLOADS. /invisible-ships-corpus.zip is a public static file.
 *     A bookmark, a shared link, or anyone typing the obvious URL got the
 *     archive without this route ever running. next.config.mjs now rewrites
 *     that path here; this route redirects on to the same path carrying `?dl=1`,
 *     which the rewrite deliberately ignores, so the static file still serves
 *     and nothing loops.
 *
 *  3. COUNTING OURSELVES. The author's own downloads and every preview
 *     deployment counted. The client-side exclusions added in cd111ff never
 *     applied here, because a server route cannot see localStorage. It can see
 *     PostHog's own opt-out cookie and the hostname, and both are checked.
 *
 * Also added: `corpus_files` and `corpus_bytes`, so a download is tied to WHICH
 * build of the archive was taken. When a reader says "my copy shows 311
 * milestones", that identifies the build they have.
 *
 * Privacy: no IP is forwarded, then or now. `distinct_id` reuses the visitor's
 * existing PostHog cookie when present, so the download joins their funnel;
 * otherwise it is attributed to an anonymous per-request id and joins nothing.
 */

const FILE = "/invisible-ships-corpus.zip";
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const PRODUCTION = "www.invisibleships.com";

/** PostHog stores its distinct_id in a cookie named ph_<key>_posthog. */
function distinctIdFromCookie(cookie: string | null): string | null {
  if (!cookie || !KEY) return null;
  const match = cookie.match(new RegExp(`ph_${KEY}_posthog=([^;]+)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return typeof parsed?.distinct_id === "string" ? parsed.distinct_id : null;
  } catch {
    return null;
  }
}

/**
 * posthog.opt_out_capturing() writes __ph_opt_in_out_<key>=0. A reader who has
 * opted out on the site has opted out of this too — an opt-out that stops the
 * pageview but still records the download is not an opt-out.
 */
function optedOut(cookie: string | null): boolean {
  if (!cookie || !KEY) return false;
  return new RegExp(`__ph_opt_in_out_${KEY}=0`).test(cookie);
}

/** Why this request is not counted, or null to count it. */
function excluded(request: Request, hostname: string): string | null {
  if (hostname !== PRODUCTION) return "not production";
  if (optedOut(request.headers.get("cookie"))) return "reader opted out";
  const referer = request.headers.get("referer") || "";
  if (/localhost|127\.0\.0\.1|\.vercel\.app/.test(referer)) return "development referer";
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // ?dl=1 is what next.config.mjs's rewrite deliberately does not catch, so
  // this hands the reader to the real static file instead of back to itself.
  const target = new URL(`${FILE}?dl=1`, url.origin);

  const skip = excluded(request, url.hostname);

  if (KEY && !skip) {
    const cookieId = distinctIdFromCookie(request.headers.get("cookie"));
    const h = request.headers;

    // Fire and forget — a download must never wait on, or fail because of, analytics.
    void fetch(`${HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: KEY,
        event: "corpus_downloaded",
        distinct_id: cookieId || `anon_download_${crypto.randomUUID()}`,
        properties: {
          identified: Boolean(cookieId),
          entry_point: url.searchParams.get("from") || "direct",
          referer: h.get("referer") || "",
          $user_agent: h.get("user-agent") || "",
          $lib: "server",

          // Resolved at Vercel's edge from the visitor's connection. The IP
          // itself is never sent; without these the event carries the serverless
          // function's own location, which is how the only recorded download
          // ended up filed under Ashburn, Virginia.
          $geoip_disable: true,
          country: h.get("x-vercel-ip-country") || "",
          region: h.get("x-vercel-ip-country-region") || "",
          city: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : "",
          timezone: h.get("x-vercel-ip-timezone") || "",

          // Which build of the archive this reader actually took.
          corpus_files: CORPUS_SUMMARY.files,
          corpus_bytes: CORPUS_SUMMARY.zipBytes,
          corpus_generated: CORPUS_SUMMARY.generated,
        },
      }),
    }).catch(() => { /* never block the download */ });
  }

  return NextResponse.redirect(target, 302);
}

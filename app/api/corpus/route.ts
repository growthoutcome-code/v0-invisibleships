import { NextResponse } from "next/server";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import {
  serverDb,
  excludedRequest,
  clientHash,
  distinctIdFromCookie,
  geoFromHeaders,
  isAuthorRequest,
} from "@/lib/server-log";
import { networkTypeFromHeaders } from "@/lib/asn";

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
 * 2026-09-17: the same facts are also written to public.corpus_downloads, so the
 * count survives the analytics vendor. The two writes are independent — the
 * PostHog capture is fire-and-forget and the insert is awaited — and neither is
 * allowed to delay or fail the download. The exclusion rules and the cookie
 * parsing moved to lib/server-log.ts, shared with /api/gate, so the two routes
 * cannot drift into disagreeing about who gets counted.
 *
 * Privacy: no IP is forwarded, then or now. `distinct_id` reuses the visitor's
 * existing PostHog cookie when present, so the download joins their funnel;
 * otherwise it is attributed to an anonymous per-request id and joins nothing.
 * The database row carries only a salted hash of that cookie id.
 */

const FILE = "/invisible-ships-corpus.zip";
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
/** Same id the browser loader uses, so both paths report into one property. */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-VXMCM15XTH";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // ?dl=1 is what next.config.mjs's rewrite deliberately does not catch, so
  // this hands the reader to the real static file instead of back to itself.
  const target = new URL(`${FILE}?dl=1`, url.origin);

  // A PREFETCH IS NOT A DOWNLOAD. Browsers and frameworks speculatively fetch links,
  // and this endpoint has a side effect, so it must say no. Chrome and Next.js send
  // Sec-Purpose: prefetch; older Next sends purpose: prefetch; Moz sends x-moz:
  // prefetch. The footer no longer routes here through next/link, but that fixed one
  // caller and this fixes the class — any future link, card or crawler hint that
  // prefetches will not inflate the count again.
  const purpose = `${request.headers.get("sec-purpose") ?? ""} ${
    request.headers.get("purpose") ?? ""
  } ${request.headers.get("x-moz") ?? ""}`.toLowerCase();
  const prefetch = purpose.includes("prefetch") || purpose.includes("preview");

  const skip = prefetch || excludedRequest(request, url.hostname);
  if (skip) return NextResponse.redirect(target, 302);

  const h = request.headers;
  const cookie = h.get("cookie");
  const cookieId = distinctIdFromCookie(cookie);
  const geo = geoFromHeaders(h);
  const entryPoint = url.searchParams.get("from") || "direct";

  if (KEY) {
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
          entry_point: entryPoint,
          referer: h.get("referer") || "",
          $user_agent: h.get("user-agent") || "",
          $lib: "server",

          // WHY $host IS SET EXPLICITLY, and why 18 downloads read as zero without it.
          //
          // The project's internal-traffic filter requires `$host` to equal the
          // production hostname, and posthog-js sets that automatically from the
          // browser. A server-side capture has no browser, so it never carried one —
          // which meant every download failed the filter and `filterTestAccounts:
          // true` dropped all of them. The events were being recorded correctly and
          // then excluded from every number on /insights. Measured 27 Sep 2026: 18
          // corpus_downloaded events since 25 August, all invisible.
          $host: url.hostname,

          // is_author, so the filter can tell the author's downloads from a reader's.
          // Without it the two are indistinguishable: a server-side event comes from
          // Vercel's own address, so the IP conditions in that filter cannot separate
          // them the way they do for page views. The cookie can.
          //
          // SET ONLY WHEN TRUE, and this is not a style choice. The project's
          // internal-traffic filter tests `is_author` with the operator `is_not_set`.
          // A property that is present with the value `false` is still SET, so writing
          // `is_author: false` for an ordinary reader would fail that condition and
          // exclude their download from every filtered figure on /insights — the exact
          // opposite of the intent. The first version of this line did that. It would
          // have pinned "not the author's" at zero for ever while the total climbed,
          // and nothing would have looked broken.
          //
          // lib/analytics.ts has always done it this way for page views; this now
          // matches, which is the point — two copies of a rule that disagree is how
          // the wrong one survives.
          ...(isAuthorRequest(cookie) ? { is_author: true } : {}),

          // Resolved at Vercel's edge from the visitor's connection. The IP
          // itself is never sent; without these the event carries the serverless
          // function's own location, which is how the only recorded download
          // ended up filed under Ashburn, Virginia.
          $geoip_disable: true,
          country: geo.country || "",
          region: geo.region || "",
          city: geo.city || "",
          timezone: h.get("x-vercel-ip-timezone") || "",

          // Which build of the archive this reader actually took.
          corpus_files: CORPUS_SUMMARY.files,
          corpus_bytes: CORPUS_SUMMARY.zipBytes,
          corpus_generated: CORPUS_SUMMARY.generated,
        },
      }),
    }).catch(() => { /* never block the download */ });
  }

  // GOOGLE ANALYTICS, via the Measurement Protocol.
  //
  // GA's gtag runs in the browser and this download is confirmed on the server, so
  // gtag cannot see it — which is one of the two things GA was structurally blind to.
  // The Measurement Protocol is the server-side path: same fire-and-forget shape as
  // the PostHog capture above, different endpoint.
  //
  // client_id comes out of the visitor's own _ga cookie, which holds it as
  // GA1.1.<client_id>.<timestamp>. Without it GA files the event against a fresh
  // anonymous id and it joins nothing; with it the download lands in the same session
  // as that reader's page views. If the cookie is absent — a direct link, no prior
  // page view — a random id is used and the event still counts, which is the same
  // trade the PostHog path makes.
  //
  // Absent GA_MP_API_SECRET this block does nothing at all, which is the supported
  // state: no crash, no half-sent event, and the download itself never waits on it.
  const gaSecret = process.env.GA_MP_API_SECRET;
  if (gaSecret && GA_MEASUREMENT_ID && !skip) {
    const gaMatch = cookie?.match(/_ga=GA\d\.\d\.(\d+\.\d+)/);
    const clientId = gaMatch?.[1] ?? `${Math.floor(Math.random() * 1e9)}.${Math.floor(Date.now() / 1000)}`;
    void fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${gaSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          // Non-zero engagement time, or GA4 can discard the event as having no
          // session attached. 1ms is the documented minimum that keeps it.
          events: [
            {
              name: "corpus_downloaded",
              params: {
                entry_point: entryPoint,
                corpus_files: CORPUS_SUMMARY.files,
                corpus_bytes: CORPUS_SUMMARY.zipBytes,
                engagement_time_msec: 1,
                // So the author's own downloads can be filtered out in GA4, which has
                // no equivalent of PostHog's project-level internal-traffic filter.
                ...(isAuthorRequest(cookie) ? { is_author: true } : {}),
              },
            },
          ],
        }),
      },
    ).catch(() => {
      /* never block the download */
    });
  }

  const db = serverDb();
  if (db) {
    const { error } = await db.from("corpus_downloads").insert({
      entry_point: entryPoint,
      identified: Boolean(cookieId),
      client_hash: clientHash(cookie),
      is_author: isAuthorRequest(cookie),
      corpus_files: CORPUS_SUMMARY.files,
      corpus_bytes: CORPUS_SUMMARY.zipBytes,
      corpus_generated: CORPUS_SUMMARY.generated,
      network_type: networkTypeFromHeaders(request.headers),
      ...geo,
    });
    if (error) console.error("[corpus-log] insert failed", error.message);
  }

  return NextResponse.redirect(target, 302);
}

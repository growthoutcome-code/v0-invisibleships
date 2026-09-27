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

          // And is_author, so the filter can tell the author's downloads from a
          // reader's. Without it the two are indistinguishable: a server-side event
          // comes from Vercel's own address, so the IP conditions in that filter
          // cannot separate them the way they do for page views. The cookie can.
          is_author: isAuthorRequest(cookie),

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

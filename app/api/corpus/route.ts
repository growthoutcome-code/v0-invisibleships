import { NextResponse } from "next/server";

/**
 * Counted download endpoint for the corpus zip.
 *
 * The Export dialog already fires `export_downloaded` client-side, but that only
 * sees clicks inside the dialog — a shared link, a bookmark, a returning visitor
 * or a script hitting /invisible-ships-corpus.zip directly is invisible. This
 * route records the download server-side and then redirects to the file, so the
 * number stands up if it is ever quoted.
 *
 * No new dependency: PostHog's /capture endpoint accepts the public project key,
 * the same one already shipped to the browser.
 *
 * Privacy: no IP is forwarded. `distinct_id` reuses the visitor's existing
 * PostHog cookie when present, so the download joins their funnel; otherwise it
 * is attributed to an anonymous per-request id and joins nothing.
 */

const FILE = "/invisible-ships-corpus.zip";
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL(FILE, url.origin);

  if (KEY) {
    const cookieId = distinctIdFromCookie(request.headers.get("cookie"));

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
          referer: request.headers.get("referer") || "",
          $user_agent: request.headers.get("user-agent") || "",
          $lib: "server",
        },
      }),
    }).catch(() => { /* never block the download */ });
  }

  return NextResponse.redirect(target, 302);
}

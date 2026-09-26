import { createHash } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side logging of reader-side facts, into tables we own.
 *
 * WHY THIS EXISTS ALONGSIDE POSTHOG. The gate's role answer and the corpus
 * download have only ever lived inside an analytics vendor: no row, no file,
 * nothing queryable with SQL, and nothing that survives the PostHog project
 * being deleted or its retention expiring. The client keeps firing its PostHog
 * events exactly as before; these routes write the same facts to Supabase. The
 * two paths are independent, so one failing does not cost the other.
 *
 * WHAT IS NEVER WRITTEN. No IP, no account, no name, no user agent. Geography
 * is whatever Vercel already resolved at the edge and handed over as headers,
 * so the address itself never reaches this process, let alone the database.
 * `clientHash` is a salted sha256 of the PostHog cookie id: enough to dedupe a
 * double-fire and group one session's rows, useless for identifying anybody,
 * and not reversible into the cookie value.
 *
 * ACCESS MODEL. Both tables have RLS enabled and NO policies at all, so the
 * anon key the browser carries can neither read nor write them. Every write
 * here uses the service-role key, which bypasses RLS and never leaves the
 * server. That key must never take a NEXT_PUBLIC_ prefix.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SALT = process.env.IP_HASH_SALT || "";
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const PRODUCTION_HOST = "www.invisibleships.com";

let _db: SupabaseClient | null = null;

/** Null when the environment is not configured — callers skip logging, never throw. */
export function serverDb(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  if (!_db) {
    _db = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _db;
}

/** PostHog stores its distinct_id in a cookie named ph_<key>_posthog. */
export function distinctIdFromCookie(cookie: string | null): string | null {
  if (!cookie || !POSTHOG_KEY) return null;
  const match = cookie.match(new RegExp(`ph_${POSTHOG_KEY}_posthog=([^;]+)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return typeof parsed?.distinct_id === "string" ? parsed.distinct_id : null;
  } catch {
    return null;
  }
}

/**
 * A salted hash of the analytics cookie id, or null when there is no cookie or
 * no salt. Without IP_HASH_SALT this returns null rather than hashing with an
 * empty salt, because an unsalted hash of a known-format id is reversible by
 * anyone who can guess ids.
 */
export function clientHash(cookie: string | null): string | null {
  const id = distinctIdFromCookie(cookie);
  if (!id || !SALT) return null;
  return createHash("sha256").update(`${id}${SALT}`).digest("hex");
}

/**
 * posthog.opt_out_capturing() writes __ph_opt_in_out_<key>=0. A reader who has
 * opted out of analytics has opted out of this too — a row written for someone
 * who said no is not a smaller violation for being anonymous.
 */
export function optedOut(cookie: string | null): boolean {
  if (!cookie || !POSTHOG_KEY) return false;
  return new RegExp(`__ph_opt_in_out_${POSTHOG_KEY}=0`).test(cookie);
}

/**
 * Why this request is not logged, or null to log it.
 *
 * The client applies its own exclusions (localhost, automation, the standing
 * ?analytics=off opt-out) before it ever calls a route, but a server cannot see
 * localStorage and must not depend on a caller policing itself. This is the
 * guarantee; the client-side check is only the cheap first pass.
 */
export function excludedRequest(request: Request, hostname: string): string | null {
  if (hostname !== PRODUCTION_HOST) return "not production";
  const cookie = request.headers.get("cookie");
  if (optedOut(cookie)) return "reader opted out";
  const referer = request.headers.get("referer") || "";
  if (/localhost|127\.0\.0\.1|\.vercel\.app/.test(referer)) return "development referer";
  return null;
}

/**
 * Whether this request carries the author marker (set by visiting any page with
 * `?author=1`).
 *
 * Marked rows are still written — so the write path can be verified end to end by
 * the one person who needs to verify it — but every public view excludes them.
 * That is a different tool from `?analytics=off`, which stops the row existing at
 * all: use the marker on a device Sean also READS the site on, and the opt-out on
 * a device he only builds it with.
 */
export function isAuthorRequest(cookie: string | null): boolean {
  if (!cookie) return false;
  return /(?:^|;\s*)is_author=1(?:;|$)/.test(cookie);
}

export type Geo = { country: string | null; region: string | null; city: string | null };

/** Resolved by Vercel at the edge. The IP that produced it never reaches here. */
export function geoFromHeaders(h: Headers): Geo {
  const city = h.get("x-vercel-ip-city");
  return {
    country: h.get("x-vercel-ip-country") || null,
    region: h.get("x-vercel-ip-country-region") || null,
    city: city ? decodeURIComponent(city) : null,
  };
}

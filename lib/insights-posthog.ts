/**
 * Visits, read from PostHog.
 *
 * Sean, 26 September: "why are we not showing visits from PostHog?"
 *
 * Because nothing was reading it, not because it cannot be read. PostHog has a
 * query API, and this is the part of the measurement that already has history —
 * the Supabase tables start the day the logging deploys, while PostHog has been
 * recording since 31 July.
 *
 * WHY A TYPED TrendsQuery RATHER THAN HogQL. The project's "filter out internal
 * and test users" setting is what encodes the author's home network, the AT&T
 * range, the VPN exits and every non-production host. Typed queries apply it when
 * asked; raw SQL does not, and would quietly report the author's own building
 * sessions as visits. `filterTestAccounts: true` below is the whole reason these
 * numbers are worth publishing.
 *
 * ALL TIME IS THE HEADLINE. Sean, 26 September: "please count all time visits,
 * let's start there."
 *
 * Safe to do, and I had this wrong first time: the project's test-account filters
 * match on NETWORK AND HOSTNAME, not on a date, so they remove the author from
 * the whole history rather than from the day they were written. All-time with the
 * filter on reads 22 visits across two months, not the 310 pageviews the raw log
 * holds. The number is already the honest one.
 *
 * What the filter cannot remove, and what the page says out loud: a crawler that
 * renders pages counts as a visit, and so does a session of the author from a
 * network nobody listed.
 *
 * Needs POSTHOG_PERSONAL_API_KEY (read-only: query:read and project:read are
 * enough). Without it every function here returns null and the page says
 * measurement is not connected rather than showing a zero.
 */

const HOST = process.env.POSTHOG_API_HOST || "https://us.posthog.com";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT = process.env.POSTHOG_PROJECT_ID || "536751";

/** The day author traffic started being excluded — see the note above. */
export const EXCLUSIONS_SINCE = "2026-08-28";

export type Traffic = {
  visitsAll: number;
  viewsAll: number;
  visits30d: number;
  views30d: number;
  visitsSince: number;
  since: string;
};

type Math = "unique_session" | "total";

async function aggregate(math: Math, dateFrom: string): Promise<number | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          kind: "TrendsQuery",
          series: [{ kind: "EventsNode", event: "$pageview", math }],
          dateRange: { date_from: dateFrom },
          trendsFilter: { display: "BoldNumber" },
          // The one line that makes this publishable — see the note above.
          filterTestAccounts: true,
        },
      }),
      // Five minutes, like everything else on this page: a public number must not
      // put a per-request load on a rate-limited vendor API.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const value = json?.results?.[0]?.aggregated_value;
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}

/** Null when there is no key, or when PostHog cannot be reached. */
export async function getTraffic(): Promise<Traffic | null> {
  if (!KEY) return null;
  const [visitsAll, viewsAll, visits30d, views30d, visitsSince] = await Promise.all([
    // "all" is PostHog's own all-time window, so this starts at the first event
    // the project ever received (31 July 2026) rather than at a date we picked.
    aggregate("unique_session", "all"),
    aggregate("total", "all"),
    aggregate("unique_session", "-30d"),
    aggregate("total", "-30d"),
    aggregate("unique_session", EXCLUSIONS_SINCE),
  ]);
  if (visitsAll === null && visits30d === null && visitsSince === null) return null;
  return {
    visitsAll: visitsAll ?? 0,
    viewsAll: viewsAll ?? 0,
    visits30d: visits30d ?? 0,
    views30d: views30d ?? 0,
    visitsSince: visitsSince ?? 0,
    since: EXCLUSIONS_SINCE,
  };
}

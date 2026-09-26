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
 * SINCE 28 AUGUST, not all time. Before that date nothing was excluded: the
 * traffic audit found 310 pageviews of which roughly 300 were the author. An
 * all-time figure would be a true number that means something false, so the page
 * states the window instead of quietly spending the credibility.
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
  const [visits30d, views30d, visitsSince] = await Promise.all([
    aggregate("unique_session", "-30d"),
    aggregate("total", "-30d"),
    aggregate("unique_session", EXCLUSIONS_SINCE),
  ]);
  if (visits30d === null && visitsSince === null) return null;
  return {
    visits30d: visits30d ?? 0,
    views30d: views30d ?? 0,
    visitsSince: visitsSince ?? 0,
    since: EXCLUSIONS_SINCE,
  };
}

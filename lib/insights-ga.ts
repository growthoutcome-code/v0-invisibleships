import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { RANGES, type RangeKey, type Row, type DayPoint } from "@/lib/insights-posthog";

/**
 * Google Analytics, read through the Data API.
 *
 * WHY THIS EXISTS AT ALL. GA has been on this site since the start, and Sean's
 * PostHog and GA dashboards disagree wildly — 22 sessions against roughly 141.
 * Neither is wrong: PostHog's figures pass through a project-level
 * internal-traffic filter that removes the author, previews and non-production
 * hosts, and GA applies nothing of the kind. Putting both on one page, as two
 * lines, makes that gap visible instead of leaving it as a thing he rediscovers
 * every few weeks.
 *
 * WHAT THIS CANNOT DO, so the page does not imply otherwise:
 *
 *   - It cannot exclude the author. There is no GA equivalent of PostHog's
 *     internal-traffic filter that applies to the API. `is_author` is now sent to
 *     GA as a user property, so the exclusion can be built there as an audience —
 *     but until someone does that in the GA UI, the GA line counts Sean.
 *   - It cannot see the gate's reader question or the corpus download as GA
 *     historically recorded neither. The download now arrives via the Measurement
 *     Protocol, so it will from here; the gate question still has no custom
 *     dimension registered.
 *   - It has no author-excluded variant to offer. The GA line is raw by nature,
 *     and the page says so rather than dressing it up.
 *
 * Credentials come from GOOGLE_APPLICATION_CREDENTIALS_JSON, the whole service
 * account key as a string. Passed explicitly rather than via the library's usual
 * GOOGLE_APPLICATION_CREDENTIALS file path, because Vercel has environment
 * variables and not a writable filesystem to point at.
 *
 * Every failure returns null. A transparency page must not 500 because a vendor
 * had a bad minute, and the page already renders a missing source honestly.
 */

const PROPERTY_ID = process.env.GA_PROPERTY_ID;
const CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

export type GaTraffic = {
  sessions: number;
  views: number;
  users: number;
  /** Daily series for the chart, oldest first. */
  series: DayPoint[];
  pages: Row[];
  downloads: number;
};

/**
 * Cached across invocations. Building the client parses the key and sets up auth,
 * which is wasted work on every render of a page that is hit more than once.
 */
let client: BetaAnalyticsDataClient | null = null;
let clientTried = false;

function getClient(): BetaAnalyticsDataClient | null {
  if (clientTried) return client;
  clientTried = true;
  if (!PROPERTY_ID || !CREDENTIALS_JSON) return null;
  try {
    const credentials = JSON.parse(CREDENTIALS_JSON);
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        // The key arrives with literal \n sequences inside the JSON string when it
        // has been through an environment variable; JSON.parse turns those into real
        // newlines, which is what the auth library needs. If a future paste loses
        // them, this is the line that fails.
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });
  } catch {
    client = null;
  }
  return client;
}

/** Whether GA is readable at all, so the page can say which of the two it has. */
export function gaConfigured(): boolean {
  return Boolean(PROPERTY_ID && CREDENTIALS_JSON);
}

/** GA wants explicit dates; 'all' becomes the earliest the property can hold. */
function gaDateRange(range: RangeKey): { startDate: string; endDate: string } {
  const from = RANGES[range].from;
  if (from === "all") return { startDate: "2020-01-01", endDate: "today" };
  // "-30d" -> "30daysAgo", which is GA's own relative syntax.
  const days = from.replace(/[^0-9]/g, "");
  return { startDate: `${days}daysAgo`, endDate: "today" };
}

export async function getGaTraffic(range: RangeKey = "all"): Promise<GaTraffic | null> {
  const ga = getClient();
  if (!ga) return null;
  const property = `properties/${PROPERTY_ID}`;
  const dateRanges = [gaDateRange(range)];

  try {
    const [daily, top, events] = await Promise.all([
      ga.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }, { name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: 400,
      }),
      ga.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      ga.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        limit: 50,
      }),
    ]);

    const series: DayPoint[] = (daily[0].rows ?? []).map((r) => {
      // GA returns dates as YYYYMMDD with no separators.
      const raw = r.dimensionValues?.[0]?.value ?? "";
      const day = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      return { day, n: Number(r.metricValues?.[0]?.value ?? 0) };
    });

    const sum = (i: number) =>
      (daily[0].rows ?? []).reduce((a, r) => a + Number(r.metricValues?.[i]?.value ?? 0), 0);

    const downloads = (events[0].rows ?? [])
      .filter((r) => r.dimensionValues?.[0]?.value === "corpus_downloaded")
      .reduce((a, r) => a + Number(r.metricValues?.[0]?.value ?? 0), 0);

    return {
      sessions: sum(0),
      views: sum(1),
      users: sum(2),
      series,
      pages: (top[0].rows ?? []).map((r) => ({
        label: r.dimensionValues?.[0]?.value ?? "Unknown",
        n: Number(r.metricValues?.[0]?.value ?? 0),
      })),
      downloads,
    };
  } catch {
    // Most likely causes, in order: the service account was never added as a Viewer
    // on the property, the Data API is not enabled on the Cloud project, or the key
    // JSON did not survive the trip through the environment variable.
    return null;
  }
}

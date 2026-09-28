/**
 * Everything the measurement dashboard reads, from PostHog.
 *
 * Sean, 26 September: top-line metrics, the pages people read, and downloads — a
 * dashboard rather than an essay.
 *
 * NO GEOGRAPHY HERE, on purpose. PostHog resolves a city from the address, which
 * for a reader on a VPN is the VPN's city and not theirs — and the largest row
 * this ever produced was eleven views from Los Angeles, which is one reader on a
 * mobile VPN app. Locations return when a network can be labelled as residential
 * or hosting, classified from a local ASN dataset at write time and stored as that
 * label rather than as an address. That work belongs in our own rows, not here:
 * PostHog pageviews go browser-to-vendor and never pass through a server of ours.
 *
 * WHY A TYPED TrendsQuery AND NOT HogQL, which is the whole reason these numbers
 * can be published: the project's "filter out internal and test users" setting
 * encodes the author's networks, every non-production host, and (since today) any
 * device carrying the author cookie. Typed queries apply it when asked; raw SQL
 * does not, and would put the author's own building sessions on a public page.
 * `filterTestAccounts: true` appears on every query below.
 *
 * Needs POSTHOG_PERSONAL_API_KEY, read-only (query:read). Without it every
 * function returns null and the page says measurement is not connected rather
 * than showing a zero, because a zero is a claim and a missing key is not.
 *
 * Six queries, one batched fetch, cached five minutes. A public page that hits a
 * rate-limited vendor API per request is a denial-of-service lever aimed at your
 * own dashboard.
 */

const HOST = process.env.POSTHOG_API_HOST || "https://us.posthog.com";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT = process.env.POSTHOG_PROJECT_ID || "536751";

/**
 * The date ranges /insights offers. Three, deliberately.
 *
 * No custom picker and no 90-day option: the site has under two months of history,
 * so a 90-day range would be all time wearing a different label, and a custom picker
 * is a control nobody on a page with this much data needs. `all` is the default, and
 * the page says so under the heading.
 */
export const RANGES = {
  all: { label: "All time", from: "all" },
  "30d": { label: "Last 30 days", from: "-30d" },
  "7d": { label: "Last 7 days", from: "-7d" },
} as const;

export type RangeKey = keyof typeof RANGES;

/** Anything unrecognised becomes all time rather than an error or an empty page. */
export function toRange(v: unknown): RangeKey {
  return typeof v === "string" && v in RANGES ? (v as RangeKey) : "all";
}

/**
 * HogQL needs a WHERE clause rather than a dateRange, so the same choice is
 * expressed twice. Kept beside RANGES so the two cannot drift apart.
 */
const SQL_SINCE: Record<RangeKey, string> = {
  all: "",
  "30d": "and timestamp >= now() - interval 30 day",
  "7d": "and timestamp >= now() - interval 7 day",
};

export type Row = { label: string; n: number };

/** One day of a time series. `day` is YYYY-MM-DD so both sources can align on it. */
export type DayPoint = { day: string; n: number };

export type Traffic = {
  visits: number;
  visitors: number;
  views: number;
  visits30: number;
  views30: number;
  pages: Row[];
  /** PostHog's own classification: "Regular", "Bot", "AI Agent", … */
  traffic: Row[];
  /** Downloads that survive the internal-traffic filter — a reader's, not the author's. */
  downloads: number;
  /**
   * Every download recorded, author included.
   *
   * Carried alongside the filtered figure because showing only the filtered one made
   * the page look broken: 18 downloads had happened, 15 of them the author's, and the
   * tile said nothing at all. Zero confirmed reader downloads is the honest headline,
   * but "nothing was ever recorded" is a different claim and it is false.
   */
  downloadsAll: number;
};

type Math = "unique_session" | "total" | "dau";

async function query(body: unknown): Promise<any | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function trends(event: string, math: Math, dateFrom: string, breakdowns?: string[]) {
  return {
    query: {
      kind: "TrendsQuery",
      series: [{ kind: "EventsNode", event, math }],
      dateRange: { date_from: dateFrom },
      trendsFilter: { display: breakdowns ? "ActionsBarValue" : "BoldNumber" },
      filterTestAccounts: true,
      ...(breakdowns
        ? { breakdownFilter: { breakdowns: breakdowns.map((property) => ({ property, type: "event" })) } }
        : {}),
    },
  };
}

/**
 * The same count with the internal-traffic filter off.
 *
 * WHY THIS EXISTS, measured 27 September 2026. `corpus_downloaded` had fired 18 times
 * since 25 August and the downloads tile read zero. Three wrong diagnoses were made
 * before the data settled it:
 *
 *   1. "Tracking is not wired up."  It is. 18 events, most recent the day before.
 *   2. "The internal filter drops them for want of $host."  In HogQL all 18 pass
 *      `{filters}`; only TrendsQuery's filterTestAccounts excludes them, so the two
 *      do not apply the same conditions.
 *   3. "They are all the author's."  Fifteen are — two distinct_ids with 106 and 18
 *      page views, both reporting a Denver browser clock. But three are
 *      `anon_download_*`: no cookie, no page views, a direct hit on the zip URL. There
 *      is no evidence those are the author, and the filtered count of zero hid them.
 *
 * So the filtered figure stays the headline, because it is the conservative one, and
 * this exists so the page can also say how many were recorded in total rather than
 * implying none were.
 */
async function totalUnfiltered(event: string, math: Math, dateFrom: string): Promise<number | null> {
  const body = trends(event, math, dateFrom);
  (body.query as Record<string, unknown>).filterTestAccounts = false;
  const json = await query(body);
  const v = json?.results?.[0]?.aggregated_value;
  return typeof v === "number" ? v : null;
}

async function total(event: string, math: Math, dateFrom: string): Promise<number | null> {
  const json = await query(trends(event, math, dateFrom));
  const v = json?.results?.[0]?.aggregated_value;
  return typeof v === "number" ? v : null;
}

/** Breakdown rows, largest first. `null` breakdown values become "Unknown". */
async function rows(event: string, math: Math, dateFrom: string, breakdowns: string[], limit = 10): Promise<Row[]> {
  const json = await query(trends(event, math, dateFrom, breakdowns));
  const out: Row[] = (json?.results ?? []).map((r: any) => {
    const raw = r.breakdown_value;
    const parts = (Array.isArray(raw) ? raw : [raw]).map((p) =>
      p === null || p === undefined || p === "" || p === "$$_posthog_breakdown_null_$$" ? "Unknown" : String(p),
    );
    // "United States · Los Angeles", and just "Unknown" when nothing resolved.
    const label = parts.every((p) => p === "Unknown") ? "Unknown" : parts.join(" · ");
    return { label, n: Number(r.aggregated_value ?? 0) };
  });
  return out.filter((r) => r.n > 0).sort((a, b) => b.n - a.n).slice(0, limit);
}

export async function getTraffic(range: RangeKey = "all"): Promise<Traffic | null> {
  if (!KEY) return null;
  const from = RANGES[range].from;

  const [visits, visitors, views, visits30, views30, pages, traffic, downloads, downloadsAll] =
    await Promise.all([
    total("$pageview", "unique_session", from),
    total("$pageview", "dau", from),
    total("$pageview", "total", from),
    // The secondary line under the tiles always compares against 30 days, whatever
    // the selected range — except when 30 days IS the range, where the page hides it
    // rather than print a number against itself.
    total("$pageview", "unique_session", "-30d"),
    total("$pageview", "total", "-30d"),
    rows("$pageview", "total", from, ["$pathname"]),
    rows("$pageview", "total", from, ["$virt_traffic_type"], 6),
    total("corpus_downloaded", "total", from),
    totalUnfiltered("corpus_downloaded", "total", from),
  ]);

  if (visits === null && views === null) return null;

  return {
    visits: visits ?? 0,
    visitors: visitors ?? 0,
    views: views ?? 0,
    visits30: visits30 ?? 0,
    views30: views30 ?? 0,
    pages,
    traffic,
    downloads: downloads ?? 0,
    downloadsAll: downloadsAll ?? 0,
  };
}

/** Automated share, for the caption under the locations table. */
export function automated(traffic: Row[]): { bots: number; total: number } {
  const total = traffic.reduce((sum, r) => sum + r.n, 0);
  const bots = traffic
    .filter((r) => /bot|agent|crawler|automation/i.test(r.label))
    .reduce((sum, r) => sum + r.n, 0);
  return { bots, total };
}

/**
 * One row per distinct combination of place and the two clocks, counted in visits.
 *
 * This is the query the trust labels are built on. It reads the four properties
 * PostHog already collects and does no classification itself — `lib/visit-trust.ts`
 * turns a row into a label, so the rule lives in one testable place rather than in
 * SQL nobody can run locally.
 *
 * HogQL rather than TrendsQuery because this needs six dimensions at once, and
 * multiple breakdowns do not stretch that far. `{filters}` with
 * `filterTestAccounts: true` applies the project's own internal-traffic filter, so
 * this stays consistent with every number above it instead of hand-rolling the
 * author exclusion and drifting out of sync with the project settings.
 *
 * Counted by `count(distinct $session_id)` — VISITS, not page views. A reader who
 * opens nine pages is one visit, which is what "where did visits come from" means.
 */
export type VisitGroup = {
  city: string | null;
  region: string | null;
  country: string | null;
  ipTimeZone: string | null;
  browserTimeZone: string | null;
  accuracyKm: number | null;
  visits: number;
};

const VISIT_GROUPS_SQL = `
select
  properties.$geoip_city_name,
  properties.$geoip_subdivision_1_name,
  properties.$geoip_country_code,
  properties.$geoip_time_zone,
  properties.$timezone,
  properties.$geoip_accuracy_radius,
  count(distinct properties.$session_id)
from events
where event = '$pageview' and {filters} {SINCE}
group by 1, 2, 3, 4, 5, 6
order by 7 desc
limit 80
`;

/** Empty array on any failure: a transparency page must not 500 over a vendor. */
/**
 * Daily visits, for the line chart.
 *
 * Separate from getTraffic's headline totals because it needs a different display
 * mode: BoldNumber collapses a series to one aggregate, which is what the tiles
 * want and the opposite of what a chart wants. Same filterTestAccounts as
 * everything else, so the PostHog line is the author-excluded one — which is
 * precisely why it will sit below the GA line, and why the chart says so.
 */
export async function getPostHogSeries(range: RangeKey = "all"): Promise<DayPoint[]> {
  if (!KEY) return [];
  const json = await query({
    query: {
      kind: "TrendsQuery",
      series: [{ kind: "EventsNode", event: "$pageview", math: "unique_session" }],
      dateRange: { date_from: RANGES[range].from },
      interval: "day",
      filterTestAccounts: true,
    },
  });
  const result = json?.results?.[0];
  const days: unknown[] = result?.days ?? [];
  const data: unknown[] = result?.data ?? [];
  return days.map((d, i) => ({
    // PostHog returns "2026-09-27" or an ISO timestamp depending on interval; take
    // the date part either way so this aligns with GA's YYYY-MM-DD.
    day: String(d).slice(0, 10),
    n: Number(data[i] ?? 0),
  }));
}

export async function getVisitGroups(range: RangeKey = "all"): Promise<VisitGroup[]> {
  if (!KEY) return [];
  const json = await query({
    query: {
      kind: "HogQLQuery",
      query: VISIT_GROUPS_SQL.replace("{SINCE}", SQL_SINCE[range]),
      filters: { filterTestAccounts: true },
    },
  });
  const rows: unknown[] = json?.results ?? [];
  const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
  return rows
    .filter((r): r is unknown[] => Array.isArray(r) && r.length >= 7)
    .map((r) => ({
      city: str(r[0]),
      region: str(r[1]),
      country: str(r[2]),
      ipTimeZone: str(r[3]),
      browserTimeZone: str(r[4]),
      // Comes back as a number or a numeric string depending on the column type.
      accuracyKm: r[5] === null || r[5] === undefined || r[5] === "" ? null : Number(r[5]),
      visits: Number(r[6] ?? 0),
    }))
    .filter((g) => g.visits > 0);
}

/**
 * Visits whose address changed part-way through — IP rotation, in the trade.
 *
 * Sean spotted this before it was measured: a visit that appears in one city and
 * leaves from another. The industry term is **IP rotation** (also "rotating proxy",
 * or multi-hop on a consumer VPN). Real causes, roughly in order of likelihood here:
 * a VPN client switching server mid-session, a rotating residential proxy, Apple's
 * iCloud Private Relay reassigning an egress, a Tor circuit rebuilding every ten
 * minutes, or a phone moving between carrier gateways.
 *
 * WHY IT EARNS ITS OWN SECTION. It is the most conclusive relay evidence available
 * and the easiest to grasp without knowing anything about time zones: nobody travels
 * from Denver to Secaucus inside one reading session. The clock comparison in
 * lib/visit-trust.ts infers a relay; this observes one. Measured 27 Sep 2026 — six
 * visits crossed cities, one of them three cities over 29 page views, and six more
 * changed address without changing city.
 *
 * `argMin`/`argMax` over the timestamp give the city the visit ENTERED on and the one
 * it LEFT on, which is what makes the row legible. `groupUniqArray` was tried first
 * and rejected: it returns no guaranteed order, so "Denver | Chicago | Secaucus" did
 * not mean the visit went that way.
 *
 * No session id is returned. The row is a pair of place names and a count, which is
 * the same class of data as the locations table above it.
 */
export type ShuffledVisit = {
  enteredAt: string | null;
  exitedAt: string | null;
  cities: number;
  addresses: number;
  views: number;
};

const SHUFFLED_SQL = `
select
  argMin(properties.$geoip_city_name, timestamp),
  argMax(properties.$geoip_city_name, timestamp),
  count(distinct properties.$geoip_city_name),
  count(distinct properties.$ip),
  count(*)
from events
where event = '$pageview' and {filters} {SINCE}
group by properties.$session_id
having count(distinct properties.$geoip_city_name) > 1
    or count(distinct properties.$ip) > 1
order by count(distinct properties.$geoip_city_name) desc, count(*) desc
limit 25
`;

export async function getShuffledVisits(range: RangeKey = "all"): Promise<ShuffledVisit[]> {
  if (!KEY) return [];
  const json = await query({
    query: {
      kind: "HogQLQuery",
      query: SHUFFLED_SQL.replace("{SINCE}", SQL_SINCE[range]),
      filters: { filterTestAccounts: true },
    },
  });
  const rows: unknown[] = json?.results ?? [];
  const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
  return rows
    .filter((r): r is unknown[] => Array.isArray(r) && r.length >= 5)
    .map((r) => ({
      enteredAt: str(r[0]),
      exitedAt: str(r[1]),
      cities: Number(r[2] ?? 0),
      addresses: Number(r[3] ?? 0),
      views: Number(r[4] ?? 0),
    }));
}

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

export type Row = { label: string; n: number };

export type Traffic = {
  visits: number;
  visitors: number;
  views: number;
  visits30: number;
  views30: number;
  pages: Row[];
  /** PostHog's own classification: "Regular", "Bot", "AI Agent", … */
  traffic: Row[];
  downloads: number;
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

export async function getTraffic(): Promise<Traffic | null> {
  if (!KEY) return null;

  const [visits, visitors, views, visits30, views30, pages, traffic, downloads] = await Promise.all([
    total("$pageview", "unique_session", "all"),
    total("$pageview", "dau", "all"),
    total("$pageview", "total", "all"),
    total("$pageview", "unique_session", "-30d"),
    total("$pageview", "total", "-30d"),
    rows("$pageview", "total", "all", ["$pathname"]),
    rows("$pageview", "total", "all", ["$virt_traffic_type"], 6),
    total("corpus_downloaded", "total", "all"),
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
where event = '$pageview' and {filters}
group by 1, 2, 3, 4, 5, 6
order by 7 desc
limit 80
`;

/** Empty array on any failure: a transparency page must not 500 over a vendor. */
export async function getVisitGroups(): Promise<VisitGroup[]> {
  if (!KEY) return [];
  const json = await query({
    query: {
      kind: "HogQLQuery",
      query: VISIT_GROUPS_SQL,
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

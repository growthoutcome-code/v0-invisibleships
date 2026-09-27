import { serverDb } from "@/lib/server-log";

/**
 * Reader for the public insights page.
 *
 * Reads ONLY the `insights_*` views, never the underlying tables. Those views
 * exclude author-marked rows, so the exclusion cannot be forgotten by a future
 * page, export, or query — it is a property of the source rather than of the
 * caller.
 *
 * Everything here is an aggregate. No row-level data reaches the page, so there
 * is nothing on it that could identify a reader even by accident: no IP (none is
 * ever stored), no city, no path, no timestamps finer than a week.
 */

export type Insights = {
  configured: boolean;
  gateRows: number;
  downloadRows: number;
  firstGateEvent: string | null;
  firstDownload: string | null;
  funnel: { event: string; n: number }[];
  roles: { visitor_role: string; n: number }[];
  countries: { country: string; n: number }[];
  weeks: { week: string; n: number }[];
  locations: Location[];
};

/**
 * One place readers reached the gate from, with the network it came over.
 *
 * `network` is never optional and never blank. The page is not allowed to print a
 * city without saying whether it can be trusted, so the view coalesces a missing
 * classification to 'unknown' rather than null and this type has no room for
 * anything else.
 */
export type Location = {
  country: string;
  region: string;
  city: string;
  network: "hosting" | "direct" | "unknown";
  visitors: number;
};

const EMPTY: Insights = {
  configured: false,
  gateRows: 0,
  downloadRows: 0,
  firstGateEvent: null,
  firstDownload: null,
  funnel: [],
  roles: [],
  countries: [],
  weeks: [],
  locations: [],
};

export async function getInsights(): Promise<Insights> {
  const db = serverDb();
  // Not configured is a normal state, not an error: the page says so plainly
  // rather than failing, because a transparency page that 500s tells a reader
  // nothing except that something is broken.
  if (!db) return EMPTY;

  const [meta, funnel, roles, countries, weeks, locations] = await Promise.all([
    db.from("insights_meta").select("*").maybeSingle(),
    db.from("insights_gate_funnel").select("event, n"),
    db.from("insights_gate_roles").select("visitor_role, n"),
    db.from("insights_downloads_by_country").select("country, n"),
    db.from("insights_downloads_by_week").select("week, n"),
    // Capped: the page is a summary, and a long tail of one-visit cities is both
    // less useful and more identifying than the head of the list.
    db.from("insights_locations").select("country, region, city, network_type, visitors").limit(25),
  ]);

  return {
    configured: true,
    gateRows: Number(meta.data?.gate_rows ?? 0),
    downloadRows: Number(meta.data?.download_rows ?? 0),
    firstGateEvent: meta.data?.first_gate_event ?? null,
    firstDownload: meta.data?.first_download ?? null,
    funnel: (funnel.data ?? []).map((r) => ({ event: String(r.event), n: Number(r.n) })),
    roles: (roles.data ?? []).map((r) => ({ visitor_role: String(r.visitor_role), n: Number(r.n) })),
    countries: (countries.data ?? []).map((r) => ({ country: String(r.country), n: Number(r.n) })),
    weeks: (weeks.data ?? []).map((r) => ({ week: String(r.week), n: Number(r.n) })),
    locations: (locations.data ?? []).map((r) => ({
      country: String(r.country),
      region: String(r.region),
      city: String(r.city),
      // Anything the database has that this union does not becomes 'unknown'.
      // A label the page cannot render must not fall through as a blank one.
      network:
        r.network_type === "hosting" || r.network_type === "direct" ? r.network_type : "unknown",
      visitors: Number(r.visitors),
    })),
  };
}

/** The four gate steps, in the order a reader meets them. */
export const FUNNEL_STEPS: { event: string; label: string; note: string }[] = [
  { event: "gate_opened", label: "Met the gate", note: "the notice appeared" },
  { event: "role_selected", label: "Answered who they are", note: "optional, unverified" },
  { event: "role_declined", label: "Skipped the question", note: "or chose not to say" },
  { event: "entered", label: "Entered the archive", note: "read the disclaimer through" },
];

/**
 * Split locations into the ones that are readers and the ones that are exit nodes.
 *
 * WHAT THIS IS FOR, in one line: a city may be shown, but never in a way that
 * implies a reader is there when a server is.
 *
 * There were two separate problems with showing geography on this site, and the
 * history matters because the second fix over-corrected for the first.
 *
 *   1. A MISLEADING RANKING. One sorted list mixing reader cities with VPN exit
 *      cities reads as an audience map. The largest row this table ever had was 11
 *      views from Los Angeles — one reader on a mobile VPN. The biggest number in
 *      the chart was the error, and a small per-row label did not stop it being
 *      read as the top of an audience list.
 *   2. NOT KNOWING WHICH IS WHICH. Already solved by the label itself.
 *
 * The first version fixed neither properly (one list, small labels). The second
 * fixed (1) by deleting the VPN cities and leaving a bare count — which also threw
 * away (2)'s answer. Sean, 27 September: "if we have insights that are locations,
 * we need to know that they are VPN locations because VPN locations are not
 * accurate locations."
 *
 * So both are returned, separately and equally fully. `placed` is the audience.
 * `exitNodes` carries the same city detail, kept out of the audience ranking and
 * presented as what it is. Neither is a subset of a mixed list, and nothing is
 * discarded: placed + exitNodes + unclassified totals the input exactly. A visit
 * that cannot be located is still a visit.
 *
 * A pure function, separate from the page, because this rule is the substantive
 * commitment of the feature and it fails SILENTLY — a mistake does not throw, does
 * not fail a build, and looks entirely normal on the page. Guarded by
 * scripts/check_insights_split.mts. It also cannot be checked through the page from
 * here: the development sandbox cannot reach Supabase, so a render proves nothing
 * about data it never loaded.
 */
export function splitLocations(locations: Location[]): {
  placed: { label: string; n: number }[];
  exitNodes: { label: string; n: number }[];
  overVpn: number;
  unclassified: number;
} {
  const label = (l: Location) =>
    [l.city, l.region, l.country].filter((x) => x && x !== "Unknown").join(", ") || "Unknown";
  const rows = (net: Location["network"]) =>
    locations.filter((l) => l.network === net).map((l) => ({ label: label(l), n: l.visitors }));
  const total = (r: { n: number }[]) => r.reduce((a, x) => a + x.n, 0);

  const placed = rows("direct");
  const exitNodes = rows("hosting");
  return {
    placed,
    exitNodes,
    overVpn: total(exitNodes),
    unclassified: total(rows("unknown")),
  };
}

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
 * Split locations into the ones that can honestly be shown as places and the ones
 * that can only be shown as counts.
 *
 * A pure function, and separate from the page, for two reasons. The rule it
 * encodes is the substantive commitment of the whole feature — a city is printed
 * only when it is the reader's own — and a rule that matters is worth a guard
 * (scripts/check_insights_split.mts). And it cannot be verified through the page
 * from a development machine: the sandbox this is built in cannot reach Supabase,
 * so a render check proves nothing about data it never loaded.
 *
 * Every visitor lands in exactly one of the three buckets and none is discarded:
 * placed totals + overVpn + unclassified equals the input. A visit that cannot be
 * located is still a visit and is still counted.
 */
export function splitLocations(locations: Location[]): {
  placed: { label: string; n: number }[];
  overVpn: number;
  unclassified: number;
} {
  const label = (l: Location) =>
    [l.city, l.region, l.country].filter((x) => x && x !== "Unknown").join(", ") || "Unknown";
  const sum = (net: Location["network"]) =>
    locations.filter((l) => l.network === net).reduce((a, l) => a + l.visitors, 0);

  return {
    placed: locations
      .filter((l) => l.network === "direct")
      .map((l) => ({ label: label(l), n: l.visitors })),
    overVpn: sum("hosting"),
    unclassified: sum("unknown"),
  };
}

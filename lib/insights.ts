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
 * Locations as one list, each row carrying whether it is a VPN or not.
 *
 * Sean, 27 September: "we don't have to have separate sections. It really is as
 * simple as whether or not the location is from a VPN or not."
 *
 * That is the requirement, and it is met by a label on every row. Two earlier
 * versions overshot it — one deleted the VPN cities and left a bare count, one
 * split them into a second section — both solving a presentation problem that the
 * label already answers for the person reading the page.
 *
 * THE ONE RULE THAT CANNOT BE RELAXED: no row is rendered without a flag. An
 * unflagged city is a claim that a reader is somewhere, and for a VPN exit that
 * claim is false. This function therefore returns a non-empty flag for every row,
 * the type makes `flag` required, and the database view coalesces a missing
 * classification to 'unknown' so there is nothing for a null to flow from.
 *
 * `direct` is rendered as "not a VPN" — a detection, not a guarantee. It means no
 * hosting or VPN provider matched, which is not proof none was used.
 *
 * Guarded by scripts/check_insights_split.mts, because this fails SILENTLY: a
 * dropped flag does not throw, does not fail a build, and looks entirely normal on
 * the page. It also cannot be checked through the page from a dev machine — the
 * sandbox cannot reach Supabase, so a render proves nothing about data it never
 * loaded.
 *
 * NOT BUILT YET, deliberately: a filter to show only non-VPN cities. Sean, 27
 * September: "the filtering could be show results from cities that are not VPN
 * touch points. I don't think we need to yet." The flag is the data that filter
 * would use, so adding it later is a UI change and nothing more.
 */
export function locationRows(locations: Location[]): { label: string; n: number; flag: string }[] {
  const FLAG: Record<Location["network"], string> = {
    hosting: "VPN or datacenter",
    direct: "not a VPN",
    unknown: "network unknown",
  };
  return locations.map((l) => ({
    label:
      [l.city, l.region, l.country].filter((x) => x && x !== "Unknown").join(", ") || "Unknown",
    n: l.visitors,
    // Never falls through to empty: an unrecognised value is 'network unknown',
    // which is honest, rather than a blank, which is a false implication.
    flag: FLAG[l.network] ?? FLAG.unknown,
  }));
}

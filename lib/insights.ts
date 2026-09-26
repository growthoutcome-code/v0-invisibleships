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
};

export async function getInsights(): Promise<Insights> {
  const db = serverDb();
  // Not configured is a normal state, not an error: the page says so plainly
  // rather than failing, because a transparency page that 500s tells a reader
  // nothing except that something is broken.
  if (!db) return EMPTY;

  const [meta, funnel, roles, countries, weeks] = await Promise.all([
    db.from("insights_meta").select("*").maybeSingle(),
    db.from("insights_gate_funnel").select("event, n"),
    db.from("insights_gate_roles").select("visitor_role, n"),
    db.from("insights_downloads_by_country").select("country, n"),
    db.from("insights_downloads_by_week").select("week, n"),
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
  };
}

/** The four gate steps, in the order a reader meets them. */
export const FUNNEL_STEPS: { event: string; label: string; note: string }[] = [
  { event: "gate_opened", label: "Met the gate", note: "the notice appeared" },
  { event: "role_selected", label: "Answered who they are", note: "optional, unverified" },
  { event: "role_declined", label: "Skipped the question", note: "or chose not to say" },
  { event: "entered", label: "Entered the archive", note: "read the disclaimer through" },
];

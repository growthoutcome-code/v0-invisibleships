/**
 * Figures read from the research tables at build time.
 *
 * The home page states numbers about the procurement record, so it reads them
 * out of the same JSON the Research section charts — never typed in. If a table
 * is regenerated the home page moves with it, which is the rule the rest of this
 * page already follows.
 */
import fs from "fs";
import path from "path";

type Award = { value_usd?: number | null; buyer?: string | null; awarded_on?: string | null };

let _cache: GovCloud | null = null;

export type GovCloud = {
  awards: number;
  valued: number;
  totalUsd: number;
  vendors: number;
  deployments: number;
  regulations: number;
  sources: number;
  /** The largest single award, for a concrete anchor beside the total. */
  topUsd: number;
  topBuyer: string | null;
};

function table<T>(name: string): T[] {
  const p = path.join(process.cwd(), "public", "data", "tables", `${name}.json`);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return Array.isArray(raw) ? raw : (raw.rows ?? raw.data ?? []);
}

export function govCloud(): GovCloud {
  if (_cache) return _cache;
  const awards = table<Award>("awards");
  const valued = awards.filter((a) => Number(a.value_usd) > 0);
  const top = [...valued].sort((a, b) => Number(b.value_usd) - Number(a.value_usd))[0];
  _cache = {
    awards: awards.length,
    valued: valued.length,
    totalUsd: valued.reduce((n, a) => n + Number(a.value_usd || 0), 0),
    vendors: table("vendors").length,
    deployments: table("deployments").length,
    regulations: table("regulations").length,
    sources: table("sources").length,
    topUsd: Number(top?.value_usd || 0),
    topBuyer: top?.buyer ?? null,
  };
  return _cache;
}

/** "$102.8bn" / "$14.0bn" / "$950m" — compact, and never rounded up past the figure. */
export function usd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}bn`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}m`;
  return `$${n.toLocaleString()}`;
}

/**
 * The law-enforcement accomplishments register.
 *
 * ALREADY IN THE ARCHIVE, and that is the point. Sean asked on 30 August
 * whether we could find data rewarding Homeland Security for its trafficking
 * arrests and rescues — "nine hundred human trafficking arrests and a hundred
 * and eighty human trafficking rescues." It was already here, tier A, sourced
 * to a DHS press release, sitting in crime_accomplishments.json where only a
 * reader who opened the Crime vertical of the Research section would ever meet
 * it. Six entries, three of them with public links, none of them visible from
 * the front page.
 *
 * So this reads the same file the crime section reads. One register, two
 * places, no second copy to drift.
 */
export type Accomplishment = {
  what: string;
  kind: string;
  claim: string;
  corroboration: string;
  tier: string;
  source_id: string | null;
};
export type SourceRow = { id?: string; source_id?: string; publisher?: string; title?: string; url?: string };

export function accomplishments(): { row: Accomplishment; source: SourceRow | null }[] {
  const dir = path.join(process.cwd(), "public", "data", "crime", "tables");
  const read = (f: string) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    return Array.isArray(raw) ? raw : (raw.rows ?? raw.data ?? []);
  };
  const rows = read("crime_accomplishments.json") as Accomplishment[];
  const sources = read("crime_sources.json") as SourceRow[];
  const byId = new Map(sources.map((s) => [s.id ?? s.source_id, s]));
  return rows.map((row) => ({
    row,
    source: row.source_id ? byId.get(row.source_id) ?? null : null,
  }));
}

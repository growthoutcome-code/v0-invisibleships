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

/**
 * The three suicide series the home page draws.
 *
 * WHY THESE THREE AND NOT THE OTHER ELEVEN. The hero already states, in words,
 * that the world's rate fell 27% while the United States rose 40% and South
 * Korea 83%. Those are exactly three of the fourteen series in this file:
 * -27.0, +39.9 and +82.8 on one comparable basis. So the home chart is the hero
 * sentence made visible — same claim, same basis, no fourth number introduced —
 * and the full fourteen-country chart, with its method notes, per-country
 * caveats and year tables, stays where a reader who wants it will go looking.
 *
 * Read at build time from the same JSON the Research section charts. If that
 * file is regenerated the home page moves with it.
 */
export type HomeSeries = {
  name: string;
  /** Short form, for the label at the end of the line where space is tight. */
  short: string;
  changePct: number;
  /** The one line drawn at full weight. */
  emphasis: boolean;
  points: { year: number; value: number }[];
  /** Everything the detail panel needs — carried through, never re-worded here. */
  method: string;
  basisShort: string;
  publisher: string;
  tier: string;
  caveats: string[];
  sourceUrl: string;
  /** "country" or "world" — the world line is an estimate, not a place. */
  kind: string;
};

let _suicide: HomeSeries[] | null = null;

export function homeSuicideSeries(): HomeSeries[] {
  if (_suicide) return _suicide;
  const p = path.join(process.cwd(), "public", "data", "health", "charts", "suicide_international.json");
  const doc = JSON.parse(fs.readFileSync(p, "utf8")) as {
    series: {
      country: string;
      change_pct: number;
      points: { year: number; value: number }[];
      method?: string;
      basis_short?: string;
      publisher?: string;
      tier?: string;
      caveats?: string[];
      source_url?: string;
      kind?: string;
    }[];
  };
  const want: { country: string; short: string; emphasis: boolean }[] = [
    { country: "United States", short: "United States", emphasis: true },
    { country: "South Korea", short: "South Korea", emphasis: false },
    { country: "World", short: "World", emphasis: false },
  ];
  _suicide = want.map((w) => {
    const s = doc.series.find((x) => x.country === w.country);
    if (!s) {
      // Same discipline as the home quotations: if the data this page claims to
      // show is not in the file, fail the build rather than render a chart with
      // a line missing and no way for anyone to notice.
      throw new Error(`home chart: series ${JSON.stringify(w.country)} is not in suicide_international.json`);
    }
    return {
      name: w.country,
      short: w.short,
      changePct: s.change_pct,
      emphasis: w.emphasis,
      points: s.points,
      method: s.method ?? "",
      basisShort: s.basis_short ?? "",
      publisher: s.publisher ?? "",
      tier: s.tier ?? "",
      caveats: s.caveats ?? [],
      sourceUrl: s.source_url ?? "",
      kind: s.kind ?? "country",
    };
  });
  return _suicide;
}

/**
 * The named buyers and sellers, derived from the awards and deployment tables.
 *
 * Sean, 8 September: "we need all of the major players… we need those names in
 * the government cloud section." Named, but never typed in — the register is
 * the source, so the page cannot drift from it and cannot flatter it either.
 *
 * WORTH KNOWING WHEN READING THIS: Meta is not here. It is not a government
 * cloud vendor in this register at all, and no award, deployment or capability
 * in the record belongs to it. The second-largest holder by value is Oracle,
 * ahead of Microsoft — which is not the ordering most people would guess.
 */
export type VendorFigure = { name: string; usd: number; deployments: number };

let _topVendors: VendorFigure[] | null = null;

export function topVendors(n = 4): VendorFigure[] {
  if (!_topVendors) {
    const names = new Map(table<{ id: string; name: string }>("vendors").map((v) => [v.id, v.name]));
    const usd = new Map<string, number>();
    const deps = new Map<string, number>();
    for (const a of table<{ vendor_id?: string; value_usd?: number | null }>("awards")) {
      if (!a.vendor_id) continue;
      usd.set(a.vendor_id, (usd.get(a.vendor_id) ?? 0) + Number(a.value_usd || 0));
    }
    for (const d of table<{ vendor_id?: string }>("deployments")) {
      if (!d.vendor_id) continue;
      deps.set(d.vendor_id, (deps.get(d.vendor_id) ?? 0) + 1);
    }
    _topVendors = [...usd.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, total]) => ({
        name: names.get(id) ?? id,
        usd: total,
        deployments: deps.get(id) ?? 0,
      }));
  }
  return _topVendors.slice(0, n);
}

/**
 * The shape of the capability register — what these platforms are documented to
 * do, counted by kind.
 *
 * The categories are the register's own, not ones invented for the page. What
 * is ABSENT matters as much as what is present: see the note in the home page's
 * government-cloud section about what no capability in this file does.
 */
export function capabilityShape(): {
  total: number;
  categories: number;
  byCategory: Record<string, number>;
} {
  const caps = table<{ category?: string }>("capabilities");
  const byCategory: Record<string, number> = {};
  for (const c of caps) {
    const k = c.category || "uncategorised";
    byCategory[k] = (byCategory[k] ?? 0) + 1;
  }
  return { total: caps.length, categories: Object.keys(byCategory).length, byCategory };
}

/**
 * The whole suicide chart document, for the home page.
 *
 * Sean, 9 September: "include the full suicide chart… all sparklines, and all
 * chart functionality from the research section on the home page." So the home
 * page now renders the same component /data/public-health does, over the same
 * fourteen series — the difference is only that this is read at build time and
 * handed in as a prop, where the research page fetches it in the browser.
 *
 * Deliberately untyped against IntlChart here: that type lives in a client
 * component, and a server module importing from one only to describe a shape is
 * the kind of edge that breaks in a Next upgrade. The page casts it at the call
 * site instead.
 */
export function suicideChartDoc(): unknown {
  const p = path.join(process.cwd(), "public", "data", "health", "charts", "suicide_international.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * What governments actually run on these platforms, by domain.
 *
 * Sean, 10 September, on the government cloud definition: "it's a way of
 * monitoring people." The register does not support that as a definition, and
 * saying so is more useful than agreeing: **151 of the 399 deployments here are
 * ordinary digital government** — health, tax, benefits, education, emergency
 * response — against 31 in law enforcement. Fourteen of 73 capabilities are
 * identity, biometric, acoustic or surveillance; the other 59 are not.
 *
 * The honest and far more damaging point is the one he reached for in the same
 * breath: what it INTENDS to be against what it WORKS OUT to be. A platform that
 * were only surveillance would be easy to refuse. One that runs the benefits
 * system and the face matching on the same accreditation cannot be refused at
 * all, and that is the section's argument.
 *
 * Derived, so the balance moves if the register does.
 */
export function deploymentMix(): { total: number; admin: number; police: number } {
  const domains = table<{ id: string; name?: string; label?: string }>("domains");
  const nameOf = new Map(domains.map((d) => [d.id, d.name ?? d.label ?? d.id]));
  let admin = 0;
  let police = 0;
  const deps = table<{ domain_id?: string }>("deployments");
  for (const d of deps) {
    const n = (nameOf.get(d.domain_id ?? "") ?? "").toLowerCase();
    if (n.includes("public administration")) admin += 1;
    if (n.includes("law enforcement")) police += 1;
  }
  return { total: deps.length, admin, police };
}

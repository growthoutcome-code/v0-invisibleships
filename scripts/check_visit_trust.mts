/**
 * Guard for classifyVisit() in lib/visit-trust.ts.
 *
 * This is the rule the whole locations feature rests on: a city is printed only when
 * the visit actually came from it, and a relayed visit shows a time zone instead.
 *
 * It is guarded rather than trusted for two reasons. It fails SILENTLY — a wrong
 * label does not throw, does not fail a build, and looks entirely normal on the page,
 * which is how this project spent weeks believing it had an engaged reader in Los
 * Angeles. And it cannot be exercised through the page from a development machine:
 * the sandbox cannot reach PostHog (`getaddrinfo EAI_AGAIN us.posthog.com`), so a
 * render check proves layout and never data.
 *
 * THE FIXTURE IS REAL. Every row below is actual output of the production query with
 * the project's internal-traffic filter applied, taken 27 September 2026. It is not
 * invented, so it keeps testing the shapes PostHog genuinely returns — including the
 * null city and the 1000 km radius, both of which occur.
 */

import { classifyVisit, type Confidence, type VisitSignals } from "../lib/visit-trust";

type Case = {
  name: string;
  signals: VisitSignals;
  want: Confidence;
  /** A substring the printed place must contain, to pin city-vs-zone behaviour. */
  placeHas?: string;
  /** A substring the printed place must NOT contain. */
  placeLacks?: string;
};

const g = (
  city: string | null,
  region: string | null,
  country: string | null,
  ipTimeZone: string | null,
  browserTimeZone: string | null,
  accuracyKm: number | null,
): VisitSignals => ({ city, region, country, ipTimeZone, browserTimeZone, accuracyKm });

const CASES: Case[] = [
  // Relays. The author's own device, in Mountain time, behind exits elsewhere.
  {
    name: "LA address, Denver device clock",
    signals: g("Los Angeles", "California", "US", "America/Los_Angeles", "America/Denver", 20),
    want: "relay",
    placeHas: "Mountain",
    placeLacks: "Los Angeles",
  },
  {
    name: "Ypsilanti address, Denver device clock",
    signals: g("Ypsilanti", "Michigan", "US", "America/Detroit", "America/Denver", 200),
    want: "relay",
    placeLacks: "Ypsilanti",
  },
  {
    name: "Reston address, Pacific device clock",
    signals: g("Reston", "Virginia", "US", "America/New_York", "America/Los_Angeles", 20),
    want: "relay",
    placeLacks: "Reston",
  },

  // Confirmed. Clocks agree and the address is precise.
  {
    name: "Melbourne FL, clocks agree, 10km",
    signals: g("Melbourne", "Florida", "US", "America/New_York", "America/New_York", 10),
    want: "confirmed",
    placeHas: "Melbourne",
  },
  {
    name: "Lima PE, clocks agree, 10km",
    signals: g("Lima", "Lima", "PE", "America/Lima", "America/Lima", 10),
    want: "confirmed",
    placeHas: "Lima",
  },

  // Probable. Clocks agree but the address is a region, not a city.
  {
    name: "Denver, clocks agree, 100km",
    signals: g("Denver", "Colorado", "US", "America/Denver", "America/Denver", 100),
    want: "probable",
    placeHas: "approximate",
  },
  {
    name: "Denver, clocks agree, 200km",
    signals: g("Denver", "Colorado", "US", "America/Denver", "America/Denver", 200),
    want: "probable",
  },

  // Automated. A UTC device clock on a non-UTC network is the headless default.
  {
    name: "Shanghai address, UTC device clock",
    signals: g(null, null, "CN", "Asia/Shanghai", "UTC", 1000),
    want: "automated",
  },
  {
    name: "Hsinchu address, UTC device clock",
    signals: g("Hsinchu", null, "TW", "Asia/Taipei", "UTC", 5),
    want: "automated",
    placeLacks: "Hsinchu",
  },

  // Unknown. Never upgrade on missing signal.
  {
    name: "clocks agree but no place resolved",
    signals: g(null, null, null, "Asia/Shanghai", "Asia/Shanghai", 1000),
    want: "unknown",
  },
  {
    name: "browser reported no time zone",
    signals: g("Denver", "Colorado", "US", "America/Denver", null, 10),
    want: "unknown",
  },
  {
    name: "no radius, clocks agree",
    signals: g("Denver", "Colorado", "US", "America/Denver", "America/Denver", null),
    want: "probable",
  },
];

const fail: string[] = [];

for (const c of CASES) {
  const got = classifyVisit(c.signals);
  if (got.confidence !== c.want) {
    fail.push(`${c.name}: got '${got.confidence}', expected '${c.want}'`);
  }
  if (c.placeHas && !got.place.includes(c.placeHas)) {
    fail.push(`${c.name}: place "${got.place}" should contain "${c.placeHas}"`);
  }
  if (c.placeLacks && got.place.includes(c.placeLacks)) {
    fail.push(
      `${c.name}: place "${got.place}" must NOT contain "${c.placeLacks}" — that city belongs to the relay, not the reader`,
    );
  }
  if (!got.place.trim()) fail.push(`${c.name}: empty place string`);
  if (!got.why.trim()) fail.push(`${c.name}: empty explanation`);
}

// The invariant, checked across every case rather than case by case: a relayed visit
// never prints the address's city. This is the failure that cost this project weeks.
for (const c of CASES) {
  const got = classifyVisit(c.signals);
  if (got.confidence === "relay" && c.signals.city && got.place.includes(c.signals.city)) {
    fail.push(`${c.name}: relayed visit printed the relay's city "${c.signals.city}"`);
  }
}

if (fail.length) {
  for (const f of fail) console.error(`FAIL ${f}`);
  console.error(`\n[visit-trust] ${fail.length} failure(s).`);
  console.error("[visit-trust] Rules: clocks disagree => relay, and a relayed visit shows a TIME ZONE, never a city.");
  process.exit(1);
}
console.log(`[visit-trust] ${CASES.length} visit classifications correct, fixtured on real production rows.`);

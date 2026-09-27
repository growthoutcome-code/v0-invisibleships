/**
 * Guard for locationRows() in lib/insights.ts.
 *
 * ONE RULE: every location rendered on /insights carries a flag saying whether it
 * is a VPN. An unflagged city asserts that a reader is there, and for a VPN exit
 * node that assertion is false.
 *
 * This is guarded rather than trusted because it fails silently — a dropped or
 * blank flag does not throw, does not fail a build, and looks entirely normal on
 * the page. It also cannot be verified through the page from here: the development
 * sandbox cannot reach Supabase, so a render proves nothing about data it never
 * loaded.
 *
 * The fixture is real: the exact output of `select * from public.insights_locations`
 * taken 27 September 2026 against seeded rows, so this tests the shape the database
 * actually returns rather than an invented one.
 */

import { locationRows, type Location } from "../lib/insights";

const FIXTURE: Location[] = [
  { country: "US", region: "MI", city: "Ypsilanti", network: "direct", visitors: 2 },
  { country: "NL", region: "NH", city: "Amsterdam", network: "hosting", visitors: 1 },
  { country: "Unknown", region: "Unknown", city: "Unknown", network: "unknown", visitors: 1 },
  { country: "US", region: "IL", city: "Chicago", network: "direct", visitors: 1 },
  { country: "US", region: "CA", city: "Los Angeles", network: "hosting", visitors: 1 },
];

const fail: string[] = [];
const rows = locationRows(FIXTURE);

// THE RULE. Checked first and for every row, including any future network value.
for (const r of rows) {
  if (!r.flag || !r.flag.trim()) {
    fail.push(`"${r.label}" has no flag — an unlabelled city implies a reader is there`);
  }
}
if (rows.length !== FIXTURE.length) {
  fail.push(`${FIXTURE.length} rows in, ${rows.length} out — no row may be added or dropped`);
}

// VPN rows must say so. This is the error the whole feature exists to prevent:
// one reader's Los Angeles exit node reading as an audience location.
for (const city of ["Amsterdam", "Los Angeles"]) {
  const r = rows.find((x) => x.label.includes(city));
  if (!r) fail.push(`${city} is missing from the list — VPN rows are shown, not hidden`);
  else if (r.flag !== "VPN or datacenter") {
    fail.push(`${city} is flagged "${r.flag}" but came over a hosting/VPN network`);
  }
}

// Non-VPN rows must not be mislabelled either: calling a reader's home a VPN
// understates real traffic, and is just as invisible on the page.
for (const city of ["Ypsilanti", "Chicago"]) {
  const r = rows.find((x) => x.label.includes(city));
  if (!r) fail.push(`${city} is missing from the list`);
  else if (r.flag !== "not a VPN") {
    fail.push(`${city} is flagged "${r.flag}" but no hosting network matched it`);
  }
}

// Unclassifiable rows say so rather than defaulting either way.
const unknown = rows.find((r) => r.label === "Unknown");
if (!unknown) fail.push("the unclassifiable row was dropped");
else if (unknown.flag !== "network unknown") {
  fail.push(`unclassifiable row flagged "${unknown.flag}" instead of "network unknown"`);
}

// Counts are carried through untouched.
const total = FIXTURE.reduce((a, l) => a + l.visitors, 0);
const carried = rows.reduce((a, r) => a + r.n, 0);
if (carried !== total) fail.push(`visit counts changed: ${total} in, ${carried} out`);

// Empty input must not throw or invent rows.
if (locationRows([]).length !== 0) fail.push("empty input produced rows");

if (fail.length) {
  for (const f of fail) console.error(`FAIL ${f}`);
  console.error(`\n[insights] ${fail.length} location-flag failure(s).`);
  console.error("[insights] Every row must carry a non-empty flag, and it must be the right one.");
  process.exit(1);
}
console.log(`[insights] ${rows.length} locations, every one flagged VPN / not-VPN / unknown.`);

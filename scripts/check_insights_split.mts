/**
 * Guard for splitLocations() in lib/insights.ts.
 *
 * The rule under test is the point of the whole locations feature: a city appears
 * on /insights only when the network it came over was the reader's own. Everything
 * else is counted and left unplaced. Getting this wrong does not throw, does not
 * fail a build, and looks completely normal on the page — it just quietly prints
 * a VPN exit node as though a reader lived there. So it is pinned here.
 *
 * The fixture is real: it is the exact output of `select * from
 * public.insights_locations` taken on 27 September 2026 against seeded rows, so
 * this tests the shape the database actually returns rather than an invented one.
 */

import { splitLocations, type Location } from "../lib/insights";

const FIXTURE: Location[] = [
  { country: "US", region: "MI", city: "Ypsilanti", network: "direct", visitors: 2 },
  { country: "NL", region: "NH", city: "Amsterdam", network: "hosting", visitors: 1 },
  { country: "Unknown", region: "Unknown", city: "Unknown", network: "unknown", visitors: 1 },
  { country: "US", region: "IL", city: "Chicago", network: "direct", visitors: 1 },
  { country: "US", region: "CA", city: "Los Angeles", network: "hosting", visitors: 1 },
];

const fail: string[] = [];
const eq = (got: unknown, want: unknown, what: string) => {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) fail.push(`${what}: got ${g}, expected ${w}`);
};

const out = splitLocations(FIXTURE);

// The audience list: readers on their own connections, and nobody else.
eq(
  out.placed,
  [
    { label: "Ypsilanti, MI, US", n: 2 },
    { label: "Chicago, IL, US", n: 1 },
  ],
  "placed holds only 'direct' rows, in view order",
);

// THE BUG THIS GUARD EXISTS FOR: an exit node ranked as an audience location.
for (const city of ["Amsterdam", "Los Angeles"]) {
  if (out.placed.some((p) => p.label.includes(city))) {
    fail.push(`${city} appears in placed — it came over a hosting/VPN network and is a server, not a reader`);
  }
}
if (out.placed.some((p) => p.label === "Unknown")) {
  fail.push("an unclassifiable row appears in placed");
}

// THE OPPOSITE FAILURE, added 27 Sep after over-correcting: the exit-node cities
// were deleted rather than separated, which lost information Sean wants to see.
// They must still be returned, with their city detail intact.
eq(
  out.exitNodes,
  [
    { label: "Amsterdam, NH, NL", n: 1 },
    { label: "Los Angeles, CA, US", n: 1 },
  ],
  "exitNodes keeps the VPN/datacenter cities rather than reducing them to a number",
);
if (out.exitNodes.length === 0 && out.overVpn > 0) {
  fail.push("overVpn is non-zero but exitNodes is empty — the cities were discarded");
}

eq(out.overVpn, 2, "overVpn totals exitNodes");
eq(out.unclassified, 1, "unclassified visitors counted");

// Nobody is dropped and nobody is double-counted.
const total = FIXTURE.reduce((a, l) => a + l.visitors, 0);
const accounted =
  out.placed.reduce((a, p) => a + p.n, 0) +
  out.exitNodes.reduce((a, p) => a + p.n, 0) +
  out.unclassified;
eq(accounted, total, "every visitor accounted for exactly once");

// Empty input must not throw or invent rows.
const empty = splitLocations([]);
eq(
  [empty.placed.length, empty.exitNodes.length, empty.overVpn, empty.unclassified],
  [0, 0, 0, 0],
  "empty input",
);

if (fail.length) {
  for (const f of fail) console.error(`FAIL ${f}`);
  console.error(`\n[insights] ${fail.length} split failure(s).`);
  console.error("[insights] Rules: a city goes in `placed` only when network === 'direct';");
  console.error("[insights] VPN/datacenter cities go in `exitNodes` and are NOT discarded.");
  process.exit(1);
}
console.log(
  `[insights] locations split correctly: ${out.placed.length} reader location(s), ` +
    `${out.exitNodes.length} exit node(s) kept and labelled, ${out.unclassified} unplaceable.`,
);

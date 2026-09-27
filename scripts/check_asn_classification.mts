/**
 * Guard for the network classifier in lib/asn.ts.
 *
 * WHY THIS IS A CHECKED GUARD AND NOT A ONE-OFF. classifyOrganization matches
 * substrings against an AS organisation name, which means every pattern added to
 * the hosting list is a chance to catch something it should not. "cloud" catches
 * the cloud industry, as intended, and would also catch a consumer ISP with the
 * word in its name. "google" catches Google Cloud and would also catch Google
 * Fiber, which is somebody's house.
 *
 * A mislabel here is not a cosmetic bug. The whole reason locations are shown at
 * all is that each row says whether its city can be trusted; calling a reader's
 * home connection a VPN exit, or a VPN exit a home connection, is the specific
 * error the label exists to prevent, and it is invisible on the page. So the
 * awkward cases are pinned here.
 */

import { classifyOrganization } from "../lib/asn";

type Case = [org: string | null | undefined, want: "hosting" | "direct" | "unknown", why: string];

const CASES: Case[] = [
  // Commercial VPN exits, the rows that most need catching.
  ["M247 Europe SRL", "hosting", "rents to most commercial VPNs"],
  ["Tefincom S.A.", "hosting", "NordVPN's registered operator"],
  ["DataCamp Limited", "hosting", "CDN77/VPN infrastructure"],
  ["Mullvad VPN AB", "hosting", "named VPN"],
  ["Private Internet Access, Inc.", "hosting", "named VPN"],
  ["Clouvider Limited", "hosting", "hosting, and tests the 'cloud' pattern"],
  // Ordinary hosting and cloud.
  ["Amazon.com, Inc.", "hosting", "AWS ranges"],
  ["DigitalOcean, LLC", "hosting", ""],
  ["Hetzner Online GmbH", "hosting", ""],
  ["OVH SAS", "hosting", ""],
  // Consumer and business ISPs. These are real readers.
  ["Comcast Cable Communications, LLC", "direct", ""],
  ["AT&T Services, Inc.", "direct", "ampersand in the pattern"],
  ["T-Mobile USA, Inc.", "direct", "mobile carrier, not a tunnel"],
  ["Charter Communications Inc", "direct", ""],
  ["CenturyLink Communications, LLC", "direct", ""],
  // The traps: hosting keywords inside the name of something that is not hosting.
  ["Google Fiber Inc.", "direct", "'google' must not beat the ISP list"],
  ["SpaceX Starlink", "direct", "satellite ISP, somebody's house"],
  ["University of Colorado", "direct", "'server'/'cloud' near-misses"],
  ["Boulder Public Library", "direct", "public terminal, not a datacenter"],
  // Nothing to go on. Must be unknown, never a guess in either direction.
  [null, "unknown", "no dataset or no record"],
  [undefined, "unknown", ""],
  ["", "unknown", "empty organisation string"],
];

let failed = 0;
for (const [org, want, why] of CASES) {
  const got = classifyOrganization(org);
  if (got === want) continue;
  failed++;
  console.error(
    `FAIL ${JSON.stringify(org)} classified as '${got}', expected '${want}'${why ? ` — ${why}` : ""}`,
  );
}

if (failed) {
  console.error(`\n[asn] ${failed} of ${CASES.length} classifications wrong.`);
  console.error("[asn] A pattern added to HOSTING_PATTERNS probably caught an ISP.");
  console.error("[asn] Add it to NOT_HOSTING_PATTERNS, which wins, rather than narrowing the other list.");
  process.exit(1);
}
console.log(`[asn] ${CASES.length} network classifications correct.`);

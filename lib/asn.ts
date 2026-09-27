import fs from "node:fs";
import path from "node:path";
import { Reader, type AsnResponse } from "maxmind";

/**
 * Is this address a datacenter or VPN exit, or an ordinary connection?
 *
 * WHY THIS EXISTS. /insights wants to show where readers are. A city resolved
 * from an IP address is only the reader's city if the address is the reader's;
 * for anyone on a VPN it is the city of an exit node, which is frequently a
 * different continent. A list that mixes the two silently is worse than no list,
 * because nothing on the page tells a reader which rows to distrust — and this
 * archive is read by people with reason to use a VPN, so the mixed rows are not
 * a rounding error. Sean, 26 September: "I absolutely do not want to have an
 * analytics page with locations on it that cite VPN touchpoints without a VPN
 * label." So every location carries a label or it does not ship.
 *
 * WHY A LOCAL FILE AND NOT A SERVICE. The alternatives were an IP-intelligence
 * API and putting Cloudflare in front of the site. The API means posting reader
 * addresses to a third party, which is the one thing this site will not do for a
 * cosmetic gain. Cloudflare turned out not to answer the question at all: its
 * visitor-location headers carry city and country but no ASN on any plan, so
 * getting a network out of it means running a Worker in front of the site to read
 * `request.cf.asn` and forward it — a DNS move, a Worker, and Vercel's own geo
 * headers then resolving to Cloudflare's edge instead of the reader. A file we
 * read ourselves needs none of that and nothing leaves the server.
 *
 * WHY IT RUNS ON VERCEL. The dataset is about 10 MB against a 250 MB uncompressed
 * limit for Node functions, and next.config.mjs traces it into the two routes that
 * need it. It cannot run in middleware, which has a small bundle limit and no
 * filesystem — but the routes that write rows are Node routes, so that costs
 * nothing.
 *
 * WHAT IS STORED: the three-value label, and nothing else. Not the address, not
 * the ASN, not the operator's name. The question the page needs answered is
 * "can this city be trusted", and the label answers it; the operator name would
 * narrow a reader further and answer nothing extra.
 */

export type NetworkType = "hosting" | "direct" | "unknown";

/**
 * Substring match against the AS organisation name, lowercased.
 *
 * This is a heuristic and is treated as one. It is deliberately one-directional:
 * a match means the address belongs to a network that sells servers or tunnels,
 * which is strong evidence the city is not the reader's. A non-match means only
 * that nothing here matched — never that no VPN is in use. That is why the label
 * for a non-match is `direct` and is rendered as "no hosting network detected"
 * rather than "residential", which would be a claim this data cannot support.
 *
 * Commercial VPN operators and the hosting companies they rent from dominate the
 * list because those are the ASNs a reader on a VPN actually exits through.
 */
const HOSTING_PATTERNS = [
  // Hyperscale and general hosting
  "amazon", "aws", "google", "microsoft", "azure", "oracle", "alibaba", "tencent",
  "digitalocean", "linode", "akamai", "vultr", "choopa", "hetzner", "ovh", "scaleway",
  "online s.a.s", "contabo", "leaseweb", "hostinger", "godaddy", "bluehost", "dreamhost",
  "rackspace", "equinix", "packet", "upcloud", "netcup", "ionos", "1&1", "strato",
  "aruba", "servers.com", "server", "hosting", "hoster", "datacenter", "data center",
  "datacamp", "colocation", "colo", "cloud", "vps", "dedicated",
  // Commercial VPN and privacy networks
  "m247", "nordvpn", "nord security", "tefincom", "mullvad", "private internet access",
  "london trust media", "expressvpn", "express vpn", "surfshark", "cyberghost",
  "protonvpn", "proton ag", "ipvanish", "hidemyass", "purevpn", "gz systems",
  "windscribe", "perfect privacy", "ovpn", "azirevpn", "torguard", "vpn",
  "datapacket", "clouvider", "zenlayer", "cdn77", "flokinet", "privex",
  // Tor and anonymising relays frequently appear as their own hosts
  "tor exit", "torservers", "emerald onion", "quintex",
] as const;

/**
 * False positives the list above would otherwise create.
 *
 * "cloud" catches Cloudflare and half the cloud industry, which is intended, but
 * it also catches consumer ISPs that happen to have it in their name, and
 * "server" is broad enough to catch a university. A name matching one of these
 * wins over a hosting match, because calling a real reader's connection a VPN
 * exit understates the traffic in a way the page cannot detect either.
 */
const NOT_HOSTING_PATTERNS = [
  "cloudflarenet warp", "comcast", "charter", "spectrum", "cox communications",
  "centurylink", "lumen", "at&t", "at & t", "verizon", "t-mobile", "sprint",
  "frontier", "windstream", "mediacom", "cableone", "wow internet", "rcn",
  "google fiber", "starlink", "spacex", "viasat", "hughes", "university",
  "college", "school", "public library",
] as const;

const DB_PATH = path.join(process.cwd(), "data", "GeoLite2-ASN.mmdb");

/**
 * Cached across invocations, deliberately.
 *
 * A warm Vercel function reuses module state, so the file is read and parsed once
 * per instance rather than once per request. `loaded` distinguishes "not tried
 * yet" from "tried and there is no file", so a missing dataset costs one failed
 * stat for the life of the instance instead of one per reader.
 */
let reader: Reader<AsnResponse> | null = null;
let loaded = false;

function getReader(): Reader<AsnResponse> | null {
  if (loaded) return reader;
  loaded = true;
  try {
    reader = new Reader<AsnResponse>(fs.readFileSync(DB_PATH));
  } catch {
    // No dataset in this deployment. Every row becomes `unknown`, the locations
    // table still renders, and each row still carries a label. This is the
    // intended behaviour when the build could not fetch the file, not an outage:
    // the page degrades to saying less rather than to saying something wrong.
    reader = null;
  }
  return reader;
}

/** Whether a dataset is present, so a caller can say so on the page. */
export function asnDatasetAvailable(): boolean {
  return getReader() !== null;
}

/**
 * The visitor address, for classification only.
 *
 * Never returned to a caller, never logged, never stored. It exists inside this
 * module for the length of one lookup. x-forwarded-for is a list appended to by
 * each hop, so the first entry is the client; Vercel sets x-real-ip to the same
 * value and is used as the fallback.
 */
function clientIp(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}

/** Private, loopback and link-local space, which no dataset covers. */
function isPrivate(ip: string): boolean {
  return (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    ip.startsWith("fe80:") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

export function classifyOrganization(org: string | undefined | null): NetworkType {
  if (!org) return "unknown";
  const name = org.toLowerCase();
  if (NOT_HOSTING_PATTERNS.some((p) => name.includes(p))) return "direct";
  if (HOSTING_PATTERNS.some((p) => name.includes(p))) return "hosting";
  return "direct";
}

/**
 * Classify the network behind a request. Never throws and never blocks a write:
 * anything unexpected is `unknown`, which is a label the page can print.
 */
export function networkTypeFromHeaders(h: Headers): NetworkType {
  try {
    const ip = clientIp(h);
    if (!ip || isPrivate(ip)) return "unknown";
    const r = getReader();
    if (!r) return "unknown";
    const rec = r.get(ip);
    if (!rec) return "unknown";
    return classifyOrganization(rec.autonomous_system_organization);
  } catch {
    return "unknown";
  }
}

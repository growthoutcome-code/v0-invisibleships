#!/usr/bin/env node
/**
 * Fetch GeoLite2-ASN into data/GeoLite2-ASN.mmdb before the build.
 *
 * WHY A BUILD STEP AND NOT A COMMITTED FILE. MaxMind's licence for GeoLite2 does
 * not allow redistributing the database, and it expects the copy in use to be kept
 * current rather than pinned forever. Committing it would do both wrong. Fetching
 * it at build time means the deployed copy is as fresh as the last deploy, and the
 * repo stays free of a 10 MB binary that nobody can diff.
 *
 * WHY IT EXITS 0 WITH NO KEY. This runs in front of `next build`, which means it
 * runs on Sean's laptop, in every preview, and in production. If a missing licence
 * key failed the build, adding this feature would have broken every deploy until
 * an environment variable was set in three places at once. Instead the absence of
 * a key is a normal state: nothing is downloaded, lib/asn.ts finds no file, and
 * every location is labelled `unknown`. The page says less and says nothing false,
 * which is the failure mode this whole feature was built to have.
 *
 * Set MAXMIND_LICENSE_KEY (free account, "My License Keys") locally in .env.local
 * and in Vercel for Production and Preview to turn labels on.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const KEY = process.env.MAXMIND_LICENSE_KEY;
const OUT_DIR = path.join(process.cwd(), "data");
const OUT = path.join(OUT_DIR, "GeoLite2-ASN.mmdb");
const URL_BASE = "https://download.maxmind.com/app/geoip_download";

function note(msg) {
  console.log(`[asn] ${msg}`);
}

if (!KEY) {
  note("MAXMIND_LICENSE_KEY not set — skipping download.");
  note("Locations will render with every row labelled 'unknown'. This is not an error.");
  process.exit(0);
}

/**
 * Don't re-download on every local build. The licence expects the file to be kept
 * current, not re-fetched hourly; a week is well inside that and keeps `npm run
 * dev` cycles from hammering their servers. CI starts with no data/ directory, so
 * a real deploy always fetches.
 */
const WEEK = 7 * 24 * 60 * 60 * 1000;
try {
  const age = Date.now() - fs.statSync(OUT).mtimeMs;
  if (age < WEEK) {
    note(`existing dataset is ${Math.round(age / 86400000)}d old — keeping it.`);
    process.exit(0);
  }
} catch {
  /* no file yet — fetch it */
}

const url = `${URL_BASE}?edition_id=GeoLite2-ASN&license_key=${encodeURIComponent(KEY)}&suffix=tar.gz`;

try {
  note("downloading GeoLite2-ASN…");
  const res = await fetch(url);
  if (!res.ok) {
    // 401 here is almost always a key that was revoked or copied with whitespace.
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "asn-"));
  const tgz = path.join(tmp, "asn.tar.gz");
  fs.writeFileSync(tgz, buf);

  // The archive holds GeoLite2-ASN_<date>/GeoLite2-ASN.mmdb. --strip-components
  // flattens the dated directory so the output path is stable.
  execFileSync("tar", ["-xzf", tgz, "-C", tmp, "--strip-components=1"], { stdio: "pipe" });

  const found = fs
    .readdirSync(tmp, { recursive: true })
    .map(String)
    .find((f) => f.endsWith("GeoLite2-ASN.mmdb"));
  if (!found) throw new Error("archive contained no GeoLite2-ASN.mmdb");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.copyFileSync(path.join(tmp, found), OUT);
  fs.rmSync(tmp, { recursive: true, force: true });

  const mb = (fs.statSync(OUT).size / 1048576).toFixed(1);
  note(`ready: data/GeoLite2-ASN.mmdb (${mb} MB)`);
} catch (err) {
  // Never fail the build. A deploy that ships without labels is fine; a deploy
  // that does not ship because MaxMind had a bad afternoon is not.
  note(`download failed (${err.message}) — continuing without labels.`);
  process.exit(0);
}

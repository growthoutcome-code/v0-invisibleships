#!/usr/bin/env python3
"""Archive every cited source at the Internet Archive, and record where.

Why
---
Three citations vanished from their own publishers while the crime section was
being written: the UNODC burglary indicator, the BJS prison-capacity table, and
SAMHSA's 988 metrics page. A site whose entire argument is "you can check this
yourself" cannot rest on links that a publisher may withdraw. Every source row
already carries an `archived_url` field. Until this script ran, all 961 of them
were empty.

What it does
------------
For each cited URL, in order:

  1. Ask the Wayback CDX index whether a snapshot exists AT OR AFTER the date we
     recorded accessing the page. Earlier snapshots are not enough — a 2015
     capture does not show the page we actually read in 2026.
  2. If none exists, ask Save Page Now to make one.
  3. If Save Page Now will not take it — paywalls, robots exclusions, publishers
     that block the crawler — fall back to the most recent capture from BEFORE
     we read the page, and mark it as predating access rather than passing it
     off as evidence of what we quoted.
  4. Record the snapshot URL and its capture date back into the source table.

Everything is written to a ledger after every single URL, so the run is
resumable: interrupt it, re-run it, and it picks up where it stopped without
re-requesting anything it already has.

Running it
----------
    python3 scripts/wayback_sweep.py                # the whole sweep
    python3 scripts/wayback_sweep.py --dry-run      # show the work, touch nothing
    python3 scripts/wayback_sweep.py --only crime   # one table
    python3 scripts/wayback_sweep.py --limit 25     # a taste, to see it work
    python3 scripts/wayback_sweep.py --check        # report coverage, archive nothing

Anonymous Save Page Now is rate-limited to a handful of captures a minute, so
the full sweep is a few hours. It does not need watching. If you have an
archive.org account, generating S3 keys at https://archive.org/account/s3.php
and exporting them makes it several times faster:

    export IA_ACCESS_KEY=...   IA_SECRET_KEY=...

The script reads those from the environment if they are set and falls back to
anonymous requests if they are not. It never stores them.

Standard library only — no pip install.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent

TABLES = [
    ("crime", ROOT / "public/data/crime/tables/crime_sources.json", "source_id"),
    ("health", ROOT / "public/data/health/tables/health_sources.json", "source_id"),
    ("main", ROOT / "public/data/tables/sources.json", "id"),
]

LEDGER = ROOT / "research/archive/wayback-ledger.json"

CDX = "https://web.archive.org/cdx/search/cdx"
SAVE = "https://web.archive.org/save/"
UA = "invisibleships-archive-sweep/1.0 (+https://invisibleships.com)"

# Anonymous Save Page Now tolerates roughly this; with S3 keys we can push harder.
PAUSE_ANON = 14.0
PAUSE_KEYED = 4.0
TIMEOUT = 60
MAX_RETRY = 3

# A source with no recorded access date: assume it was read no earlier than the
# day this site's data pipeline began, rather than accepting any snapshot ever.
FLOOR = "20250101"

# "we could not confirm a capture" is NOT the same as "the publisher refused".
# Recording an older snapshot for the first case would mark a page as predating
# access when we may have just captured it fine and the index had not caught up.
UNCONFIRMED = "unconfirmed"

# Save Page Now caps captures per URL per day by resource type — PDFs at one.
# Hitting that cap is NOT a refusal: it is the archive telling us a capture from
# today already exists. Sean's trial run met it on the second pass and the old
# code read it as "this publisher will not be captured", which is backwards.
ALREADY_TODAY = "too-many-daily-captures"


# --------------------------------------------------------------------------- io
def load(p: pathlib.Path):
    return json.loads(p.read_text()) if p.exists() else []


def save_json(p: pathlib.Path, data) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2) + "\n")


def get(url: str, headers: dict | None = None, timeout: int = TIMEOUT, data: bytes | None = None):
    """One HTTP request. Returns (status, body_text, headers). Never raises for HTTP errors."""
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace"), r.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), e.headers
    except Exception as e:                                   # timeout, DNS, reset
        return 0, f"{type(e).__name__}: {e}", {}


# ------------------------------------------------------------------- date logic
def as_stamp(value: str | None) -> str:
    """'2026-08-21' -> '20260821'. Anything unparseable falls back to FLOOR."""
    if not value:
        return FLOOR
    digits = re.sub(r"\D", "", str(value))
    return digits[:8] if len(digits) >= 8 else FLOOR


def accessed_of(row: dict) -> str:
    return as_stamp(row.get("accessed") or row.get("published_on"))


# ----------------------------------------------------------------- wayback calls
def cdx(url: str, **params) -> list[list[str]]:
    """Query the Wayback CDX index. Returns data rows without the header."""
    q = urllib.parse.urlencode({
        "url": url, "output": "json", "filter": "statuscode:200",
        "fl": "timestamp,original", "collapse": "digest", **params,
    })
    status, body, _ = get(f"{CDX}?{q}")
    if status != 200 or not body.strip():
        return []
    try:
        rows = json.loads(body)
    except json.JSONDecodeError:
        return []
    return rows[1:] if len(rows) > 1 else []


def snapshot_at_or_after(url: str, since: str) -> tuple[str | None, str]:
    """The first 200-status snapshot at or after `since`.

    Uses the CDX index rather than the availability API on purpose: availability
    returns the snapshot CLOSEST to a timestamp, which is frequently one from
    BEFORE the date we read the page. A capture that predates our reading does
    not evidence the page we cited — the figures on it may not be the figures we
    quoted. So this is strict, and a fresh capture is requested when it fails.
    """
    rows = cdx(url, **{"from": since, "limit": 1})
    if not rows:
        return None, "none since accessed"
    stamp, original = rows[0][0], rows[0][1]
    return f"https://web.archive.org/web/{stamp}/{original}", stamp


def snapshot_before(url: str, since: str) -> tuple[str | None, str]:
    """The most recent snapshot from BEFORE we read the page.

    Last resort, used only when Save Page Now will not capture the page at all
    (paywalls, robots exclusions, publishers that block the crawler). It is
    weaker evidence and the date is recorded alongside it so the page can say
    so plainly rather than implying the capture matches what we quoted.
    """
    rows = cdx(url, to=since, limit=1, sort="reverse")
    if not rows:
        return None, "no snapshot at all"
    stamp, original = rows[0][0], rows[0][1]
    return f"https://web.archive.org/web/{stamp}/{original}", stamp


def captured_today(url: str) -> tuple[str | None, str]:
    """Find today's capture in the index, waiting for it to be indexed.

    Called when the archive has told us a capture from today exists — either
    because it just made one, or because the daily cap says it already had. The
    index is the only authority on where that capture lives, and it lags. If it
    still has not appeared, the caller must retry on a later run: recording an
    older snapshot here would mark a freshly captured page as predating access.
    """
    today = time.strftime("%Y%m%d", time.gmtime())
    for wait in (0, 5, 10, 20, 30):
        if wait:
            time.sleep(wait)
        rows = cdx(url, **{"from": today, "limit": 1})
        if rows:
            return f"https://web.archive.org/web/{rows[0][0]}/{rows[0][1]}", rows[0][0]
    return None, UNCONFIRMED


def request_save(url: str, keys: tuple[str, str] | None) -> tuple[str | None, str]:
    """Ask Save Page Now for a capture. Returns (archived_url, timestamp-or-note).

    This function used to scrape the snapshot timestamp out of whatever HTML SPN
    handed back. That was wrong, and the first ten-URL run showed it: three
    "fresh captures" came back dated 1, 16 and 18 August when the run was on the
    23rd. The first `/web/<timestamp>/` in an archived page is very often the
    Wayback TOOLBAR's link to a DIFFERENT, older snapshot — so rows were being
    recorded as current captures while pointing at older ones, which is exactly
    the distinction the "predates access" marking exists to make.

    So the timestamp now comes from the only place that actually knows it: the
    SPN2 job API, which returns the capture's own timestamp when the job
    finishes. Everything else is treated as "not captured" rather than guessed
    at, and the caller falls back to a marked older snapshot.
    """
    headers = {"Accept": "application/json"}
    if keys:
        headers["Authorization"] = f"LOW {keys[0]}:{keys[1]}"

    # if_not_archived_within asks SPN to hand back an existing recent capture
    # instead of spending a daily allowance making a duplicate. It is what stops
    # a re-run from burning the cap and then having to go looking for what it
    # already had.
    payload = urllib.parse.urlencode({
        "url": url, "skip_first_archive": "1",
        "if_not_archived_within": "86400",
    }).encode()
    status, body, resp_headers = get(
        "https://web.archive.org/save",
        headers={**headers, "Content-Type": "application/x-www-form-urlencoded"},
        timeout=120, data=payload)

    if status == 429:
        return None, "rate limited"
    if status in (401, 403):
        return None, f"refused ({status})"
    if status == 0:
        return None, body[:60]

    job, immediate = None, {}
    try:
        immediate = json.loads(body) or {}
        job = immediate.get("job_id")
    except json.JSONDecodeError:
        pass

    ext = str(immediate.get("status_ext") or "")
    if ALREADY_TODAY in ext:
        # A capture from today exists. Go and find it rather than treating the
        # cap as a refusal — indexing lags the capture by anything from seconds
        # to several minutes, so this is patient.
        return captured_today(url)
    if immediate.get("status") == "error":
        return None, ext.replace("error:", "")[:40] or "spn error"

    if not job:
        # No job id. The JSON API did not take the submission — but the plain
        # GET form demonstrably DOES capture (it made four real captures on the
        # first trial run), so fall back to it and then confirm the result the
        # only trustworthy way: ask the index whether a capture from today now
        # exists. Never scrape the body again.
        get(SAVE + url, headers={"Accept": "text/html"}, timeout=120)
        return captured_today(url)

    # Poll the job. Captures usually land in 5-30s; a slow publisher can take longer.
    for _ in range(40):
        time.sleep(3)
        s, b, _h = get(f"https://web.archive.org/save/status/{job}", headers=headers)
        if s != 200:
            continue
        try:
            r = json.loads(b)
        except json.JSONDecodeError:
            continue
        state = r.get("status")
        if state == "success":
            stamp = str(r.get("timestamp") or "")
            original = r.get("original_url") or url
            if len(stamp) == 14:
                return f"https://web.archive.org/web/{stamp}/{original}", stamp
            return None, "success without timestamp"
        if state == "error":
            ext = str(r.get("status_ext") or "")
            if ALREADY_TODAY in ext:
                return captured_today(url)
            return None, (ext.replace("error:", "") or "spn error")[:40]
    return None, "capture timed out"


# ------------------------------------------------------------------- the sweep
def collect(only: str | None) -> list[dict]:
    """Every cited URL, with the table and key it came from."""
    work, seen = [], {}
    for tag, path, key in TABLES:
        if only and only != tag:
            continue
        for row in load(path):
            url = (row.get("url") or "").strip()
            if not url.startswith("http"):
                continue
            entry = {"table": tag, "path": str(path), "key": key,
                     "id": row.get(key), "url": url, "since": accessed_of(row),
                     "have": (row.get("archived_url") or "").strip()}
            # The same URL is cited from more than one table. Archive it once,
            # but remember every row that needs the answer written back.
            if url in seen:
                seen[url]["also"].append(entry)
            else:
                entry["also"] = []
                seen[url] = entry
                work.append(entry)
    return work


def write_back(results: dict) -> dict:
    """Fold archived urls into the source tables. Returns per-table counts."""
    counts = {}
    for tag, path, key in TABLES:
        rows = load(path)
        if not rows:
            continue
        n = 0
        for row in rows:
            url = (row.get("url") or "").strip()
            hit = results.get(url) or {}
            got = hit.get("archived_url")
            if got and (row.get("archived_url") or "") != got:
                row["archived_url"] = got
                row["archived_at"] = hit.get("archived_at") or ""
                row["archive_note"] = "predates access" if hit.get("how") == "predates" else ""
                n += 1
        if n:
            save_json(path, rows)
        counts[tag] = (n, sum(1 for r in rows if (r.get("archived_url") or "").strip()), len(rows))
    return counts


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", choices=["crime", "health", "main"])
    ap.add_argument("--limit", type=int, help="stop after this many URLs")
    ap.add_argument("--dry-run", action="store_true", help="show the work, change nothing")
    ap.add_argument("--check", action="store_true", help="report coverage and exit")
    ap.add_argument("--debug", metavar="URL",
                    help="submit one URL and print exactly what the archive says")
    ap.add_argument("--recheck", action="store_true",
                    help="re-query URLs the ledger already answered")
    args = ap.parse_args()

    if args.debug:
        keys = None
        if os.environ.get("IA_ACCESS_KEY") and os.environ.get("IA_SECRET_KEY"):
            keys = (os.environ["IA_ACCESS_KEY"], os.environ["IA_SECRET_KEY"])
        hdr = {"Accept": "application/json",
               "Content-Type": "application/x-www-form-urlencoded"}
        if keys:
            hdr["Authorization"] = f"LOW {keys[0]}:{keys[1]}"
        body = urllib.parse.urlencode({"url": args.debug, "skip_first_archive": "1"}).encode()
        st, bd, hh = get("https://web.archive.org/save", headers=hdr, timeout=120, data=body)
        print(f"POST /save -> HTTP {st}")
        print("content-type:", hh.get("Content-Type", "?") if hh else "?")
        print("body (first 400 chars):")
        print(bd[:400].replace("\n", " ") or "(empty)")
        return 0

    ledger = {}
    if LEDGER.exists():
        ledger = json.loads(LEDGER.read_text())

    work = collect(args.only)

    if args.check:
        for tag, path, key in TABLES:
            if args.only and args.only != tag:
                continue
            rows = load(path)
            done = sum(1 for r in rows if (r.get("archived_url") or "").strip())
            print(f"{tag:6s} {done:4d} / {len(rows):4d} archived")
        pending = [w for w in work if not w["have"] and w["url"] not in ledger]
        print(f"\n{len(work)} unique urls · {len(pending)} still to do · ledger holds {len(ledger)}")
        return 0

    todo = [w for w in work
            if args.recheck or (not w["have"] and w["url"] not in ledger)]
    if args.limit:
        todo = todo[:args.limit]

    keys = None
    if os.environ.get("IA_ACCESS_KEY") and os.environ.get("IA_SECRET_KEY"):
        keys = (os.environ["IA_ACCESS_KEY"], os.environ["IA_SECRET_KEY"])
    pause = PAUSE_KEYED if keys else PAUSE_ANON

    print(f"{len(work)} unique cited urls · {len(todo)} to process")
    print(f"credentials: {'S3 keys found' if keys else 'anonymous (slower)'} · "
          f"~{pause:.0f}s between saves")
    if todo:
        mins = len(todo) * pause / 60
        print(f"estimated worst case: {mins:.0f} min if every one needs a fresh capture\n")
    if args.dry_run:
        for w in todo[:40]:
            print(f"  [{w['table']}] since {w['since']}  {w['url'][:96]}")
        if len(todo) > 40:
            print(f"  … and {len(todo) - 40} more")
        return 0

    found = saved = stale = failed = 0
    try:
        for i, w in enumerate(todo, 1):
            url = w["url"]

            snap, stamp = snapshot_at_or_after(url, w["since"])
            if snap:
                ledger[url] = {"archived_url": snap, "archived_at": stamp,
                               "how": "existing"}
                found += 1
                print(f"[{i}/{len(todo)}] have   {stamp[:8]}  {url[:70]}")
                save_json(LEDGER, ledger)
                time.sleep(1.0)                              # CDX is cheap; be polite
                continue

            snap, stamp = request_save(url, keys)
            if snap and stamp[:8] >= w["since"]:
                ledger[url] = {"archived_url": snap, "archived_at": stamp,
                               "how": "saved"}
                saved += 1
                print(f"[{i}/{len(todo)}] SAVED  {stamp[:8]}  {url[:70]}")
            elif snap:
                # A "capture" dated before we read the page is not a capture of
                # what we read. This cannot happen through the SPN2 job API,
                # which reports the timestamp of the job it just ran — it is here
                # because the earlier body-scraping implementation DID produce
                # this, silently, and a guard costs nothing.
                ledger[url] = {"archived_url": snap, "archived_at": stamp,
                               "how": "predates", "note": "save returned an older capture"}
                stale += 1
                print(f"[{i}/{len(todo)}] older  {stamp[:8]}  {url[:70]}")
            elif stamp == UNCONFIRMED:
                # Left OUT of the ledger on purpose, so the next run retries it.
                # Do not fall back to an older snapshot here: we may well have
                # captured this page and simply not seen it indexed yet, and
                # marking it "predates access" would be a claim we cannot support.
                failed += 1
                print(f"[{i}/{len(todo)}] retry  not yet indexed        {url[:58]}")
            else:
                note = stamp
                # Save Page Now would not take it. An older capture is weaker
                # evidence, but it is not nothing, and its date travels with it.
                old, oldstamp = snapshot_before(url, w["since"])
                if old:
                    ledger[url] = {"archived_url": old, "archived_at": oldstamp,
                                   "how": "predates", "note": note}
                    stale += 1
                    print(f"[{i}/{len(todo)}] older  {oldstamp[:8]}  {url[:70]}")
                else:
                    # Do NOT record a failure as final — leaving it out of the
                    # ledger means the next run retries it, which is what we want.
                    failed += 1
                    print(f"[{i}/{len(todo)}] miss   {note:<26} {url[:58]}")
                if note == "rate limited":
                    print("        backing off 90s")
                    time.sleep(90)
            save_json(LEDGER, ledger)
            time.sleep(pause)
    except KeyboardInterrupt:
        print("\ninterrupted — ledger saved, re-run to continue")

    save_json(LEDGER, ledger)
    results = {u: v for u, v in ledger.items()}
    counts = write_back(results)

    print(f"\nexisting snapshots found : {found}")
    print(f"newly captured           : {saved}")
    print(f"older capture only       : {stale}   (predates the date we read it)")
    print(f"still missing            : {failed}")
    for tag, (written, done, total) in counts.items():
        print(f"{tag:6s} +{written:<4d} now {done}/{total} archived")
    if failed:
        print("\nRe-run the same command to retry what is still missing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

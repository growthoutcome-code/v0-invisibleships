#!/usr/bin/env python3
"""
Inject the Crime lane (track G) into the master timeline.

Reads   public/data/crime/tables/crime_milestones.json
Patches report-src/gov-cloud-dashboard.html (marker-guarded)
Then run scripts/build_govcloud_report.py to regenerate the site report.

Follows inject_health_track.py exactly, including the lesson it learned the
hard way: the structural passes run once behind a marker guard, but the DATA
refresh runs every time, so editing crime_milestones.json actually updates the
timeline instead of silently no-opping.

Only milestones from 2015 onward are injected (the master timeline's window).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "report-src", "gov-cloud-dashboard.html")
MILS = os.path.join(ROOT, "public", "data", "crime", "tables", "crime_milestones.json")
MARK = "CRIME-TRACK-G"

html = open(SRC, encoding="utf-8").read()
# Two separate guards. The legend's HTML comment contains "CRIME-TRACK-G" as a
# substring, so a bare `MARK in html` test conflates "legend present" with
# "data present" — which is exactly how one broken run left the structure
# applied but the data missing, and the refresh pass then failed forever.
STRUCT_DONE = "G:510" in html
DATA_DONE = ("/*" + MARK + "*/") in html

milestones = json.load(open(MILS, encoding="utf-8"))


def pad(d):
    return d if len(d) == 10 else d + "-01"


rows = []
for m in milestones:
    o = pad(m["occurred_on"])
    if o < "2015-01-01":
        continue
    rows.append({
        "o": o, "tk": "G", "g": m.get("geo", ""), "v": "",
        "d": "crime", "ti": f"[{m['category']}] {m['title']}",
        "rel": "", "dc": "fixed",
        "t": m["tier"],
    })
rows.sort(key=lambda r: r["o"])
inject = json.dumps(rows, ensure_ascii=False)[1:-1]


def sub_once(pattern, repl, label, count=1):
    global html
    new, n = re.subn(pattern, repl, html, count=count, flags=re.S)
    if n != count:
        sys.exit(f"FAILED to patch: {label} (matched {n}, wanted {count})")
    html = new


first = sub_once if not STRUCT_DONE else (lambda *a, **k: None)

# 1. Append G rows INSIDE the mils array. The F marker sits OUTSIDE the closing
# bracket (`]/*HEALTH-TRACK-F*/`), so the insertion point is before that `]` —
# inserting at the marker itself put the rows outside the array and broke the
# script with a syntax error the first time.
# (data insertion moved to the DATA_DONE block at the end, so structure and
# data recover independently)

# 2. Stat tiles row gains a Crime tile.
first(r"(\[\'Health\',M\.filter\(m=>m\.tk===\'F\'\)\.length\])\]",
      r"\1,['Crime',M.filter(m=>m.tk==='G').length]]",
      "tiles")

# 3. Lane geometry: add lane G and grow the SVG again.
first(r"const W=1120,H=505,", "const W=1120,H=580,", "svg height")
first(r"const lane=\{A:60,B:135,C:210,D:285,E:360,F:435\}",
      "const lane={A:60,B:135,C:210,D:285,E:360,F:435,G:510}", "lane map")

# 4. Lane labels.
first(r"(\[\'Health\',lane\.F,\'--series-6\'\])\]",
      r"\1,['Crime',lane.G,'--series-7']]", "lane labels")

# 5. Track -> series colour map.
first(r"tk2s=\{A:\'--series-2\',B:\'--series-1\',C:\'--series-3\',D:\'--series-4\',E:\'--series-5\',F:\'--series-6\'\}",
      "tk2s={A:'--series-2',B:'--series-1',C:'--series-3',D:'--series-4',E:'--series-5',F:'--series-6',G:'--series-7'}",
      "tk2s")

# 6. Tooltip track names. (The A lane reads 'Legislation' since the Law rename.)
first(r"\{A:\'Legislation\',B:\'Release\',C:\'Deploy/enforcement\',D:\'Litigation\',E:\'Investment\',F:\'Health\'\}",
      "{A:'Legislation',B:'Release',C:'Deploy/enforcement',D:'Litigation',E:'Investment',F:'Health',G:'Crime'}",
      "tooltip names")

# 7. Standalone palette: a 7th hue in all three :root blocks (site build rebinds
#    to the grayscale ramp).
first(r"--series-6:#8f2f5f;", "--series-6:#8f2f5f;--series-7:#2f6f8f;", "light palette")
sub_once(r"--series-6:#e979ab;", "--series-6:#e979ab;--series-7:#79c2e9;", "dark palette", count=2)

# 8. Legend swatch beside Health (F): guarded by its own marker.
MARK2 = "CRIME-TRACK-G-LEGEND"
if MARK2 not in html:
    sub_once(
        r'(<span><span class="sw" style="background:var\(--series-6\)"></span>Health \(F\)</span>)',
        r'\1<span><span class="sw" style="background:var(--series-7)"></span>Crime (G)</span>'
        + f"<!--{MARK2}-->",
        "legend swatch")

if not DATA_DONE:
    # first-time (or recovered) data insertion, inside the array's closing bracket
    if "/*" + MARK + "*/" not in html:
        sub_once(r"\](/\*HEALTH-TRACK-F\*/)",
                 lambda m: "," + inject + "/*" + MARK + "*/]" + m.group(1),
                 "mils array (data insertion)")
    open(SRC, "w", encoding="utf-8").write(html)
    print(f"injected {len(rows)} track-G milestones (of {len(milestones)} total; pre-2015 excluded)")
else:
    before = html
    pattern = (r',(\{\s*"o":\s*"\d{4}-\d{2}-\d{2}",\s*"tk":\s*"G".*?)(/\*'
               + MARK + r'\*/\])')
    html, n = re.subn(
        pattern,
        lambda m: "," + inject + m.group(2),
        html, count=1, flags=re.S,
    )
    if n != 1:
        sys.exit(f"FAILED to refresh track-G rows (matched {n}, wanted 1)")
    if html == before:
        print(f"track G already current — {len(rows)} milestones, no change")
    else:
        open(SRC, "w", encoding="utf-8").write(html)
        print(f"refreshed track-G rows: {len(rows)} milestones")

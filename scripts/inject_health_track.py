#!/usr/bin/env python3
"""Inject timeline track F ("Health") into the Government Cloud dashboard source.

Reads   public/data/health/tables/health_milestones.json
Patches report-src/gov-cloud-dashboard.html in place (idempotent — a marker guards
        every edit, so re-running is a no-op), then expects the caller to re-run
        scripts/build_govcloud_report.py to regenerate the site component + JS.

Track F carries Public Health Signals milestones (suicide, overdose, prescribing,
health). Only milestones from 2015 onward are injected: the master timeline's
x-axis starts at 2015 and clamps earlier dates, which would pile China 2002,
Russia 2006 and the 2013 fentanyl-wave onset onto the axis edge. Those render in
the Health Signals section instead.

Editorial note: track F reports public health statistics alongside — not connected
to — the procurement record. The tooltip carries the category so a reader can see
what kind of signal each point is.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "report-src", "gov-cloud-dashboard.html")
MILS = os.path.join(ROOT, "public", "data", "health", "tables", "health_milestones.json")
MARK = "HEALTH-TRACK-F"

html = open(SRC, encoding="utf-8").read()
if MARK in html:
    print("already injected — no-op")
    sys.exit(0)

milestones = json.load(open(MILS, encoding="utf-8"))

def pad(d):  # YYYY-MM -> YYYY-MM-01
    return d if len(d) == 10 else d + "-01"

rows = []
for m in milestones:
    o = pad(m["occurred_on"])
    if o < "2015-01-01":
        continue
    rows.append({
        "o": o, "tk": "F", "g": m.get("geo", ""), "v": "",
        "d": "health", "ti": f"[{m['category']}] {m['title']}",
        "rel": "", "dc": "fixed",
        "t": m["tier"],
    })
rows.sort(key=lambda r: r["o"])
inject = json.dumps(rows, ensure_ascii=False)[1:-1]  # strip [ ]

def sub_once(pattern, repl, label, count=1):
    global html
    new, n = re.subn(pattern, repl, html, count=count, flags=re.S)
    if n != count:
        sys.exit(f"FAILED to patch: {label} (matched {n}, wanted {count})")
    html = new

# 1. Append F rows to the mils array (find its closing bracket via the next key).
sub_once(r'("mils":\[.*?)\](,"\w+":)',
         lambda m: m.group(1) + "," + inject + "]/*" + MARK + "*/" + m.group(2),
         "mils array")

# 2. Stat tiles row gains a Health tile.
sub_once(r"(\[\'Investment\',M\.filter\(m=>m\.tk===\'E\'\)\.length\])\]",
         r"\1,['Health',M.filter(m=>m.tk==='F').length]]",
         "tiles")

# 3. Lane geometry: add lane F and grow the SVG.
sub_once(r"const W=1120,H=430,", "const W=1120,H=505,", "svg height")
sub_once(r"const lane=\{A:60,B:135,C:210,D:285,E:360\}",
         "const lane={A:60,B:135,C:210,D:285,E:360,F:435}", "lane map")

# 4. Lane labels: add the Health lane label.
sub_once(r"(\[\'Investment\',lane\.E,\'--series-5\'\])\]",
         r"\1,['Health',lane.F,'--series-6']]", "lane labels")

# 5. Track -> series colour map.
sub_once(r"tk2s=\{A:\'--series-2\',B:\'--series-1\',C:\'--series-3\',D:\'--series-4\',E:\'--series-5\'\}",
         "tk2s={A:'--series-2',B:'--series-1',C:'--series-3',D:'--series-4',E:'--series-5',F:'--series-6'}",
         "tk2s")

# 6. Tooltip track names.
sub_once(r"\(\{A:\'Law\',B:\'Release\',C:\'Deploy/enforcement\',D:\'Litigation\',E:\'Investment\'\}\)",
         "({A:'Law',B:'Release',C:'Deploy/enforcement',D:'Litigation',E:'Investment',F:'Health'})",
         "tooltip names")

# 7. Standalone palette: give the artifact a 6th hue in all three :root blocks
#    (the site build rebinds these to the grayscale ramp anyway).
sub_once(r"--series-5:#4a3aa7;", "--series-5:#4a3aa7;--series-6:#8f2f5f;", "light palette")
sub_once(r"--series-5:#9085e9;", "--series-5:#9085e9;--series-6:#e979ab;", "dark palette", count=2)

open(SRC, "w", encoding="utf-8").write(html)
print(f"injected {len(rows)} track-F milestones (of {len(milestones)} total; pre-2015 excluded)")

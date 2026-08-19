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
ALREADY = MARK in html

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

# First pass (track injection) is skipped wholesale when already applied;
# the second pass below has its own guard.
first = sub_once if not ALREADY else (lambda *a, **k: None)

# 1. Append F rows to the mils array (find its closing bracket via the next key).
first(r'("mils":\[.*?)\](,"\w+":)',
         lambda m: m.group(1) + "," + inject + "]/*" + MARK + "*/" + m.group(2),
         "mils array")

# 2. Stat tiles row gains a Health tile.
first(r"(\[\'Investment\',M\.filter\(m=>m\.tk===\'E\'\)\.length\])\]",
         r"\1,['Health',M.filter(m=>m.tk==='F').length]]",
         "tiles")

# 3. Lane geometry: add lane F and grow the SVG.
first(r"const W=1120,H=430,", "const W=1120,H=505,", "svg height")
first(r"const lane=\{A:60,B:135,C:210,D:285,E:360\}",
         "const lane={A:60,B:135,C:210,D:285,E:360,F:435}", "lane map")

# 4. Lane labels: add the Health lane label.
first(r"(\[\'Investment\',lane\.E,\'--series-5\'\])\]",
         r"\1,['Health',lane.F,'--series-6']]", "lane labels")

# 5. Track -> series colour map.
first(r"tk2s=\{A:\'--series-2\',B:\'--series-1\',C:\'--series-3\',D:\'--series-4\',E:\'--series-5\'\}",
         "tk2s={A:'--series-2',B:'--series-1',C:'--series-3',D:'--series-4',E:'--series-5',F:'--series-6'}",
         "tk2s")

# 6. Tooltip track names.
first(r"\(\{A:\'Law\',B:\'Release\',C:\'Deploy/enforcement\',D:\'Litigation\',E:\'Investment\'\}\)",
         "({A:'Law',B:'Release',C:'Deploy/enforcement',D:'Litigation',E:'Investment',F:'Health'})",
         "tooltip names")

# 7. Standalone palette: give the artifact a 6th hue in all three :root blocks
#    (the site build rebinds these to the grayscale ramp anyway).
first(r"--series-5:#4a3aa7;", "--series-5:#4a3aa7;--series-6:#8f2f5f;", "light palette")
sub_once(r"--series-5:#9085e9;", "--series-5:#9085e9;--series-6:#e979ab;", "dark palette", count=2)

if not ALREADY:
    open(SRC, "w", encoding="utf-8").write(html)
    print(f"injected {len(rows)} track-F milestones (of {len(milestones)} total; pre-2015 excluded)")
else:
    print("track F already injected — skipping injection pass")


def patch_legend_and_counts():
    """Second, independently-guarded pass: timeline legend gains a Health (F)
    swatch and the report subline's milestone count includes track F."""
    global html
    MARK2 = "HEALTH-TRACK-F-LEGEND"
    html = open(SRC, encoding="utf-8").read()
    if MARK2 in html:
        print("legend/counts already patched — no-op")
        return
    total = 311 + len(rows)
    sub_once(
        r'(<span class="sw" style="background:var\(--series-5\)"></span>Investment \(E\)</span>)',
        r'\1<span><span class="sw" style="background:var(--series-6)"></span>Health (F)</span>'
        + f"<!--{MARK2}-->",
        "timeline legend",
    )
    sub_once(
        r"311 timeline milestones",
        f"{total} timeline milestones (incl. {len(rows)} health signals)",
        "subline milestone count",
    )
    open(SRC, "w", encoding="utf-8").write(html)
    print(f"legend + subline patched (total {total})")


patch_legend_and_counts()

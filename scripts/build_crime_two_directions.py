#!/usr/bin/env python3
"""Crime — "Two directions": criminal arrests down, civil immigration arrests up.

WHY THIS SCRIPT EXISTS AT ALL. arrests_over_time.json predates the builders and
has been hand-maintained; build_crime_incarceration.py notes that and sets only
its change_view flag. Hand-maintained content with no script that owns it is
this project's recurring failure — seven sightings so far — so everything this
change adds is written from here and is idempotent. Run it twice, get the same
file.

WHAT IT ADDS

1. The ICE line extended past FY2024, where it stopped, which is exactly where
   the surge begins. ONE point, at 2025, tier B so the chart draws it dotted —
   TwoSeriesChart already dots any point whose tier is not A, so no component
   change was needed to make provisional data look provisional.

   NOT annualised, and 2026 is NOT plotted. We hold one month of FY2026
   (~50,000, July, per AP). Multiplying that by twelve would be inventing a
   figure, so July stays a sentence and never becomes a data point.

2. nc13 in the "what nobody counts" register: no official FY2025 ICE arrest
   total exists. DHS stopped publishing detailed OHSS monthly enforcement
   tables after November 2024 data. The absence of the number is itself the
   finding, and it sits with harassment and the rest.

3. The FBI's Domestic Relationships and Violent Crimes 2020-2024 special
   report — the nearest thing to a federal measurement in the space this
   section's lead finding says is unmeasured.

4. Source rows for the two accomplishments that carried source_id: null.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_T = ROOT / "public/data/crime/tables"
CRIME_C = ROOT / "public/data/crime/charts"
ACCESSED = "2026-09-01"


def load(p):
    return json.loads(pathlib.Path(p).read_text()) if pathlib.Path(p).exists() else []


def save(p, data):
    pathlib.Path(p).write_text(json.dumps(data, indent=2) + "\n")


SOURCES = [
    {"source_id": "cs_ddp_ppi_2025", "url": "https://www.prisonpolicy.org/blog/2025/10/21/ice-arrests/",
     "publisher": "Prison Policy Initiative (from Deportation Data Project ICE FOIA files)",
     "title": "ICE arrests, 20 January - 15 October 2025", "evidence_tier": "B"},
    {"source_id": "cs_ap_ice_jul2026", "url": "https://apnews.com/article/border-immigration-customs-enforcement-data-statistics-f07f56a34bda225e5afa356781ac1740",
     "publisher": "Associated Press", "title": "ICE arrests jumped to nearly 50,000 in July, the highest monthly total of Trump's second term (25 Aug 2026)",
     "evidence_tier": "B"},
    {"source_id": "cs_ohss_hist", "url": "https://ohss.dhs.gov/topics/immigration/immigration-enforcement/annual-flow-report/historical",
     "publisher": "DHS Office of Homeland Security Statistics", "title": "Immigration Enforcement Actions annual flow reports (historical index)",
     "evidence_tier": "A"},
    {"source_id": "cs_fbi_dv_2026", "url": "https://www.fbi.gov/news/press-releases/fbi-releases-domestic-violence-special-report",
     "publisher": "FBI Uniform Crime Reporting Program", "title": "Domestic Relationships and Violent Crimes, 2020-2024 (special report, 12 Feb 2026)",
     "evidence_tier": "A"},
    {"source_id": "cs_fbi_vc_2025", "url": "https://www.fbi.gov/news/press-releases/violent-crime-falls-at-historic-rate-new-fbi-data-show",
     "publisher": "FBI", "title": "Violent Crime Falls at Historic Rate, New FBI Data Show (24 Aug 2026)",
     "evidence_tier": "A"},
    {"source_id": "cs_cdc_od_2024", "url": "https://www.cdc.gov/nchs/nvss/vsrr/drug-overdose-data.htm",
     "publisher": "CDC/NCHS", "title": "Provisional drug overdose death counts",
     "evidence_tier": "A"},
]

NOT_COUNTED = [{
    "nc_id": "nc13",
    "category": "Civil immigration arrests, after FY2024",
    "status": "No official annual total is published",
    "detail": (
        "DHS stopped publishing its detailed monthly immigration-enforcement tables after "
        "November 2024 data, and no official FY2025 administrative-arrest total exists. "
        "Every figure for 2025 and 2026 on this page is FOIA-derived or press-reported and "
        "is marked tier B for that reason. The series that runs FY2011 to FY2024 as "
        "published federal statistics simply stops, in the years it is most asked about."
    ),
    "who_would_collect": "DHS Office of Homeland Security Statistics, in the Immigration Enforcement Actions annual flow report.",
    "tier": "A",
    "source_id": "cs_ohss_hist",
}]

TRENDS = [
    {"topic": "two_directions",
     "statement": (
         "Two arrest series move in opposite directions. Criminal arrests fell from 15.28 million "
         "in 1997 to 7.52 million in 2024, 51% below peak, while violent crime fell 9.3% in 2025 — "
         "the largest year-to-year decline since the FBI began estimating in 1936. Civil immigration "
         "arrests fell to 74,082 in FY2021 and then rose, reaching about 217,500 between 20 January "
         "and 15 October 2025. They are separate legal systems counted by different agencies on "
         "different calendars, and neither series explains the other."),
     "tier": "B", "source_id": "cs_ddp_ppi_2025"},
    {"topic": "fbi_domestic_violence_2026",
     "statement": (
         "The FBI published Domestic Relationships and Violent Crimes, 2020-2024 in February 2026 — "
         "a five-year special report on violence between people who know each other. It is the "
         "nearest thing to a federal measurement in the space this section's lead finding says is "
         "unmeasured, and it does not close the gap: harassment still has no offence code, and "
         "stalking is still folded into Intimidation."),
     "tier": "A", "source_id": "cs_fbi_dv_2026"},
]

# The two accomplishments that carried source_id: null.
ACCOMPLISHMENT_SOURCES = {
    "The homicide reversal": "cs_fbi_vc_2025",
    "The overdose decline": "cs_cdc_od_2024",
}

ICE_2025 = {
    "year": 2025,
    "value": 217500,
    "tier": "B",
    "note": (
        "20 January - 15 October 2025, from ICE FOIA files via the Deportation Data Project. "
        "NOT an official fiscal-year total: no FY2025 figure has been published, and this window "
        "overshoots the fiscal year by 15 days. Drawn dotted for that reason."
    ),
}

THEMES = [
    {"statement": "Criminal arrests are down 51% from their 1997 peak. Over the same period crime fell too — American policing is getting a better outcome with roughly half the coercion.", "tier": "A"},
    {"statement": "Civil immigration arrests run the other way: a FY2021 trough of 74,082, then about 217,500 between January and October 2025, and nearly 50,000 in July 2026 alone.", "tier": "B"},
    {"statement": "The two are different legal systems on different calendars — one criminal, one administrative — and neither series explains the other.", "tier": "A"},
]


def merge(path, rows, key):
    existing = load(path)
    mine = {r[key] for r in rows}
    out = [r for r in existing if r.get(key) not in mine] + rows
    out.sort(key=lambda r: str(r.get(key)))
    save(path, out)
    return len(out)


def main():
    # --- sources -----------------------------------------------------------
    srcs = load(CRIME_T / "crime_sources.json")
    have = {s["source_id"] for s in srcs}
    added = 0
    for s in SOURCES:
        if s["source_id"] in have:
            continue
        srcs.append({**s, "accessed": ACCESSED, "archived_url": None})
        have.add(s["source_id"])
        added += 1
    save(CRIME_T / "crime_sources.json", srcs)

    # --- the chart ---------------------------------------------------------
    path = CRIME_C / "arrests_over_time.json"
    chart = load(path)
    ice = next(s for s in chart["series"] if "immigration" in s["name"].lower())
    ice["points"] = [p for p in ice["points"] if p["year"] != 2025] + [ICE_2025]
    ice["points"].sort(key=lambda p: p["year"])
    ice.setdefault("caveats", []).append(
        "FY2025 onward is not official. DHS stopped publishing monthly enforcement tables after "
        "November 2024 data; the 2025 point is FOIA-derived and dotted, and July 2026's "
        "~50,000 is carried as a statement rather than plotted, because one month is not a year."
    )
    ice["caveats"] = list(dict.fromkeys(ice["caveats"]))

    kept = [t for t in chart.get("themes", []) if t["statement"] not in {x["statement"] for x in THEMES}]
    chart["themes"] = THEMES + kept
    chart["accuracy_note"] = (
        "About the accuracy of these figures: arrest totals are estimates assembled from agency "
        "reports, and two official federal criminal-arrest series disagree (see the data-quality "
        "register); 2016 and 2021 are national gaps. The immigration line is federal FISCAL years. "
        "It is published federal statistics through FY2024 and nothing official after that — the "
        "2025 point is FOIA-derived, marked tier B and drawn dotted."
    )
    chart["change_view"] = True
    save(path, chart)

    # --- registers ---------------------------------------------------------
    # nc13, NOT nc08. The first draft of this script used nc08 and the merge
    # helper overwrote the existing home-invasion entry — a long researched row —
    # because merge() replaces by key. Caught in the diff and reverted. Any new
    # register row takes the next free id, and the id is checked before the run.
    nc_ids = {r["nc_id"] for r in load(CRIME_T / "crime_not_counted.json")}
    for row in NOT_COUNTED:
        if row["nc_id"] in nc_ids:
            raise SystemExit(f"refusing to run: {row['nc_id']} already exists and would be overwritten")
    n_nc = merge(CRIME_T / "crime_not_counted.json", NOT_COUNTED, "nc_id")
    n_tr = merge(CRIME_T / "crime_trends.json", TRENDS, "topic")

    # This register is an object with a rows[] list, not a bare array.
    acc = json.loads((CRIME_T / "crime_accomplishments.json").read_text())
    fixed = 0
    for row in acc.get("rows", []):
        sid = ACCOMPLISHMENT_SOURCES.get(row.get("what"))
        if sid and not row.get("source_id"):
            row["source_id"] = sid
            fixed += 1
    save(CRIME_T / "crime_accomplishments.json", acc)

    print(f"sources        : +{added} (total {len(srcs)})")
    print(f"arrests chart  : ICE series now {len(ice['points'])} points, ends {ice['points'][-1]['year']}")
    print(f"not counted    : {n_nc} entries (nc13 added)")
    print(f"trends         : {n_tr} entries")
    print(f"accomplishments: {fixed} source_id filled")


if __name__ == "__main__":
    main()

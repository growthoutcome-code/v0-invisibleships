#!/usr/bin/env python3
"""
Build the Crime section's landing chart: six priority lanes on one indexed axis,
plus the "what nobody counts" register.

Sean's priorities are harassment, character defamation, missing people and drug
overdoses, with homicide as one lane rather than the focus. Those use four
different units — deaths, offence counts, NCIC record entries, civil filings —
differing by orders of magnitude (overdoses ~70k against ~500k missing-person
entries). A shared linear axis would flatten four of the five into the floor.

So every lane is INDEXED to its own first year in the window = 100, and each
lane's label states its base year and what it actually counts. The chart then
answers "which of these is rising and which is falling", which is the question
the lanes can honestly share.

The harassment lane does not exist, and that absence is the section's headline
finding rather than a hole to be filled — see NOT_COUNTED below.

Idempotent. Reads the researched rows from /tmp/harass_rows.json plus the
already-built crime and health tables.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_T = ROOT / "public/data/crime/tables"
CRIME_C = ROOT / "public/data/crime/charts"
HEALTH_T = ROOT / "public/data/health/tables"
RESEARCH = pathlib.Path("/tmp/harass_rows.json")
RESEARCH_SRCS = pathlib.Path("/tmp/harass_srcs.json")

WINDOW_FROM, WINDOW_TO = 1999, 2025

# ---------------------------------------------------------------- the lanes ---
# (indicator_id, display name, what it counts, publisher, emphasis)
LANES = [
    ("ncic_missing_person_records_entered", "Missing persons",
     "NCIC missing-person records entered per year", "FBI NCIC", True),
    ("drug_overdose_deaths", "Drug overdose deaths",
     "deaths per year", "CDC/NCHS", True),
    ("federal_nos320_assault_libel_slander_filings", "Defamation filings",
     "federal civil cases commenced under Nature of Suit 320", "US Courts", True),
    ("fbi_murder_count", "Homicide",
     "murder and nonnegligent manslaughter known to police", "FBI", False),
    ("nibrs_intimidation_estimated_offenses", "Intimidation (incl. stalking)",
     "BJS national estimate of NIBRS offence 13C", "BJS", False),
    # Two indicator ids, one lane. Sean asked whether home invasions have risen
    # (2026-08-21); the answer runs through burglary, which is the only thing
    # anyone counts. The FBI's Summary Reporting System ended in 2019 and the
    # NIBRS-based estimates that replaced it are NOT a continuation, so the lane
    # carries a declared break at 2019 and the chart draws it as one.
    (["fbi_ucr_srs_burglary_p100k", "fbi_cde_burglary_p100k_est"], "Burglary (break-ins)",
     "burglary rate per 100,000 people known to police", "FBI", False),
]

# A lane whose basis changes mid-series declares the last year of the old
# basis here. LaneChart splits the path there rather than drawing through it,
# and the summary row below the chart states each half separately.
LANE_BREAKS = {
    "fbi_ucr_srs_burglary_p100k": 2019,
}
LANE_SUMMARY = {
    "fbi_ucr_srs_burglary_p100k":
        "2000–2019: −53% (SRS) · 2020–2024: −26% (NIBRS estimates)",
}

LANE_CAVEATS = {
    "ncic_missing_person_records_entered": [
        "Counts RECORDS, not people: one person can generate more than one record, "
        "and a record is cancelled when the case closes for any reason — cancellation "
        "does not mean found alive.",
        "Adults are not subject to the same mandatory-entry rules as juveniles, so adult "
        "cases are under-entered by an unknown margin.",
        "Tribal and Indigenous cases are documented as substantially undercounted.",
    ],
    "drug_overdose_deaths": [
        "2025 is provisional and will revise upward as late certificates are processed.",
        "Full series and the provisional-versus-final problem are in the Public Health section.",
    ],
    "federal_nos320_assault_libel_slander_filings": [
        "THIS IS A PROXY. Nature of Suit 320 is 'Assault, Libel & Slander' COMBINED. "
        "Defamation cannot be separated from assault claims in this series.",
        "Federal civil filings only. Most defamation is litigated in state courts, which "
        "publish no comparable national series.",
        "Defamation is a civil tort, not a crime, in essentially every US jurisdiction.",
    ],
    "fbi_murder_count": [
        "Counts differ between publication vintages; see the data-quality register.",
        "2022 and 2023 could not be verified against a fetched source and are absent.",
    ],
    "nibrs_intimidation_estimated_offenses": [
        "THREE POINTS ONLY. BJS's coverage-adjusted national estimates begin in 2022; "
        "the FBI publishes no citable national 13C series before that.",
        "NIBRS has no stalking offence code — the manual folds stalking into Intimidation, "
        "so stalking is inside this number and cannot be separated from one-off threats.",
        "2024 is the 'initial' provisional version and will be revised.",
    ],
    "fbi_ucr_srs_burglary_p100k": [
        "THE BASIS CHANGES IN 2020. Years to 2019 are the FBI's Summary Reporting "
        "System, which was then retired; 2020 onward are NIBRS-based national estimates "
        "built from agencies covering 87.2% of the population in 2024. The chart breaks "
        "the line there rather than drawing through it, and the index across the break "
        "is not a single measurement.",
        "Fewer burglaries are reported to police than a decade ago — 40.7% of "
        "victimisations in 2024 against 58.8% in 2010. Some of this police-recorded fall "
        "is fewer break-ins and some is fewer reports, and the two cannot be separated.",
        "Households asked directly report the same DIRECTION: 34.1 burglaries per 1,000 "
        "households in 1999 against 12.0 in 2024. That survey category was itself "
        "redefined in 2017, so its two halves are not one series either.",
        "About one burglary in seven is cleared — 15.2% in 2024.",
        "None of this counts home invasions. No US series does; see the register below.",
    ],
}

# ------------------------------------------------------------- not counted ---
NOT_COUNTED = [
    {
        "nc_id": "nc01",
        "category": "Harassment, as a crime",
        "status": "No national count exists",
        "detail": (
            "Harassment is not a NIBRS offense. The FBI's NIBRS User Manual lists eleven "
            "Group B offence codes and none of them is harassment; harassment charges fall "
            "into 90Z, 'All Other Offenses' — an undifferentiated bucket shared with "
            "everything else that has no code of its own. Nothing counts it separately."
        ),
        "who_would_collect": "FBI Criminal Justice Information Services, via a NIBRS offence code that does not exist.",
        "tier": "A",
        "source_id": "hs_nibrs_manual",
    },
    {
        "nc_id": "nc02",
        "category": "Stalking, as a crime",
        "status": "No national count exists",
        "detail": (
            "NIBRS has no stalking code either. The manual states that Intimidation "
            "'includes stalking', so every police-reported stalking figure in the national "
            "data is invisible inside offence 13C, mixed with one-off threats. There is no "
            "way to recover a stalking count from the published national series."
        ),
        "who_would_collect": "FBI CJIS. A separate code would be required.",
        "tier": "A",
        "source_id": "hs_nibrs_manual",
    },
    {
        "nc_id": "nc03",
        "category": "Harassment victimisation prevalence",
        "status": "Measured once, in 2006, then abandoned",
        "detail": (
            "The 2006 Supplemental Victimization Survey counted 2,432,930 harassment "
            "victims — people who experienced stalking-type conduct without reporting fear. "
            "The 2016 and 2019 waves dropped the category entirely. No federal statistical "
            "agency has produced a national harassment prevalence estimate in twenty years."
        ),
        "who_would_collect": "Bureau of Justice Statistics, via the Supplemental Victimization Survey.",
        "tier": "A",
        "source_id": "hs_svs",
    },
    {
        "nc_id": "nc04",
        "category": "Stalking victimisation, since 2019",
        "status": "Two comparable points, then nothing",
        "detail": (
            "The Supplemental Victimization Survey has run three times: 2006, 2016 and "
            "2019. BJS states that 2016 and 2019 estimates cannot be compared with 2006 — "
            "the age floor moved from 18 to 16 and the instrument was rewritten. That "
            "leaves two comparable points, 1.5% of people aged 16+ in 2016 and 1.3% in "
            "2019, and no wave since. Note that 2006 and 2019 both yield roughly 3.4 "
            "million victims; that coincidence is not a flat trend and must not be drawn "
            "as one."
        ),
        "who_would_collect": "Bureau of Justice Statistics. The survey has not been fielded since 2019.",
        "tier": "A",
        "source_id": "hs_svs",
    },
    {
        "nc_id": "nc05",
        "category": "Character defamation",
        "status": "Not a crime, and not counted as one",
        "detail": (
            "Defamation is a civil tort in essentially every US jurisdiction. Criminal "
            "libel survives in a handful of states and is rarely charged; no body compiles "
            "national prosecution counts. The nearest sourceable series is federal civil "
            "filings under Nature of Suit 320 — but that category is 'Assault, Libel & "
            "Slander' combined, so defamation cannot be separated out, and it excludes the "
            "state courts where most defamation is litigated."
        ),
        "who_would_collect": "No federal body collects it. State court administrators would each have to, and do not.",
        "tier": "A",
        "source_id": "hs_nos320",
    },
    {
        "nc_id": "nc06",
        "category": "Online harassment, after 2020",
        "status": "One private survey, discontinued",
        "detail": (
            "Pew Research's repeated online-harassment survey (2014, 2017, 2020) is the "
            "only national measurement of its kind, and it is a private survey rather than "
            "an official statistic. It recorded 35% of US adults reporting any online "
            "harassment in 2014 and 41% in both 2017 and 2020. There has been no wave "
            "since September 2020."
        ),
        "who_would_collect": "No federal agency measures it. Pew is not obliged to continue.",
        "tier": "B",
        "source_id": "hs_pew",
    },
]

NC_SOURCES = [
    {"source_id": "hs_nibrs_manual",
     "url": "https://le.fbi.gov/file-repository/ucr/nibrs-user-manual-2025.pdf",
     "publisher": "FBI CJIS", "title": "NIBRS User Manual 2025.0 (offence code definitions)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "hs_svs",
     "url": "https://bjs.ojp.gov/library/publications/stalking-victimization-2019",
     "publisher": "Bureau of Justice Statistics", "title": "Stalking Victimization, 2019 (Supplemental Victimization Survey)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "hs_nos320",
     "url": "https://www.uscourts.gov/statistics-reports/caseload-statistics-data-tables",
     "publisher": "Administrative Office of the US Courts", "title": "Federal Judicial Caseload Statistics, Table C-2 (Nature of Suit)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "hs_pew",
     "url": "https://www.pewresearch.org/internet/2021/01/13/the-state-of-online-harassment/",
     "publisher": "Pew Research Center", "title": "The State of Online Harassment (Jan 2021, fielded Sept 2020)",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
]

# Sweeping-enforcement examples: arrest counts announced as headline figures.
SWEEPS = [
    {
        "sweep_id": "sw01",
        "date": "2026-07-29",
        "operation": "FIFA World Cup human-trafficking crackdown",
        "agency": "ICE Homeland Security Investigations, with the DHS Center for Countering Human Trafficking",
        "headline": "905 arrests of suspected human traffickers; 180 victims rescued, 30 of them children",
        "what_the_number_is": (
            "An arrest count for a single operation. DHS publishes no breakdown of how many "
            "of the 905 were charged with trafficking offences rather than other offences "
            "encountered during the operation, and no conviction figures."
        ),
        "for_scale": (
            "HSI's own FY2024 report records 1,686 trafficking investigations producing "
            "2,545 arrests across the whole year — so one operation produced roughly a "
            "third of an annual arrest volume in a few weeks."
        ),
        "tier": "A",
        "source_id": "hs_dhs_worldcup",
    },
]

SWEEP_SOURCES = [
    {"source_id": "hs_dhs_worldcup",
     "url": "https://www.dhs.gov/news/2026/07/29/dhs-highlights-successful-arrests-and-rescues-crackdown-human-trafficking-during",
     "publisher": "US Department of Homeland Security",
     "title": "DHS Highlights Successful Arrests and Rescues in Crackdown on Human Trafficking During FIFA World Cup (2026-07-29)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "hs_dhs_ccht_fy24",
     "url": "https://www.dhs.gov/news/2025/08/13/dhs-center-countering-human-trafficking-releases-fiscal-year-2024-annual-report",
     "publisher": "US Department of Homeland Security",
     "title": "DHS Center for Countering Human Trafficking FY2024 Annual Report (2025-08-13)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
]


def load(p):
    return json.loads(pathlib.Path(p).read_text())


def save(p, d):
    pathlib.Path(p).write_text(json.dumps(d, indent=2) + "\n")


def main():
    research = load(RESEARCH)
    crime_ind = load(CRIME_T / "crime_indicators.json")
    health_ind = load(HEALTH_T / "health_indicators.json")
    sources = load(CRIME_T / "crime_sources.json")

    by_url = {s["url"]: s["source_id"] for s in sources}
    have = {s["source_id"] for s in sources}

    # fold the researched harassment/missing/defamation rows into crime_indicators
    added = 0
    known = {(r["indicator_id"], r["year"]) for r in crime_ind}
    for r in research:
        if r.get("value") is None or r.get("year") is None:
            continue
        key = (r["indicator_id"], r["year"])
        if key in known:
            continue
        sid = by_url.get(r.get("source_url", ""))
        if not sid:
            sid = f"cs{len(sources) + 1:03d}"
            sources.append({
                "source_id": sid, "url": r.get("source_url", ""),
                "publisher": r.get("publisher"), "title": r.get("publisher"),
                "evidence_tier": r.get("tier", "B"), "accessed": "2026-08-21",
                "archived_url": None,
            })
            by_url[r["source_url"]] = sid
        crime_ind.append({
            "indicator_id": r["indicator_id"], "geography": "US", "year": r["year"],
            "value": r["value"], "unit": r.get("unit", ""), "tier": r.get("tier", "C"),
            "publisher": r.get("publisher"), "source_id": sid, "workstream": "W2",
            "note": r.get("note", "") or "",
        })
        known.add(key)
        added += 1

    for extra in NC_SOURCES + SWEEP_SOURCES:
        if extra["source_id"] not in have:
            sources.append(extra)
            have.add(extra["source_id"])

    # ---- build the indexed lanes ------------------------------------------
    pool = crime_ind + [
        {**h, "indicator_id": "drug_overdose_deaths"}
        for h in health_ind
        if h.get("indicator_id", "").startswith("drug_overdose_deaths")
        and h.get("geography") == "US"
    ]

    series = []
    for ind_id, name, counts, publisher, emphasis in LANES:
        ids = ind_id if isinstance(ind_id, list) else [ind_id]
        key = ids[0]
        pts = sorted(
            [r for r in pool
             if r["indicator_id"] in ids
             and WINDOW_FROM <= r["year"] <= WINDOW_TO
             and r.get("value") is not None],
            key=lambda r: r["year"],
        )
        if len(pts) < 2:
            print(f"  ! {key}: only {len(pts)} points in window, skipped")
            continue
        base = pts[0]["value"]
        extra = {}
        if key in LANE_BREAKS:
            extra["break_after"] = LANE_BREAKS[key]
        if key in LANE_SUMMARY:
            extra["summary"] = LANE_SUMMARY[key]
        series.append({
            **extra,
            "name": name,
            "counts": counts,
            "publisher": publisher,
            "emphasis": emphasis,
            "base_year": pts[0]["year"],
            "base_value": base,
            "unit_raw": pts[0].get("unit", ""),
            "tier": pts[0].get("tier", "A"),
            "basis_short": f"{counts}; indexed to {pts[0]['year']} = 100",
            "points": [
                {"year": p["year"], "value": round(p["value"] / base * 100, 1),
                 "raw": p["value"], "tier": p.get("tier", "A")}
                for p in pts
            ],
            "caveats": LANE_CAVEATS.get(key, []),
        })

    # Theme callouts rendered directly under the chart (Sean, 2026-08-21:
    # chart first, copy consolidated and concise). Each line ties to a visible
    # lane; the last is the bridge into the "What nobody counts" register.
    themes = [
        {"statement": "Overdose deaths quadrupled since 1999 — the steepest rise of any lane — and have fallen since their 2022 peak.", "tier": "A"},
        {"statement": "Missing-person entries are at their modern low; whether that is fewer cases or less entering cannot be separated.", "tier": "A"},
        {"statement": "Defamation-adjacent federal filings are at a 22-year high, rising sharply since 2023.", "tier": "A"},
        {"statement": "Homicide spiked 29.4% in 2020, then fell to the lowest rate ever recorded.", "tier": "A"},
        {"statement": "Break-ins have fallen further than any other lane: 53% between 2000 and 2019 on the FBI basis that ran until then, and 26% more between 2020 and 2024 on the estimates that replaced it. Part of that is fewer reports rather than fewer break-ins — 40.7% of victimisations reached the police in 2024 against 58.8% in 2010.", "tier": "A"},
        {"statement": "Two categories this site cares about have no lane at all: harassment, because nobody counts it, and home invasion, because it is not an offence anyone records.", "tier": "A"},
    ]

    chart = {
        "title": "Six kinds of harm, indexed",
        "unit": "Each lane indexed to its own first year in this window = 100",
        "themes": themes,
        "note": (
            "These lanes count different things in different units, so each is indexed "
            "to its own first year = 100: the chart shows direction, never size. Dotted "
            "stretches are years that are not Tier A; hollow points mark a lane sampled "
            "with gaps; a gap with a marked year is a lane whose BASIS changed, drawn as "
            "a break rather than joined up. Click any lane for its raw figures, method "
            "and caveats."
        ),
        "publisher": "FBI; CDC/NCHS; BJS; US Courts",
        "tier": "A",
        "indexed": True,
        "series": series,
    }

    save(CRIME_C / "harm_lanes_indexed.json", chart)
    save(CRIME_T / "crime_indicators.json", crime_ind)
    save(CRIME_T / "crime_sources.json", sources)
    # MERGE by nc_id — build_crime_intl.py appends nc07 to this file, and a
    # wholesale save here wiped it once (the same clobber that hit sweeps).
    nc_path = CRIME_T / "crime_not_counted.json"
    nc_existing = json.loads(nc_path.read_text()) if nc_path.exists() else []
    nc_own = {x["nc_id"] for x in NOT_COUNTED}
    nc_merged = NOT_COUNTED + [x for x in nc_existing if x["nc_id"] not in nc_own]
    nc_merged.sort(key=lambda x: x["nc_id"])
    save(nc_path, nc_merged)
    # MERGE, never clobber: this file is also written to by other steps
    # (sw02 capacity, sw03 court outcomes). A wholesale save here silently
    # deleted sw02 once — entries are now replaced by id and the rest kept.
    sweeps_path = CRIME_T / "crime_sweeps.json"
    existing = json.loads(sweeps_path.read_text()) if sweeps_path.exists() else []
    own_ids = {x["sweep_id"] for x in SWEEPS}
    merged = [x for x in existing if x["sweep_id"] not in own_ids] + SWEEPS
    merged.sort(key=lambda x: x["sweep_id"])
    save(sweeps_path, merged)

    print(f"indicators : +{added} researched rows (total {len(crime_ind)})")
    print(f"sources    : {len(sources)}")
    print(f"not counted: {len(NOT_COUNTED)} | sweeps: {len(SWEEPS)}")
    print("lanes:")
    for s in series:
        last = s["points"][-1]
        print(f"  {s['name']:<30} {s['base_year']}={s['base_value']:>8}  ->  "
              f"{last['year']} index {last['value']:>6}  ({len(s['points'])} pts)")


if __name__ == "__main__":
    main()

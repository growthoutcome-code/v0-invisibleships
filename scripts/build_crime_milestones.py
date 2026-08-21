#!/usr/bin/env python3
"""
Crime milestones — the dated events behind the Data/Timeline crime lane (track G).

Every date is from a fetched source. The two 2026 enforcement entries came from
DHS/FBI press releases delivered to Sean's own subscription inbox and verified
against the published releases.

Idempotent: rebuilds crime_milestones.json each run and refreshes the verdict
to the question Sean set: has crime increased during the period this record
covers, and can a relationship be established.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public/data/crime/tables"

MILESTONES = [
    {"milestone_id": "cm01", "track": "G", "category": "measurement",
     "occurred_on": "2013-01",
     "title": "Fentanyl wave begins; overdose becomes the fastest-growing cause of death",
     "description": "CDC dates the third opioid wave to 2013. The overdose lane on the crime chart accelerates from here.",
     "certainty": "documented", "tier": "A", "source_id": "cs_ccj_2026", "geo": "US"},
    {"milestone_id": "cm02", "track": "G", "category": "homicide",
     "occurred_on": "2020-06",
     "title": "Murder rises 29.4% — the largest single-year increase on record",
     "description": "FBI, 2020 annual data. CDC death certificates register the same event independently (rate 6.0 to 7.8).",
     "certainty": "documented", "tier": "A", "source_id": None, "geo": "US"},
    {"milestone_id": "cm03", "track": "G", "category": "measurement",
     "occurred_on": "2021-01",
     "title": "NIBRS transition breaks the national crime series",
     "description": "Agency participation collapses to 65.7% population coverage; the FBI calls its own 2021 trends not statistically significant.",
     "certainty": "documented", "tier": "A", "source_id": None, "geo": "US"},
    {"milestone_id": "cm04", "track": "G", "category": "missing",
     "occurred_on": "2025-12",
     "title": "NCIC missing-person entries fall to 498,038 — lowest of the modern record",
     "description": "Down from 651,226 in 2017. Entries are records, not people; whether the fall is fewer cases or less entering cannot be separated.",
     "certainty": "documented", "tier": "A", "source_id": None, "geo": "US"},
    {"milestone_id": "cm05", "track": "G", "category": "homicide",
     "occurred_on": "2025-12",
     "title": "Murder rate 4.1 per 100,000 — tied for the lowest ever recorded",
     "description": "FBI final 2025 data (released 2026-08-14): violent crime down 9.3%, the largest year-to-year decline since estimation began in 1936.",
     "certainty": "documented", "tier": "A", "source_id": None, "geo": "US"},
    {"milestone_id": "cm06", "track": "G", "category": "enforcement",
     "occurred_on": "2026-07-29",
     "title": "World Cup sweep: 905 trafficking arrests announced",
     "description": "HSI-led operation; 180 victims rescued. An arrest count, not charges or convictions — no breakdown published. Roughly a third of a normal year's HSI trafficking arrests in a few weeks.",
     "certainty": "documented", "tier": "A", "source_id": "hs_dhs_worldcup", "geo": "US"},
    {"milestone_id": "cm07", "track": "G", "category": "missing",
     "occurred_on": "2026-08-18",
     "title": "FBI 'Voices Not Forgotten': $25,000 minimum rewards for MMIP cases",
     "description": "New FBI initiative on unsolved homicides, kidnappings and missing persons in Indian country, with a searchable case map. The federal government's own acknowledgement that these cases sit unsolved in numbers worth a program.",
     "certainty": "documented", "tier": "A", "source_id": "hs_fbi_vnf", "geo": "US"},
    {"milestone_id": "cm08", "track": "G", "category": "missing",
     "occurred_on": "2017-12",
     "title": "NCIC missing-person entries peak: 651,226",
     "description": "The modern high of the entry series. Every later year declines; by 2025 entries are 24% lower.",
     "certainty": "documented", "tier": "A", "source_id": None, "geo": "US"},
    {"milestone_id": "cm09", "track": "G", "category": "accountability",
     "occurred_on": "2022-12",
     "title": "Homicide clearance falls to 52.3% — the lowest ever reported",
     "description": "Down from 93% in 1962. Nearly half of US homicides that year were not closed by arrest or exceptional means.",
     "certainty": "corroborated", "tier": "B", "source_id": None, "geo": "US"},
    {"milestone_id": "cm10", "track": "G", "category": "measurement",
     "occurred_on": "2022-06",
     "title": "First national intimidation estimate: ~800,000 offences",
     "description": "BJS's NIBRS National Estimates begin — the first coverage-adjusted national count of the offence that contains stalking. No comparable figure exists for any earlier year.",
     "certainty": "documented", "tier": "A", "source_id": None, "geo": "US"},
    {"milestone_id": "cm11", "track": "G", "category": "accountability",
     "occurred_on": "2024-12",
     "title": "Homicide clearance recovers to 61.4%",
     "description": "Back to the 2019 level after the 2020-2022 trough. Roughly four in ten homicides still go uncleared.",
     "certainty": "corroborated", "tier": "B", "source_id": None, "geo": "US"},
    {"milestone_id": "cm12", "track": "G", "category": "enforcement",
     "occurred_on": "2026-01",
     "title": "ICE detention hits a record 73,400 held in a single day",
     "description": "Above the 2019 peak. Vera counts 456 facilities in active use against 220 ICE publicly acknowledges; ~444,900 bookings since January 2025.",
     "certainty": "corroborated", "tier": "B", "source_id": "hs_vera_2026", "geo": "US"},
    {"milestone_id": "cm13", "track": "G", "category": "enforcement",
     "occurred_on": "2025-08",
     "title": "HSI FY2024: 2,545 trafficking arrests from 1,686 investigations",
     "description": "The annual baseline against which the 905-arrest World Cup sweep reads as a third of a year's volume in weeks.",
     "certainty": "documented", "tier": "A", "source_id": "hs_dhs_ccht_fy24", "geo": "US"},
    {"milestone_id": "cm14", "track": "G", "category": "transnational",
     "occurred_on": "2026-04",
     "title": "Freedom House: 1,375 physical transnational-repression incidents since 2014",
     "description": "126 new cases in 2025 by 30 governments; 54 governments implicated since 2014. The only systematic count of TR — private, physical incidents only, self-described as a fraction of the whole.",
     "certainty": "corroborated", "tier": "B", "source_id": "tr_fh_2025", "geo": "Global/US"},
    # Burglary / home invasion (Sean, 2026-08-21). All three are measurement
    # events: the thing that changed is what was counted, not what happened.
    {"milestone_id": "cm15", "track": "G", "category": "measurement",
     "occurred_on": "2017-01",
     "title": "NCVS redesign renames and redefines household burglary",
     "description": "'Household burglary' becomes 'burglary/trespassing'. BJS's own tables note the change; the two sides of 2017 are not one series, so the 1999-2024 fall spans a redefinition.",
     "certainty": "documented", "tier": "A", "source_id": "bg_bjs_cv24", "geo": "US"},
    {"milestone_id": "cm16", "track": "G", "category": "measurement",
     "occurred_on": "2019-12",
     "title": "The Summary Reporting System publishes its last national burglary rate",
     "description": "340.5 per 100,000, down 53% from 2000. From 2020 the national figure is a NIBRS-based estimate on a different basis — not a continuation. The harm chart breaks the burglary lane here rather than drawing through it.",
     "certainty": "documented", "tier": "A", "source_id": "bg_fbi_srs2019", "geo": "US"},
    {"milestone_id": "cm17", "track": "G", "category": "measurement",
     "occurred_on": "2026-08",
     "title": "UNODC withdraws burglary as a retrievable indicator",
     "description": "Checked 2026-08-21: the property-crime dashboards redirect to a portal with no such theme and the legacy CTS burglary spreadsheet 404s. The only surviving route to the same collection is Eurostat, which covers Europe only. The second live citation on this site to vanish from its own publisher's portal.",
     "certainty": "documented", "tier": "A", "source_id": "bg_unodc_gone", "geo": "Global"},
]

EXTRA_SOURCES = [
    {"source_id": "hs_fbi_vnf",
     "url": "https://www.fbi.gov/news/press-releases/fbi-announces-voices-not-forgotten",
     "publisher": "FBI",
     "title": "FBI Announces Voices Not Forgotten (2026-08-18)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
]

# The verdict, reframed to Sean's question (2026-08-21).
VERDICT = {
    "claim": "Has crime increased during the period this record covers — and is there a relationship?",
    "summary": (
        "Split the question in two, because the record can answer one half and not the "
        "other. Has crime increased over the 1999-2025 window this site documents? By "
        "category, and honestly: overdose deaths quadrupled — the largest rise of any "
        "lane, peaking in 2022 and falling since. Homicide spiked 29.4% in 2020, the "
        "largest single-year rise ever recorded, then reversed to the lowest rate ever "
        "recorded by 2025. Defamation-adjacent federal filings are at their highest in "
        "the 22-year series, rising sharply since 2023. Missing-person entries fell to "
        "their lowest modern level — though what fell, cases or the entering of them, "
        "cannot be separated. And the survey measure of violent victimisation sits "
        "higher in 2024 than 2021 while police-recorded crime fell — the two official "
        "measures disagree in direction right now. Harassment, the category this site "
        "is most concerned with, cannot be answered at all: nobody counts it. "
        "As for a relationship with the events on the master timeline — procurement, "
        "legislation, deployments — this record cannot establish one. The lanes and "
        "the timeline can be read against each other, and the timeline's crime track "
        "exists for exactly that reading; but two things happening in the same years "
        "is a co-occurrence, and this dataset does not corroborate the Government "
        "Cloud record, nor the reverse. Where the counting itself changed mid-window "
        "— NIBRS in 2021 — even the crime series does not agree with itself."
    ),
    "key_figures": [
        {"figure": "Overdose deaths: 16,849 (1999) to a 107,941 peak (2022) — the steepest rise of any lane", "tier": "A", "source_id": None},
        {"figure": "Murder +29.4% in 2020, then a record reversal to 4.1 per 100,000 by 2025", "tier": "A", "source_id": None},
        {"figure": "Federal assault/libel/slander filings at a 22-year high: 848 in 2025, up 47% since 2022", "tier": "A", "source_id": None},
        {"figure": "NCIC missing-person entries at the modern low: 498,038 (2025), down from 651,226 (2017)", "tier": "A", "source_id": None},
        {"figure": "NCVS violent victimisation 23.3 per 1,000 (2024) vs 16.5 (2021) — the survey and police measures disagree", "tier": "A", "source_id": "cs_ncvs_cv24"},
        {"figure": "Harassment: no national count exists to answer the question with", "tier": "A", "source_id": "hs_nibrs_manual"},
        {"figure": "Intimidation (incl. stalking) estimates exist only from 2022 — the record starts where the question needs it oldest", "tier": "A", "source_id": None},
    ],
}


def main():
    (OUT / "crime_milestones.json").write_text(json.dumps(MILESTONES, indent=2) + "\n")

    sources = json.loads((OUT / "crime_sources.json").read_text())
    have = {s["source_id"] for s in sources}
    for e in EXTRA_SOURCES:
        if e["source_id"] not in have:
            sources.append(e)
    (OUT / "crime_sources.json").write_text(json.dumps(sources, indent=2) + "\n")

    (OUT / "crime_verdict.json").write_text(json.dumps(VERDICT, indent=2) + "\n")

    print(f"milestones: {len(MILESTONES)} | sources: {len(sources)} | verdict reframed")


if __name__ == "__main__":
    main()

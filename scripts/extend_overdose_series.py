#!/usr/bin/env python3
"""
Extend the US drug-overdose series back to 1999.

Why: the chart previously ran 2022-2025 — it opened at the peak and showed only
the fall. Sean asked whether overdoses rose OR fell; a chart that starts at the
maximum can only answer half of that, and it reads as "overdoses are going down"
to anyone who doesn't already know what came before. The rise from 16,849 (1999)
to 107,941 (2022) is the larger half of the record and the thing the reversal is
a reversal OF.

Two bases are deliberately kept apart:
  * 1999-2024 are FINAL counts from the National Vital Statistics System.
  * 2025 is PROVISIONAL and is flagged as such (hollow point in the chart).

The provisional/final distinction matters more than usual here. CDC's May 2026
release compares provisional-2025 (69,973) against a provisional-2024 estimate
of 81,313 and reports "almost 14%". The FINAL 2024 count is 79,384. Comparing
the provisional 2025 figure against the final 2024 figure gives ~11.9%, and
neither number is wrong — they are different vintages of the same year. The
data-quality register now carries this so the page can't be read as endorsing
one arithmetic over the other.

Idempotent: rebuilds the overdose rows from the table below every run.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TABLES = ROOT / "public/data/health/tables"

# year: (deaths, age-adjusted rate per 100,000, source_id)
# 1999-2020  NCHS Data Brief 428 tables       (hs103)
# 2021-2023  NCHS Data Brief 522              (hs104)
# 2024       NCHS Data Brief 549, final       (hs055)
# 2025       NCHS provisional, May 2026       (hs057)
SERIES = {
    1999: (16849, 6.1, "hs103"),
    2000: (17415, 6.2, "hs103"),
    2001: (19394, 6.8, "hs103"),
    2002: (23518, 8.2, "hs103"),
    2003: (25785, 8.9, "hs103"),
    2004: (27424, 9.4, "hs103"),
    2005: (29813, 10.1, "hs103"),
    2006: (34425, 11.5, "hs103"),
    2007: (36010, 11.9, "hs103"),
    2008: (36450, 11.9, "hs103"),
    2009: (37004, 11.9, "hs103"),
    2010: (38329, 12.3, "hs103"),
    2011: (41340, 13.2, "hs103"),
    2012: (41502, 13.1, "hs103"),
    2013: (43982, 13.8, "hs103"),
    2014: (47055, 14.7, "hs103"),
    2015: (52404, 16.3, "hs103"),
    2016: (63632, 19.8, "hs103"),
    2017: (70237, 21.7, "hs103"),
    2018: (67367, 20.7, "hs103"),
    2019: (70630, 21.6, "hs103"),
    2020: (91799, 28.3, "hs103"),
    2021: (106699, 32.4, "hs104"),
    2022: (107941, 32.6, "hs104"),
    2023: (105007, 31.3, "hs104"),
    2024: (79384, 23.1, "hs055"),
}
PROVISIONAL_2025 = (69973, None, "hs057")

NOTES = {
    1999: "Series start. The lowest annual count in the modern record.",
    2010: "Prescription-opioid era; the synthetic-opioid rise has not yet begun.",
    2013: "Conventionally dated start of the synthetic-opioid (fentanyl) wave.",
    2016: "First year of the steep synthetic-opioid acceleration: +21.5% on 2015.",
    2019: "Pre-pandemic baseline.",
    2020: "+30.0% on 2019, the largest single-year rise in the series.",
    2022: "Peak year of the series. Age-adjusted rate 32.6 per 100,000.",
    2023: "First annual decline since 2018.",
    2024: "Final. -26.2% on 2023 — the largest percentage drop across 2014-2024.",
}

NEW_SOURCES = [
    {
        "source_id": "hs103",
        "url": "https://www.cdc.gov/nchs/data/databriefs/db428-tables.pdf",
        "publisher": "CDC/NCHS",
        "title": "Data tables for NCHS Data Brief 428: Drug Overdose Deaths in the United States, 1999-2020",
        "evidence_tier": "A",
        "accessed": "2026-08-20",
        "archived_url": None,
    },
    {
        "source_id": "hs104",
        "url": "https://www.cdc.gov/nchs/products/databriefs/db522.htm",
        "publisher": "CDC/NCHS",
        "title": "NCHS Data Brief 522: Drug Overdose Deaths in the United States, 2003-2023",
        "evidence_tier": "A",
        "accessed": "2026-08-20",
        "archived_url": None,
    },
]

DQ_ROW = {
    "dq_id": "hq015",
    "geography": "US",
    "topic": "Drug overdose deaths — provisional against final",
    "issue": (
        "The 2025 figure is provisional and the 2024 figure on this chart is final. "
        "They are different vintages, and the choice of vintage changes the headline. "
        "CDC's May 2026 release reports a fall of almost 14% for 2025 by comparing it "
        "with a provisional 2024 estimate of 81,313. Measured against the final 2024 "
        "count of 79,384, the same provisional 2025 figure is a fall of about 11.9%. "
        "Provisional counts rise as late certificates are processed, so the 2025 number "
        "should be expected to revise upward."
    ),
    "effect": "A reported percentage change spanning the provisional/final boundary can move several points without any underlying change in deaths.",
    "tier": "A",
    "source_id": "hs057",
}


TREND_ROW = {
    "topic": "drug_overdose",
    "statement": (
        "US overdose deaths rose from 16,849 in 1999 (rate 6.1) to 107,941 in 2022 "
        "(rate 32.6) — a 541% increase in the count over twenty-three years, with the "
        "steepest acceleration after 2013 and the largest single-year rise in 2020 "
        "(+30.0%). The post-2022 decline runs down from that peak, not from the "
        "pre-2000 baseline: provisional 2025 (69,973) is still about four times the "
        "1999 count."
    ),
    "tier": "A",
    "source_id": "hs103",
}


# The timeline's Health track carried four overdose milestones, three of which
# were about the decline (Feb 2025, Jan 2026, May 2026) and one about the third
# wave beginning. That is the chart's old fault in a second place: the record
# reads as a fall with a single note that something started in 2013. These give
# the rise the same dated treatment the fall already had.
RISE_MILESTONES = [
    {
        "milestone_id": "hm026",
        "track": "F",
        "category": "overdose",
        "occurred_on": "1999-01",
        "title": "Overdose record begins: 16,849 deaths",
        "description": (
            "The first year of the modern comparable series. Age-adjusted rate 6.1 per "
            "100,000. Every later figure on this track is measured against this."
        ),
        "certainty": "documented",
        "tier": "A",
        "source_id": "hs103",
        "geo": "US",
    },
    {
        "milestone_id": "hm027",
        "track": "F",
        "category": "overdose",
        "occurred_on": "2010-01",
        "title": "Second wave of opioid epidemic begins (heroin)",
        "description": (
            "CDC dates the second wave to 2010. Overdose deaths that year: 38,329 — "
            "already more than double 1999, before fentanyl enters the record."
        ),
        "certainty": "documented",
        "tier": "A",
        "source_id": "hs096",
        "geo": "US",
    },
    {
        "milestone_id": "hm028",
        "track": "F",
        "category": "overdose",
        "occurred_on": "2016-01",
        "title": "Synthetic-opioid acceleration: 63,632 deaths (+21.4%)",
        "description": (
            "The steepest year of the fentanyl wave to that point, three years after it "
            "began. Age-adjusted rate 19.8 per 100,000, more than triple 1999."
        ),
        "certainty": "documented",
        "tier": "A",
        "source_id": "hs103",
        "geo": "US",
    },
    {
        "milestone_id": "hm029",
        "track": "F",
        "category": "overdose",
        "occurred_on": "2020-01",
        "title": "Largest single-year rise on record: 91,799 deaths (+30.0%)",
        "description": (
            "The pandemic year. A rise of 21,169 deaths on 2019 — the largest one-year "
            "increase in the series, and the mirror of the 2024 decline."
        ),
        "certainty": "documented",
        "tier": "A",
        "source_id": "hs103",
        "geo": "US",
    },
    {
        "milestone_id": "hm030",
        "track": "F",
        "category": "overdose",
        "occurred_on": "2022-01",
        "title": "Overdose deaths peak: 107,941",
        "description": (
            "The maximum of the series and the point every subsequent decline is measured "
            "down from. Age-adjusted rate 32.6 per 100,000 — 6.4 times the 1999 count."
        ),
        "certainty": "documented",
        "tier": "A",
        "source_id": "hs104",
        "geo": "US",
    },
]


def load(name):
    return json.loads((TABLES / name).read_text())


def save(name, data):
    (TABLES / name).write_text(json.dumps(data, indent=2) + "\n")


def main():
    # ---- indicators -------------------------------------------------------
    rows = load("health_indicators.json")
    kept = [
        r for r in rows
        if not (r.get("indicator_id") in ("drug_overdose_deaths", "drug_overdose_deaths_provisional")
                and r.get("geography") == "US")
    ]
    dropped = len(rows) - len(kept)

    new = []
    for year, (deaths, rate, src) in sorted(SERIES.items()):
        note = NOTES.get(year, "")
        if rate is not None:
            rate_txt = f"Age-adjusted rate {rate} per 100,000."
            note = f"{note} {rate_txt}".strip() if note else rate_txt
        new.append({
            "indicator_id": "drug_overdose_deaths",
            "geography": "US",
            "year": year,
            "value": deaths,
            "unit": "drug overdose deaths (final)",
            "tier": "A",
            "publisher": "CDC/NCHS",
            "source_id": src,
            "workstream": "W2",
            "note": note,
            "provisional": False,
            "rate_per_100k": rate,
        })

    deaths, _, src = PROVISIONAL_2025
    new.append({
        "indicator_id": "drug_overdose_deaths_provisional",
        "geography": "US",
        "year": 2025,
        "value": deaths,
        "unit": "drug overdose deaths (provisional)",
        "tier": "A",
        "publisher": "CDC/NCHS",
        "source_id": src,
        "workstream": "W2",
        "note": (
            "Provisional; incomplete and subject to upward revision. Third consecutive "
            "annual decline. See the data-quality register on comparing this with 2024."
        ),
        "provisional": True,
        "rate_per_100k": None,
    })

    save("health_indicators.json", kept + new)
    print(f"indicators: dropped {dropped} overdose rows, wrote {len(new)}")

    # ---- sources ----------------------------------------------------------
    srcs = load("health_sources.json")
    have = {s["source_id"] for s in srcs}
    added = [s for s in NEW_SOURCES if s["source_id"] not in have]
    srcs.extend(added)
    save("health_sources.json", srcs)
    print(f"sources: added {len(added)} (total {len(srcs)})")

    # ---- data quality -----------------------------------------------------
    dq = load("health_data_quality.json")
    dq = [d for d in dq if d.get("dq_id") != DQ_ROW["dq_id"]]
    dq.append(DQ_ROW)
    save("health_data_quality.json", dq)
    print(f"data quality: {len(dq)} rows")

    # ---- trends -----------------------------------------------------------
    # The existing drug_overdose trend covers the peak and the decline. Without
    # a companion row for the rise, the register repeats the chart's old fault
    # of describing only the second half.
    tr = load("health_trends.json")
    tr = [t for t in tr if not (t.get("topic") == "drug_overdose"
                                and t.get("statement", "").startswith("US overdose deaths rose"))]
    tr.append(TREND_ROW)
    save("health_trends.json", tr)
    print(f"trends: {len(tr)} rows")

    # ---- milestones -------------------------------------------------------
    ms = load("health_milestones.json")
    new_ids = {m["milestone_id"] for m in RISE_MILESTONES}
    ms = [m for m in ms if m.get("milestone_id") not in new_ids]
    ms.extend(RISE_MILESTONES)
    ms.sort(key=lambda m: (m.get("occurred_on") or "", m.get("milestone_id") or ""))
    save("health_milestones.json", ms)
    od = sum(1 for m in ms if m.get("category") == "overdose")
    print(f"milestones: {len(ms)} rows ({od} overdose)")


if __name__ == "__main__":
    main()

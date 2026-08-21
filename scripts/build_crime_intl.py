#!/usr/bin/env python3
"""
International comparison data for the Crime section (Sean, 2026-08-21).

Three workstreams, three different honest presentations:

  homicide       ONE chart. All roster countries share a single intergovernmental
                 basis (UNODC intentional homicide, World Bank mirror). Gaps are
                 drawn as gaps.
  drug deaths    NO chart. Five incompatible definition bases (vital statistics,
                 police counts, opioid-only, forensic registers, verified absence).
                 A per-country fact panel with the definition on every row.
  missing        NO chart, and that is the finding. Units are irreducibly
                 different (records vs individuals vs incidents); the only
                 international instrument counts notices. Fact panel + a new
                 "What nobody counts" entry.

All figures fetched 2026-08-21; see source_url per row. Idempotent.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TABLES = ROOT / "public/data/crime/tables"
CHARTS = ROOT / "public/data/crime/charts"
INTL = pathlib.Path("/tmp/intl")

COUNTRY = {
    "USA": ("United States", True), "KOR": ("South Korea", False),
    "JPN": ("Japan", False), "GBR": ("UK", False), "AUS": ("Australia", False),
    "DEU": ("Germany", False), "FRA": ("France", False), "CAN": ("Canada", False),
    "RUS": ("Russia", False), "CHN": ("China", False), "IND": ("India", False),
    "ISR": ("Israel", False), "WLD": ("World", False),
}

CAVEATS = {
    "RUS": ["Self-reported police figures; series ends 2021, before the invasion of Ukraine.",
            "Scholars argue violent deaths coded 'undetermined intent' sit outside this series, and that the post-2005 decline is partly coding practice. Recorded here as scholarly debate, not fact."],
    "CHN": ["Ministry of Public Security recorded crime; independent verification is not possible.",
            "Series starts 2002 and ends 2020 in the international mirror."],
    "FRA": ["2015 is elevated by terrorist-attack deaths counted as homicide."],
    "ISR": ["2001-2002 elevated by the Second Intifada; treatment of conflict deaths varies. Series ends 2022."],
    "GBR": ["Combines England & Wales (April-March counting year), Scotland and Northern Ireland; 2003-04 and 2022-23 are gaps in the mirror."],
    "IND": ["Based on NCRB police-recorded murder, which counts cases rather than victims in some tables."],
    "DEU": ["The 2016 uptick is partly recording effects in German police statistics."],
    "USA": ["2003-2005 are gaps in the international mirror; the FBI series on the homicide chart above is the domestic reference."],
}

NC_ENTRY = {
    "nc_id": "nc07",
    "category": "Missing persons, internationally",
    "status": "No comparable basis exists — verified, not assumed",
    "detail": (
        "Countries count missing people in units that cannot be reconciled: the United "
        "States counts NCIC records entered (533,936 in 2024 — one person can generate "
        "several), Canada counts individuals by the year they were last seen (68,349), "
        "the UK counts incidents (roughly 262,000 in 2020/21, against ~128,000 "
        "individuals), and Australia publishes only 'about 50,000 reports' with no "
        "reference year. Converting any of these to per-capita rates would fake a "
        "comparability that does not exist. The only international instrument is "
        "Interpol's Yellow Notice — 3,345 issued in 2024 — which counts notices, not "
        "missing people, and Interpol publishes no cross-country statistics."
    ),
    "who_would_collect": (
        "No body does. UNODC and Interpol publish no cross-country missing-persons "
        "series; each national count sits with a different agency on a different unit."
    ),
    "tier": "A",
    "source_id": "intl_interpol",
}

SOURCES = [
    {"source_id": "intl_wb_homicide",
     "url": "https://api.worldbank.org/v2/country/USA;KOR;JPN;GBR;AUS;DEU;FRA;CAN;RUS;CHN;IND;ISR;WLD/indicator/VC.IHR.PSRC.P5?format=json&per_page=500&date=1999:2024",
     "publisher": "World Bank (data source: UNODC)",
     "title": "Intentional homicides per 100,000 — UNODC series, World Bank mirror (API extract)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_ons_drugs",
     "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/deaths/bulletins/deathsrelatedtodrugpoisoninginenglandandwales/2024registrations",
     "publisher": "ONS", "title": "Deaths related to drug poisoning in England and Wales: 2024 registrations",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_aihw",
     "url": "https://www.aihw.gov.au/reports/alcohol/alcohol-drugs-deaths",
     "publisher": "AIHW/ABS", "title": "Deaths involving alcohol and other drugs in Australia",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_euda",
     "url": "https://www.euda.europa.eu/publications/european-drug-report/2025/drug-induced-deaths_en",
     "publisher": "EUDA", "title": "European Drug Report 2025 — drug-induced deaths",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_phac",
     "url": "https://www.canada.ca/en/public-health/news/2024/12/joint-statement-from-the-co-chairs-of-the-special-advisory-committee-on-toxic-drug-poisonings--latest-national-data-on-substance-related-harms.html",
     "publisher": "Public Health Agency of Canada", "title": "Special Advisory Committee on Toxic Drug Poisonings — joint statement",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_dhs_bka",
     "url": "https://www.dhs.de/suechte/illegale-drogen/zahlen-daten-fakten/",
     "publisher": "DHS (citing BKA)", "title": "Rauschgifttote — police-registered drug deaths, Germany",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_drames",
     "url": "https://addictovigilance.fr/wp-content/uploads/2025/06/Plaquette-DRAMES-2023.pdf",
     "publisher": "ANSM / CEIP-Addictovigilance", "title": "DRAMES 2023 — deaths related to substance abuse (forensic register)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_kor_drugs",
     "url": "https://e-emj.org/journal/view.php?number=37",
     "publisher": "Ewha Medical Journal (Statistics Korea data)", "title": "Drug-induced death statistics in Korea, 2011-2021",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_unodc_wdr",
     "url": "https://idpc.net/blog/2025/06/evidence-that-cannot-be-contained-the-world-drug-report-2025-reveals-the-ongoing-failure-of-the",
     "publisher": "UNODC WDR 2025 (via IDPC)", "title": "Global drug-related deaths estimate (>450,000 in 2021)",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_ncic_2024",
     "url": "https://www.fbi.gov/file-repository/cjis/2024-ncic-missing-and-unidentified-person-statistics.pdf",
     "publisher": "FBI CJIS", "title": "2024 NCIC Missing Person and Unidentified Person Statistics",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_rcmp",
     "url": "https://canadasmissing.ca/pubs/2025/index-eng.htm",
     "publisher": "RCMP NCMPUR", "title": "Canada's Missing — Fast Fact Sheet",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_afp",
     "url": "https://www.afp.gov.au/news-centre/media-release/national-missing-persons-week-2025-forever-loved",
     "publisher": "AFP NMPCC", "title": "National Missing Persons Week 2025",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_nca_press",
     "url": "https://www.nationalworld.com/news/crime/how-many-missing-people-uk-police-data-explained-body-found-nicola-bulley-4033696",
     "publisher": "NCA UKMPU (via press)", "title": "UK missing incidents 2020/21 (~262,000) — primary NCA report unreadable this session",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_interpol",
     "url": "https://www.interpol.int/en/How-we-work/Notices/Yellow-Notices",
     "publisher": "INTERPOL", "title": "Yellow Notices — the only international missing-persons instrument",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_cdc_549",
     "url": "https://www.cdc.gov/nchs/products/databriefs/db549.htm",
     "publisher": "CDC NCHS", "title": "Drug Overdose Deaths in the United States, 2023-2024 (final)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "intl_phac_press",
     "url": "https://globalnews.ca/news/11345931/opioid-deaths-canada-2024/",
     "publisher": "PHAC via CCSA/press", "title": "Canada 2024 apparent opioid toxicity deaths (7,150) — primary Infobase unreadable this session",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
]

DRUG_SRC = {
    "United States": "intl_cdc_549", "England & Wales": "intl_ons_drugs",
    "Australia": "intl_aihw", "Germany": "intl_dhs_bka", "France": "intl_drames",
    "Canada": "intl_phac_press", "South Korea": "intl_kor_drugs",
    "EU-27": "intl_euda", "World": "intl_unodc_wdr", "Japan": None,
}
MISSING_SRC = {
    "United States": "intl_ncic_2024", "Canada": "intl_rcmp",
    "United Kingdom": "intl_nca_press", "Australia": "intl_afp",
    "International": "intl_interpol",
}


def main():
    wb = json.loads((INTL / "homicide_wb.json").read_text())
    drugs = json.loads((INTL / "drug_deaths.json").read_text())
    missing = json.loads((INTL / "missing_persons.json").read_text())

    series = []
    for code, (name, emphasis) in COUNTRY.items():
        pts = sorted(
            ({"year": int(y), "value": v, "tier": "A"} for y, v in wb["series"][code].items()),
            key=lambda p: p["year"],
        )
        first, last = pts[0], pts[-1]
        series.append({
            "name": name, "code": code, "emphasis": emphasis,
            "kind": "world" if code == "WLD" else "country",
            "basis_short": "UNODC intentional homicide, per 100,000 — one international basis",
            "publisher": wb["publisher"], "tier": "A",
            "counts": "intentional homicides per 100,000 people",
            "base_year": first["year"], "base_value": first["value"],
            "unit_raw": wb["unit"],
            "last": {"year": last["year"], "value": last["value"]},
            "points": pts,
            "caveats": CAVEATS.get(code, []) + [
                "2024 is not yet published for any country in this series.",
            ],
        })

    chart = {
        "title": "Homicide: the US against the world",
        "unit": "Intentional homicides per 100,000 people (UNODC basis)",
        "note": (
            "One basis for every line — the UNODC intentional-homicide series — so these "
            "ARE comparable, unlike the drug-death and missing-person figures below. The "
            "US sits several times above its Western peers and spiked in 2020 while the "
            "world line barely moved; Russia fell from 30 to under 7, and its series "
            "ends in 2021. Gaps in a line are years the source does not publish; they "
            "are drawn as gaps, never bridged."
        ),
        "publisher": wb["publisher"], "tier": "A", "indexed": False,
        "series": series,
    }
    (CHARTS / "homicide_international.json").write_text(json.dumps(chart, indent=2) + "\n")

    # ---- drug deaths: definition panel, deliberately not a chart ------------
    panel = {
        "title": "Drug deaths internationally: five ways of counting",
        "why_no_chart": (
            "These figures cannot share an axis. Germany's headline number is a police "
            "count, not vital statistics; Canada publishes opioid-only toxicity deaths; "
            "France's usable figure is a non-exhaustive forensic register; Japan "
            "publishes nothing comparable at all; and even between vital-statistics "
            "countries, the English definition is deliberately broader than the EU "
            "standard. A chart would assert a comparability that does not exist — the "
            "definition column is the point."
        ),
        "rows": [
            {**r, "source_id": DRUG_SRC.get(r["country"])} for r in drugs
        ],
    }
    (TABLES / "crime_intl_drug_deaths.json").write_text(json.dumps(panel, indent=2) + "\n")

    # ---- missing persons: fact panel + nobody-counts entry ------------------
    mp = {
        "title": "Missing persons internationally: no shared unit",
        "why_no_chart": (
            "Records, individuals, incidents and rounded press figures cannot be drawn "
            "on one axis, and no international body publishes a comparable series. Each "
            "country's own number is stated in its own unit below."
        ),
        "rows": [
            {**r, "source_id": MISSING_SRC.get(r["country"])} for r in missing
        ],
    }
    (TABLES / "crime_intl_missing.json").write_text(json.dumps(mp, indent=2) + "\n")

    # ---- nobody-counts entry + sources --------------------------------------
    nc = json.loads((TABLES / "crime_not_counted.json").read_text())
    nc = [e for e in nc if e.get("nc_id") != "nc07"] + [NC_ENTRY]
    (TABLES / "crime_not_counted.json").write_text(json.dumps(nc, indent=2) + "\n")

    sources = json.loads((TABLES / "crime_sources.json").read_text())
    have = {s["source_id"] for s in sources}
    added = [s for s in SOURCES if s["source_id"] not in have]
    sources.extend(added)
    (TABLES / "crime_sources.json").write_text(json.dumps(sources, indent=2) + "\n")

    print(f"homicide chart: {len(series)} series")
    print(f"drug panel: {len(panel['rows'])} rows | missing panel: {len(mp['rows'])} rows")
    print(f"not-counted: {len(nc)} | sources +{len(added)} (total {len(sources)})")


if __name__ == "__main__":
    main()

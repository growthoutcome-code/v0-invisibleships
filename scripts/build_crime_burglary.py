#!/usr/bin/env python3
"""
Break-ins: the US record, the international record, and the offence nobody counts.

Sean asked two questions (2026-08-21):

  1. "have home invasions increased in the US and abroad?"
  2. "Are home invasions documented or are they labeled as a burglary?"

The second question turns out to answer the first. "Home invasion" is not an
offence category in the United States, Canada, or Australia nationally — so no
national series can rise or fall, because none exists. What DOES exist is
burglary, and burglary has fallen almost everywhere it is measured, on every
basis, for twenty years.

This script writes:
  * the international residential-burglary chart (Eurostat/UNODC ICCS05012,
    five countries on one code, 2008-2024)
  * the indicator rows behind the US burglary lane on the harm chart
    (build_crime_lanes.py assembles the lane itself from these rows)
  * nc08, "Home invasion, as an offence" — the register entry
  * four data-quality rows, including UNODC's removal of burglary as a
    retrievable indicator

MERGE, never clobber. crime_not_counted.json, crime_data_quality.json and
crime_trends.json are all written by more than one builder; entries are
replaced by id and everything else is kept. build_crime_lanes.py learned this
the hard way when it silently deleted sw02 and nc07.

Idempotent: re-running replaces its own rows and leaves the rest alone.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_T = ROOT / "public/data/crime/tables"
CRIME_C = ROOT / "public/data/crime/charts"

ACCESSED = "2026-08-21"

# --------------------------------------------------------------- sources ---
SOURCES = [
    {"source_id": "bg_eurostat_iccs", "publisher": "Eurostat (joint Eurostat–UNODC data collection)",
     "title": "crim_off_cat — police-recorded offences, ICCS05012 'Burglary of private residential premises', per 100 000 inhabitants",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/crim_off_cat/default/table?lang=en",
     "evidence_tier": "A"},
    {"source_id": "bg_eurostat_news", "publisher": "Eurostat",
     "title": "Burglary in the EU (Eurostat news release, 2026-08-03)",
     "url": "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260803-1",
     "evidence_tier": "A"},
    {"source_id": "bg_unodc_gone", "publisher": "UNODC",
     "title": "UNODC data portal — burglary is no longer offered as a retrievable indicator (checked 2026-08-21)",
     "url": "https://dataunodc.un.org/",
     "evidence_tier": "A"},
    {"source_id": "bg_fbi_srs2019", "publisher": "FBI Uniform Crime Reporting Program",
     "title": "Crime in the United States 2019, Table 1 (Summary Reporting System — final year of the SRS basis)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2019/crime-in-the-u.s.-2019/topic-pages/tables/table-1",
     "evidence_tier": "A"},
    {"source_id": "bg_fbi_cde24", "publisher": "FBI Crime Data Explorer",
     "title": "UCR Summary of Reported Crimes in the Nation, 2024 (NIBRS-based national estimates)",
     "url": "https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_fbi_quick24", "publisher": "FBI Crime Data Explorer",
     "title": "Reported Crimes in the Nation — Quick Stats (clearance rates, 2024)",
     "url": "https://cde.ucr.cjis.gov/LATEST/resources/reports/Reported%20Crimes%20in%20the%20Nation%20Quick%20Stats.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_bjs_cv24", "publisher": "Bureau of Justice Statistics",
     "title": "Criminal Victimization, 2024 (NCVS) — Tables 2 and 4",
     "url": "https://bjs.ojp.gov/document/cv24.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_bjs_cv10", "publisher": "Bureau of Justice Statistics",
     "title": "Criminal Victimization, 2010 (NCVS) — Tables 7 and 10",
     "url": "https://bjs.ojp.gov/content/pub/pdf/cv10.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_bjs_cv99", "publisher": "Bureau of Justice Statistics",
     "title": "Criminal Victimization 1999 (NCVS) — pre-2017 'household burglary' basis",
     "url": "https://bjs.ojp.gov/content/pub/pdf/cv99.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_statcan_be02", "publisher": "Statistics Canada",
     "title": "Juristat 85-002-X Vol. 24 No. 5 (July 2004), 'Breaking and entering in Canada' — "
              "\u201Cbecause there is no agreed-upon definition, \u2018home invasion\u2019 is difficult to "
              "measure and is not captured directly by the Uniform Crime Reporting (UCR) Survey\u201D",
     "url": "https://www150.statcan.gc.ca/n1/pub/85-002-x/85-002-x2004005-eng.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_statcan_2025", "publisher": "Statistics Canada",
     "title": "Police-reported crime statistics, 2025 (The Daily) — breaking and entering",
     "url": "https://www150.statcan.gc.ca/n1/daily-quotidien/260722/dq260722a-eng.htm",
     "evidence_tier": "A"},
    {"source_id": "bg_csa_vic", "publisher": "Crime Statistics Agency Victoria",
     "title": "Spotlight: burglary / break and enter offences recorded in Victoria",
     "url": "https://www.crimestatistics.vic.gov.au/spotlight-burglarybreak-and-enter-offences-recorded-in-victoria",
     "evidence_tier": "A"},
    {"source_id": "bg_abs_cvs", "publisher": "Australian Bureau of Statistics",
     "title": "Crime Victimisation, Australia, 2024-25 — household break-in prevalence",
     "url": "https://www.abs.gov.au/statistics/people/crime-and-justice/crime-victimisation/latest-release",
     "evidence_tier": "A"},
    {"source_id": "bg_abs_rcv", "publisher": "Australian Bureau of Statistics",
     "title": "Recorded Crime — Victims, 2024 (Unlawful Entry With Intent; no national rate published)",
     "url": "https://www.abs.gov.au/statistics/people/crime-and-justice/recorded-crime-victims/latest-release",
     "evidence_tier": "A"},
    {"source_id": "bg_ons_burglary", "publisher": "Office for National Statistics",
     "title": "Overview of burglary and other household theft, England and Wales (CSEW)",
     "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/articles/overviewofburglaryandotherhouseholdtheft/englandandwales",
     "evidence_tier": "A"},
    {"source_id": "bg_ons_cew25", "publisher": "Office for National Statistics",
     "title": "Crime in England and Wales, year ending December 2025",
     "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/bulletins/crimeinenglandandwales/yearendingdecember2025",
     "evidence_tier": "A"},
    {"source_id": "bg_anzsoc", "publisher": "Australian Bureau of Statistics",
     "title": "ANZSOC 2023, group 061 — 'home invasion' appears only as an INCLUSION TERM under "
              "0611 Aggravated burglary of a dwelling and 0612 Non-aggravated burglary of a dwelling",
     "url": "https://www.abs.gov.au/statistics/classifications/australian-and-new-zealand-standard-offence-classification-anzsoc/2023/06/061",
     "evidence_tier": "A"},
    {"source_id": "bg_micr_manual", "publisher": "Michigan State Police",
     "title": "Michigan Incident Crime Reporting (MICR) Manual — burglary codes 22001/22002/22003; no home-invasion code",
     "url": "https://www.michigan.gov/msp/-/media/Project/Websites/msp/micr-assets/MICR-Manual_1130.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_micr_2022", "publisher": "Michigan State Police",
     "title": "Crime in Michigan 2022 (MICR annual report) — burglary reported under 22001/22002/22003",
     "url": "https://www.michigan.gov/msp/-/media/Project/Websites/msp/micr-assets/2022/MICR-Annual-Report-2022.pdf",
     "evidence_tier": "A"},
    {"source_id": "bg_ons_athome", "publisher": "Office for National Statistics",
     "title": "Overview of burglary and other household theft (20 July 2017) — someone was at home in over "
              "half of domestic burglaries where the offender gained entry",
     "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/articles/overviewofburglaryandotherhouseholdtheft/englandandwales",
     "evidence_tier": "A"},
    {"source_id": "bg_csa_vic_stale", "publisher": "Crime Statistics Agency Victoria",
     "title": "Recorded offences, year ending March 2026 — burglary/break and enter published; no home-invasion "
              "or aggravated-burglary count in the release text",
     "url": "https://www.crimestatistics.vic.gov.au/media-centre/media-releases/media-release-adult-offending-increases-as-youth-offending-decreases",
     "evidence_tier": "A"},
    {"source_id": "bg_npa_jp", "publisher": "National Police Agency (Japan)",
     "title": "令和6年の犯罪情勢 (Crime Situation in 2024) — 侵入犯罪 intrusion crime",
     "url": "https://www.npa.go.jp/publications/statistics/kikakubunseki/r6_jyosei.pdf",
     "evidence_tier": "A"},
]

# ---------------------------------------------------- indicators (US) ------
# FBI Summary Reporting System, burglary rate per 100,000. Final year 2019 —
# the SRS was retired and the national series moves onto a NIBRS-based
# estimate that is NOT a continuation of it.
FBI_SRS = {
    2000: 728.8, 2001: 741.8, 2002: 747.0, 2003: 741.0, 2004: 730.3,
    2005: 726.9, 2006: 733.1, 2007: 726.1, 2008: 733.0, 2009: 717.7,
    2010: 701.0, 2011: 701.3, 2012: 672.2, 2013: 610.5, 2014: 537.2,
    2015: 494.7, 2016: 468.9, 2017: 429.7, 2018: 378.0, 2019: 340.5,
}
FBI_CDE = {2020: 309.2, 2021: 264.2, 2022: 273.1, 2023: 253.3, 2024: 229.2}

# NCVS. The category was renamed AND redefined in the 2017 instrument
# redesign: "household burglary" became "burglary/trespassing". BJS's own
# tables carry the note; the two sides of 2017 are not a single series.
NCVS_OLD = {1999: 34.1, 2010: 23.8}
NCVS_NEW = {2020: 13.6, 2021: 13.9, 2022: 14.6, 2023: 13.1, 2024: 12.0}
NCVS_REPORTED = {2010: 58.8, 2023: 42.7, 2024: 40.7}

US_ROWS = []


def us(ind, year, value, unit, sid, note="", tier="A", publisher="FBI"):
    US_ROWS.append({
        "indicator_id": ind, "geography": "US", "year": year, "value": value,
        "unit": unit, "tier": tier, "publisher": publisher, "source_id": sid,
        "workstream": "W2", "note": note,
    })


for y, v in FBI_SRS.items():
    us("fbi_ucr_srs_burglary_p100k", y, v, "burglaries per 100,000 inhabitants",
       "bg_fbi_srs2019",
       "Summary Reporting System basis. 2019 is the final year; the SRS was retired."
       if y == 2019 else ("Series peak in this run; 2,151,252 offences." if y == 2002 else ""),
       publisher="FBI UCR (Summary Reporting System)")
for y, v in FBI_CDE.items():
    us("fbi_cde_burglary_p100k_est", y, v, "burglaries per 100,000 inhabitants (estimated)",
       "bg_fbi_cde24",
       "NIBRS-based national estimate — a DIFFERENT basis from the pre-2020 SRS run. "
       "2024 NIBRS covered 75.5% of agencies and 87.2% of the population."
       if y == 2020 else ("−8.6% against 2023." if y == 2024 else ""),
       publisher="FBI Crime Data Explorer")
for y, v in NCVS_OLD.items():
    us("ncvs_household_burglary_rate", y, v, "victimizations per 1,000 households",
       "bg_bjs_cv99" if y == 1999 else "bg_bjs_cv10",
       "Pre-2017 'household burglary' definition — not comparable with the post-2017 category.",
       publisher="BJS, National Crime Victimization Survey")
for y, v in NCVS_NEW.items():
    us("ncvs_burglary_trespass_p1000hh", y, v, "victimizations per 1,000 households",
       "bg_bjs_cv24",
       "Post-2017 'burglary/trespassing' category; BJS notes it was 'called household "
       "burglary in prior reports'." if y == 2020 else "",
       publisher="BJS, National Crime Victimization Survey")
for y, v in NCVS_REPORTED.items():
    us("ncvs_burglary_reported_to_police_pct", y, v, "percent of victimizations reported to police",
       "bg_bjs_cv10" if y == 2010 else "bg_bjs_cv24",
       "18.1 percentage points below 2010 — the single most important caveat on any "
       "police-recorded burglary trend." if y == 2024 else "",
       publisher="BJS, National Crime Victimization Survey")
us("fbi_burglary_clearance_rate", 2024, 15.2, "percent of burglaries cleared",
   "bg_fbi_quick24", "Roughly one burglary in seven ends in an arrest or exceptional clearance.")
us("fbi_residential_burglary_count", 2024, 405776, "estimated residential burglaries",
   "bg_fbi_cde24", "Residential share of the national burglary estimate.")

# ------------------------------------------------ indicators (abroad) ------
INTL_ROWS = [
    ("England & Wales", "csew_domestic_burglary_incidents", 1993, 2445000,
     "estimated incidents (Crime Survey for England and Wales)", "bg_ons_burglary",
     "CSEW series peak.", "Office for National Statistics"),
    ("England & Wales", "csew_domestic_burglary_incidents", 2017, 650000,
     "estimated incidents (Crime Survey for England and Wales)", "bg_ons_burglary",
     "Record low at time of publication.", "Office for National Statistics"),
    ("England & Wales", "csew_domestic_burglary_incidents", 2025, 327000,
     "estimated incidents (Crime Survey for England and Wales)", "bg_ons_cew25",
     "−22% against the year ending December 2024; 87% below the 1993 peak.",
     "Office for National Statistics"),
    ("Canada", "statcan_breaking_entering_p100k", 2025, 264,
     "breaking-and-entering incidents per 100,000 population", "bg_statcan_2025",
     "109,753 incidents. Published as 41% below 2015 and 77% below 1998. "
     "All B&E — residential, business and other combined.", "Statistics Canada"),
    ("Canada", "statcan_residential_robbery_p100k", 2002, 5,
     "robberies in private residences per 100,000 population", "bg_statcan_be02",
     "865 offences. StatCan's own stated PROXY for 'home invasion', which it says "
     "cannot be measured directly.", "Statistics Canada"),
    ("Australia", "abs_cvs_breakin_pct_hh", 2025, 1.8,
     "percent of households experiencing a break-in (financial year 2024-25)", "bg_abs_cvs",
     "196,600 households; 76% of them experienced a single incident. "
     "Down from 2.7% in 2014-15.", "Australian Bureau of Statistics"),
    ("Australia (Victoria)", "vic_home_invasion_offences", 2018, 105,
     "home-invasion offences coded to burglary", "bg_csa_vic",
     "A further 87 home-invasion offences were coded to 'A21 Serious assault' and are "
     "excluded from burglary counts — so Victoria's own count is split across two "
     "offence families.", "Crime Statistics Agency Victoria"),
    ("Japan", "npa_jp_intrusion_crime_count", 2024, 53568,
     "recorded 侵入犯罪 (intrusion crime) cases", "bg_npa_jp",
     "−3.1% year on year. The NPA's 'intrusion crime' is a COMPOSITE of intrusion "
     "robbery, intrusion theft and residential trespass — not equivalent to burglary.",
     "National Police Agency (Japan)"),
    ("European Union", "eurostat_eu_res_burglary_count", 2024, 721876,
     "police-recorded offences", "bg_eurostat_news",
     "60.3% of all EU burglaries were of private residential premises. 38.1% below "
     "2014, but 12.4% above the 2021 low of 642,244.", "Eurostat"),
]

# ------------------------------------------- the international chart -------
# One ICCS code, five countries, no gaps: Eurostat's crim_off_cat series
# ICCS05012, "burglary of private residential premises", per 100 000
# inhabitants. This IS the joint Eurostat-UNODC collection — the substitute for
# UNODC's own burglary dashboard, which no longer resolves (see cq14).
#
# France is DELIBERATELY ABSENT. Eurostat's own metadata for FR states there is
# no correspondence between the French classification and this ICCS code. A
# line that the publisher says is not on the basis of the chart does not belong
# on the chart; it belongs in the data-quality register, and it is there.
EU_SERIES = {
    "Germany": ("DEU", [131.70, 138.78, 148.34, 165.28, 179.41, 185.66, 188.35,
                        205.84, 184.08, 141.22, 117.77, 104.97, 90.21, 65.22,
                        79.18, 93.62, 93.98]),
    "Netherlands": ("NLD", [556.19, 573.71, 475.60, 497.66, 512.90, 509.40, 423.28,
                            392.44, 334.09, 288.79, 245.27, 227.49, 182.31, 137.94,
                            135.07, 123.85, 117.01]),
    "Sweden": ("SWE", [412.40, 428.89, 434.25, 455.07, 417.09, 425.43, 393.76,
                       435.94, 428.60, 434.22, 364.90, 337.80, 379.99, 347.77,
                       329.30, 336.20, 319.91]),
    "Italy": ("ITA", [257.04, 255.66, 285.80, 345.14, 399.63, 421.25, 420.99,
                      386.09, 352.84, 323.20, 316.40, 276.39, 183.60, 210.54,
                      226.67, 250.28, 263.84]),
    "Spain": ("ESP", [205.65, 211.62, 237.12, 215.95, 270.03, 272.74, 261.82,
                      248.23, 243.97, 225.87, 229.68, 209.48, 152.92, 159.29,
                      182.39, 176.19, 166.79]),
}
EU_FROM = 2008

EU_CAVEATS = {
    "Germany": [
        "Eurostat's metadata records that Germany's national correspondence table to "
        "ICCS section 05 remains INCOMPLETE — the code is nominally shared, the "
        "underlying categories are not fully mapped.",
        "Cross-checks against the BKA's own Wohnungseinbruchdiebstahl series for 2022 "
        "(65,908 cases against a population of roughly 83.2 million).",
        "The 2021 trough coincides with the second year of pandemic restrictions; the "
        "series has risen 44% since.",
    ],
    "Netherlands": [
        "The steepest fall in the set: 79% below its 2009 peak.",
        "No published break in the series across the period.",
    ],
    "Sweden": [
        "Sweden's national category ('bostad') INCLUDES cellar and attic storage areas, "
        "which Germany's does not. That alone inflates the Swedish rate against "
        "Germany's on a nominally identical code.",
        "The 3.4-to-1 gap against Germany in 2024 should be read as a warning about the "
        "code, not as a finding about either country.",
    ],
    "Italy": [
        "The only line in the set rising: 44% above its 2020 trough.",
        "The 2020 collapse and partial recovery track the pandemic period.",
    ],
    "Spain": [
        "38.8% below its 2013 peak, with the pandemic trough in 2020.",
    ],
}


def eu_series():
    out = []
    for name, (code, vals) in EU_SERIES.items():
        pts = [{"year": EU_FROM + i, "value": v, "tier": "A"} for i, v in enumerate(vals)]
        out.append({
            "name": name, "code": code,
            "emphasis": name in ("Germany", "Netherlands"),
            "kind": "country",
            "basis_short": "Eurostat/UNODC ICCS05012, burglary of private residential "
                           "premises, per 100,000 inhabitants",
            "publisher": "Eurostat (joint Eurostat–UNODC data collection)",
            "tier": "A",
            "counts": "police-recorded residential burglaries per 100,000 inhabitants",
            "base_year": EU_FROM, "base_value": vals[0],
            "unit_raw": "per 100,000 inhabitants",
            "last": {"year": EU_FROM + len(vals) - 1, "value": vals[-1]},
            "points": pts,
            "caveats": EU_CAVEATS.get(name, []),
        })
    out.sort(key=lambda s: -s["last"]["value"])
    return out


INTL_CHART = {
    "title": "Break-ins abroad: one code, five countries",
    "unit": "Police-recorded burglary of private residential premises, per 100,000 inhabitants (Eurostat/UNODC ICCS05012)",
    "note": (
        "Every line here is filed under the same International Classification of Crime "
        "for Statistical Purposes code, ICCS05012. That makes the DIRECTION of each line "
        "comparable and the DISTANCE between lines much less so: Eurostat's own metadata "
        "records that Germany's mapping to the ICCS is incomplete, and Sweden's national "
        "category includes cellar and attic storage where Germany's does not. France is "
        "absent because Eurostat states there is no correspondence between the French "
        "classification and this code at all. The United States is absent because it "
        "publishes nothing on this basis — its survey counts households and its police "
        "series changed basis in 2020."
    ),
    "publisher": "Eurostat (joint Eurostat–UNODC data collection)",
    "tier": "A",
    "indexed": False,
    "series": eu_series(),
    "themes": [
        {"statement": "Four of the five countries are below where they started in 2008. The "
                      "Netherlands fell furthest by a wide margin — 79% below its 2009 "
                      "peak — while Sweden and Spain fell around 20%.", "tier": "A"},
        {"statement": "Italy is the exception: 44% above its 2020 trough and still "
                      "climbing. Germany has also risen 44% since its 2021 low, though it "
                      "remains half its 2015 peak.", "tier": "A"},
        {"statement": "Sweden records 3.4 times Germany's rate on the same code. That gap "
                      "is mostly the code: Sweden counts break-ins to cellars and attic "
                      "storage, Germany does not.", "tier": "A"},
        {"statement": "Across the EU as a whole, residential burglary is 38% below 2014 — "
                      "but 12% above its 2021 low.", "tier": "A"},
        {"statement": "No line on this chart is a count of home invasions. No country here "
                      "publishes one.", "tier": "A"},
        {"statement": "There is no global line to draw. UNODC has withdrawn burglary as a "
                      "retrievable indicator from its own portal — the property-crime "
                      "dashboards redirect and the legacy spreadsheet returns 404, checked "
                      "21 August 2026. These European figures survive only because Eurostat "
                      "publishes the same joint collection.", "tier": "A"},
    ],
    # The direct answer to the question that produced this section, kept with
    # the chart rather than buried in the register at the foot of the page.
    "answer": {
        "question": "Is a home invasion recorded as a home invasion?",
        "body": (
            "No. It is recorded as a burglary, and the record keeps the things a filing "
            "system can check — where the building was, whether entry was forced, whether "
            "anything was taken — rather than the thing that makes it a home invasion, "
            "which is that someone was home. The FBI's NIBRS sorts burglary by location "
            "type, premises entered and force; it has no data element for an occupied "
            "dwelling, so the count could not be produced from the returns even if someone "
            "wanted it. Michigan shows how complete the burial is: 'home invasion' is the "
            "literal statutory name of its burglary offence, in three degrees, and its "
            "state reporting manual codes every one of them as ordinary burglary. "
            "Australia and New Zealand are more explicit still — their shared "
            "classification, ANZSOC, lists home invasion only as an inclusion term inside "
            "aggravated and non-aggravated burglary of a dwelling. It is defined into "
            "burglary by the classification authority itself. Statistics Canada says the "
            "quiet part outright: because there is no agreed-upon definition, home "
            "invasion is difficult to measure and is not captured directly by its "
            "national survey — so StatCan reports robberies in private residences instead "
            "as a stand-in. The one place we found publishing home-invasion figures is the "
            "state of Victoria, where the 2018 total is split across two unrelated offence "
            "families — 105 offences filed under aggravated burglary and 87 under serious "
            "assault, which never reach any burglary total. Re-checked on 21 August 2026, "
            "that remains the most recent published figure anywhere we could find."
        ),
        "consequence": (
            "So the honest answer to whether home invasions have risen is that no national "
            "series exists to say. What can be said is that break-ins overall have fallen "
            "sharply almost everywhere they are measured, on every basis, for two decades — "
            "and that the occupied case is not rare. The ONS, working from survey responses "
            "rather than police codes, found that in over half of domestic burglaries where "
            "the offender got inside, someone was at home at the time. That is the closest "
            "thing to a measurement of the thing itself that exists, it is nine years old, "
            "and it is a share rather than a count."
        ),
        "tier": "A",
        # One paragraph, four publishers. Listing them all is the point: the
        # finding is that every one of these bodies files home invasion under
        # something else, and a single citation would hide three quarters of
        # the evidence for it.
        "source_ids": ["bg_anzsoc", "bg_micr_manual", "bg_statcan_be02",
                       "bg_csa_vic", "bg_ons_athome"],
    },
}

# ---------------------------------------------------------- nc08 -----------
NOT_COUNTED = [{
    "nc_id": "nc08",
    "category": "Home invasion, as an offence",
    "status": "Not an offence category — in the US, Canada, or Australia nationally",
    "detail": (
        "The question 'have home invasions risen?' cannot be answered from official "
        "statistics anywhere we could check, because no national body counts them — and "
        "in Australia and New Zealand the classification says why in as many words. "
        "ANZSOC 2023, the offence classification both countries use, lists 'home "
        "invasion' only as an INCLUSION TERM: 'home invasion with an aggravating factor' "
        "sits inside 0611 aggravated burglary of a dwelling, and 'home invasion, where "
        "there is no aggravating factor' inside 0612. It is defined INTO burglary by the "
        "classification authority itself, so it can never surface as an output category. "
        "The United States works the same way by a different route: NIBRS records "
        "burglary with a location code, a count of premises entered and a force "
        "indicator, and has no data element for whether the dwelling was occupied. "
        "Michigan is the sharpest case — 'home invasion' is the literal statutory name of "
        "its burglary offence, in three degrees, and its state reporting manual still "
        "codes every one of them as 22001, 22002 or 22003 burglary. A state can "
        "prosecute thousands of home invasions a year and publish a count of none. "
        "Statistics Canada is the most explicit of all: because there is no agreed-upon "
        "definition, home invasion is difficult to measure and is not captured directly "
        "by the Uniform Crime Reporting Survey — so StatCan reports robberies in private "
        "residences as a stand-in (865 in 2002, about 5 per 100,000). Bill C-15A made "
        "home invasion an aggravating factor at SENTENCING in 2002, creating a legal "
        "category and no statistical one. The single jurisdiction we found publishing "
        "home-invasion figures is the state of Victoria, and there the 2018 count is "
        "split across two unrelated offence families: 105 offences filed under aggravated "
        "burglary and 87 under serious assault, which never reach any burglary total. "
        "Re-checked 21 August 2026: that 2018 figure, published in March 2019, is still "
        "the most recent published anywhere we could find — seven years stale, and Victoria's "
        "own current offence classification no longer lists home invasion at all."
    ),
    "who_would_collect": (
        "FBI CJIS in the US, via a NIBRS data element that does not exist — occupancy is "
        "not recorded, so the count could not be produced from the returns even in "
        "principle; Statistics Canada, which states it cannot; the ABS, whose "
        "classification defines home invasion into burglary by design."
    ),
    "tier": "A",
    "source_id": "bg_anzsoc",
}]

# --------------------------------------------------- data quality ----------
DATA_QUALITY = [
    {
        "dq_id": "cq12",
        "geography": "US",
        "topic": "The US burglary series changes basis in 2020",
        "issue": (
            "The FBI's Summary Reporting System produced a national burglary rate through "
            "2019 and was then retired. Figures from 2020 onward are NIBRS-based national "
            "ESTIMATES, built from agencies covering 75.5% of the country and 87.2% of the "
            "population in 2024. They are not a continuation of the SRS run."
        ),
        "effect": (
            "The 2000-2024 fall is real in both halves — 53% under the SRS and 26% under "
            "the estimates — but a single percentage across the break would be quoting two "
            "different measurements as one. The chart draws the break rather than joining it."
        ),
        "tier": "A",
        "source_id": "bg_fbi_cde24",
    },
    {
        "dq_id": "cq13",
        "geography": "US",
        "topic": "Fewer burglaries are reported to police than a decade ago",
        "issue": (
            "The share of burglary victimisations that victims say they reported to police "
            "fell from 58.8% in 2010 to 40.7% in 2024 — 18.1 percentage points. The NCVS "
            "asks households directly, so it sees incidents police never record."
        ),
        "effect": (
            "Any police-recorded burglary decline is measuring two things at once: fewer "
            "break-ins, and fewer break-ins being reported. The survey and police series "
            "both fall, which is why the direction survives — but the SIZE of the "
            "police-recorded fall is overstated by an unknown margin."
        ),
        "tier": "A",
        "source_id": "bg_bjs_cv24",
    },
    {
        "dq_id": "cq14",
        "geography": "International",
        "topic": "UNODC has withdrawn burglary as a retrievable indicator",
        "issue": (
            "UNODC's data portal no longer offers burglary under any property-crime theme: "
            "the dashboard URLs redirect to a portal with no such theme, and the legacy "
            "CTS_Burglary spreadsheet returns 404. Checked 2026-08-21. The only surviving "
            "route to the same collection is Eurostat's crim_off_cat table, which "
            "publishes the joint Eurostat–UNODC data — and covers Europe only."
        ),
        "effect": (
            "There is no longer a global burglary series to compare against. This is the "
            "second live citation on this site to disappear from its publisher's own "
            "portal, and it is the argument for archiving every source at the moment it "
            "is read."
        ),
        "tier": "A",
        "source_id": "bg_unodc_gone",
    },
    {
        "dq_id": "cq15",
        "geography": "International",
        "topic": "A shared ICCS code is not a shared definition",
        "issue": (
            "Eurostat's metadata for the residential-burglary code records that Germany's "
            "national correspondence table to ICCS section 05 is INCOMPLETE, and that for "
            "France 'there is no correspondence between French and this ICCS "
            "classification' at all. Sweden's national category includes cellar and attic "
            "storage; Germany's does not."
        ),
        "effect": (
            "Countries filed under one code are not necessarily counting one thing. France "
            "is excluded from the international chart on the publisher's own statement. "
            "Sweden's 3.4-to-1 rate against Germany should be read as evidence about the "
            "code rather than about either country."
        ),
        "tier": "A",
        "source_id": "bg_eurostat_iccs",
    },
]

# ------------------------------------------------------------ trends -------
TRENDS = [
    {
        "topic": "burglary_us",
        "statement": (
            "Break-ins have fallen further than anything else this section measures. The "
            "police-recorded US burglary rate fell 53% between 2000 and 2019 on the "
            "Summary Reporting System basis, and a further 26% between 2020 and 2024 on "
            "the NIBRS-based estimates that replaced it. Households asked directly report "
            "the same direction: 34.1 burglaries per 1,000 households in 1999 against "
            "12.0 per 1,000 in 2024, across a category BJS redefined in 2017."
        ),
        "tier": "A",
        "source_id": "bg_fbi_cde24",
    },
    {
        "topic": "burglary_international",
        "statement": (
            "The fall is not an American story. Residential burglary is down 79% in the "
            "Netherlands since 2009, 54% in Germany since its 2015 peak, and 39% in Spain "
            "since 2013; England and Wales record 327,000 domestic burglaries in the year "
            "ending December 2025 against 2.4 million in 1993; Canadian breaking and "
            "entering is 77% below 1998; Australian household break-ins fell from 2.7% of "
            "households in 2014-15 to 1.8% in 2024-25. Italy is the exception, 44% above "
            "its 2020 trough."
        ),
        "tier": "A",
        "source_id": "bg_eurostat_iccs",
    },
    {
        "topic": "home_invasion",
        "statement": (
            "'Home invasion' is not an offence anyone counts nationally. It is recorded as "
            "burglary — sorted by location and by whether force was used, not by whether "
            "the household was home. Statistics Canada states outright that it cannot be "
            "measured from its national survey. So the honest answer to whether home "
            "invasions have risen is that no national series exists to say."
        ),
        "tier": "A",
        "source_id": "bg_statcan_be02",
    },
]


def load(p):
    return json.loads(pathlib.Path(p).read_text())


def save(p, d):
    pathlib.Path(p).write_text(json.dumps(d, indent=2) + "\n")


def merge(path, rows, key, keep_order=False):
    """Replace this builder's own rows by key; keep every other builder's.

    keep_order matters more than it looks. crime_trends.json has no id — its
    key is a topic slug — and the register is PAGED five at a time, so sorting
    it alphabetically silently pushed the NCVS divergence statement onto page
    two and out of the rendered text. The roundtrip suite caught it. Ordered
    registers (nc_id, dq_id) sort; unordered ones append.
    """
    existing = load(path) if pathlib.Path(path).exists() else []
    mine = {r[key] for r in rows}
    out = [r for r in existing if r.get(key) not in mine] + rows
    if not keep_order:
        out.sort(key=lambda r: str(r.get(key)))
    save(path, out)
    return len(out)


def main():
    # ---- sources ----------------------------------------------------------
    sources = load(CRIME_T / "crime_sources.json")
    have = {s["source_id"] for s in sources}
    added_src = 0
    for s in SOURCES:
        if s["source_id"] in have:
            continue
        sources.append({**s, "accessed": ACCESSED, "archived_url": None})
        have.add(s["source_id"])
        added_src += 1
    save(CRIME_T / "crime_sources.json", sources)

    # ---- indicators -------------------------------------------------------
    ind = load(CRIME_T / "crime_indicators.json")
    rows = list(US_ROWS)
    for country, iid, year, value, unit, sid, note, publisher in INTL_ROWS:
        rows.append({
            "indicator_id": iid, "geography": country, "year": year, "value": value,
            "unit": unit, "tier": "A", "publisher": publisher, "source_id": sid,
            "workstream": "W2", "note": note,
        })
    mine = {(r["indicator_id"], r["geography"], r["year"]) for r in rows}
    kept = [r for r in ind if (r["indicator_id"], r.get("geography"), r["year"]) not in mine]
    save(CRIME_T / "crime_indicators.json", kept + rows)

    # ---- the chart --------------------------------------------------------
    save(CRIME_C / "burglary_international.json", INTL_CHART)

    # ---- registers (merge, never clobber) ---------------------------------
    n_nc = merge(CRIME_T / "crime_not_counted.json", NOT_COUNTED, "nc_id")
    n_dq = merge(CRIME_T / "crime_data_quality.json", DATA_QUALITY, "dq_id")
    n_tr = merge(CRIME_T / "crime_trends.json", TRENDS, "topic", keep_order=True)

    print(f"sources    : +{added_src} (total {len(sources)})")
    print(f"indicators : +{len(rows)} burglary rows (total {len(kept) + len(rows)})")
    print(f"chart      : burglary_international.json — {len(INTL_CHART['series'])} countries, "
          f"{EU_FROM}-{EU_FROM + len(next(iter(EU_SERIES.values()))[1]) - 1}")
    print(f"not counted: {n_nc} rows (nc08 added)")
    print(f"data qual. : {n_dq} rows (cq12-cq15 added)")
    print(f"trends     : {n_tr} rows")
    for s in INTL_CHART["series"]:
        first, last = s["points"][0], s["points"][-1]
        pct = round((last["value"] / first["value"] - 1) * 100)
        print(f"  {s['name']:<14} {first['year']} {first['value']:>7.2f}  ->  "
              f"{last['year']} {last['value']:>7.2f}  ({pct:+d}%)")


if __name__ == "__main__":
    main()

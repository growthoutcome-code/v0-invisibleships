#!/usr/bin/env python3
"""
Annual series for Data/Crime (Sean, 1 Oct 2026: "The charting is so sparse that
I'm concerned about including it ... Maybe we should try doing some additional
research to bolster our existing crime data?").

The sparseness was a collection problem, not a publication one: the arrests
lines were five and four sampled years out of an annual FBI table, and the
page's own question — "Is crime rising or falling?" — had no chart at all.

This script owns two things:

  1. charts/crime_overall_indexed.json — the chart under "Is crime rising or
     falling?": police-recorded violent and property crime (FBI) and violence
     reported by victims (BJS survey), each indexed to 1999 = 100.
  2. The annual points on the "All arrests" and "Drug arrests" lines of
     charts/arrests_over_time.json (the immigration line is not touched — it
     belongs to build_crime_two_directions.py).

It also adds the figures to tables/crime_indicators.json and the new sources to
tables/crime_sources.json, by key, so a re-run replaces rather than duplicates.
Plain-language statements for both charts live in build_crime_copy.py, which runs
after this. Idempotent.

Rules carried over from the burglary chart (build_crime_burglary.py):
  * The FBI changed how it counts in 2020/2021 (Summary Reporting System to
    NIBRS-based estimates). Lines are SPLIT at the change, never joined.
  * 2021 is left out: the FBI says its 2021 estimates are "below a statistically
    acceptable level to be nationally representative and are not comparable to
    other yearly estimates" (UCR Summary of Reported Crimes in the Nation, 2025,
    footnote 7).
  * The survey's 2006 estimate is left out: BJS says "estimates for 2006 should
    not be compared to other years."
  * A year we could not read from the publisher's own table is left out, not
    filled. Nothing is interpolated.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_C = ROOT / "public/data/crime/charts"
CRIME_T = ROOT / "public/data/crime/tables"
ACCESSED = "2026-10-01"

# ------------------------------------------------------------------ sources --
# Existing ids reused: cs015 (CIUS 2010 Table 1), cs017 (CIUS 2019 Table 1),
# cs006 (UCR Summary of Reported Crimes in the Nation, 2025), cs_ncvs_cv24
# (Criminal Victimization, 2024), cs106 (Criminal Victimization, 2023),
# cs108 (CIUS 1997 Section IV), cs109 (FBI 2008 release), cs110 (CIUS 2019
# persons arrested), cs004 (Reported Crimes in the Nation Quick Stats 2024).
FBI_UCR = "FBI Uniform Crime Reporting Program"
SOURCES = [
    {"source_id": "ar_cius1995", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 1995, Section IV, Table 29 (Total Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/1995/95sec4.pdf"},
    {"source_id": "ar_cius1996", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 1996, Section IV, Table 29 (Total Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/1996/96sec4.pdf"},
    {"source_id": "ar_cius1998", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 1998, Section IV, Table 29 (Total Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/1998/98sec4.pdf"},
    {"source_id": "ar_cius1999", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 1999, Section IV, Table 29 (Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/1999/99sec4.pdf"},
    {"source_id": "ar_cius2000", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2000, Section IV, Table 29 (Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2000/00sec4.pdf"},
    {"source_id": "ar_cius2001", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2001, Section IV, Table 29 (Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2001/01sec4.pdf"},
    {"source_id": "ar_cius2002", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2002, Section IV, Table 29 (Estimated Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2002/02sec4.pdf"},
    {"source_id": "ar_cius2003", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2003, Section IV, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2003/03sec4.pdf"},
    {"source_id": "ar_cius2010", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2010, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2010/crime-in-the-u.s.-2010/tables/10tbl29.xls"},
    {"source_id": "ar_cius2011", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2011, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2011/crime-in-the-u.s.-2011/tables/table-29"},
    {"source_id": "ar_cius2012", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2012, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2012/crime-in-the-u.s.-2012/tables/29tabledatadecpdf/table_29_estimated_number_of_arrests_united_states_2012.xls"},
    {"source_id": "ar_cius2013", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2013, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2013/crime-in-the-u.s.-2013/tables/table-29/table_29_estimated_number_of_arrests_united_states_2013.xls"},
    {"source_id": "ar_cius2014", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2014, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2014/crime-in-the-u.s.-2014/tables/table-29"},
    {"source_id": "ar_cius2015", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2015, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2015/crime-in-the-u.s.-2015/tables/table-29"},
    {"source_id": "ar_cius2016", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2016, Table 18 (Estimated Number of Arrests; the 2016 edition renumbered its tables)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2016/crime-in-the-u.s.-2016/tables/table-18"},
    {"source_id": "ar_cius2017", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2017, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2017/crime-in-the-u.s.-2017/tables/table-29"},
    {"source_id": "ar_cius2018", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2018, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2018/crime-in-the-u.s.-2018/topic-pages/tables/table-29"},
    {"source_id": "ar_cius2019", "publisher": FBI_UCR, "evidence_tier": "A",
     "title": "Crime in the United States 2019, Table 29 (Estimated Number of Arrests)",
     "url": "https://ucr.fbi.gov/crime-in-the-u.s/2019/crime-in-the-u.s.-2019/topic-pages/tables/table-29"},
    {"source_id": "ar_fbi2020", "publisher": "FBI", "evidence_tier": "A",
     "title": "FBI Releases 2020 Crime Statistics (press release: 'an estimated 7.6 million arrests, excluding those for traffic violations')",
     "url": "https://www.fbi.gov/news/press-releases/fbi-releases-2020-crime-statistics"},
    {"source_id": "ar_bjs_drugs", "publisher": "Bureau of Justice Statistics", "evidence_tier": "A",
     "title": "Drugs and Crime Facts: Total estimated drug law violation arrests in the United States, 1980-2007 (archived; source FBI, Crime in the United States, annual)",
     "url": "https://bjs.ojp.gov/drugs-and-crime-facts/enforcement/arrtot-table"},
]

# ------------------------------------------------------------ crime rates ----
# FBI police-recorded rates per 100,000 inhabitants.
# 1999: CIUS 2010 Table 1. 2000-2019: CIUS 2019 Table 1 (the latest edition to
# print them; its violent total uses the LEGACY rape definition throughout,
# footnote 2, so the run is one definition end to end).
FBI_VIOLENT_SRS = {
    1999: 523.0, 2000: 506.5, 2001: 504.5, 2002: 494.4, 2003: 475.8, 2004: 463.2,
    2005: 469.0, 2006: 479.3, 2007: 471.8, 2008: 458.6, 2009: 431.9, 2010: 404.5,
    2011: 387.1, 2012: 387.8, 2013: 369.1, 2014: 361.6, 2015: 373.7, 2016: 386.6,
    2017: 383.8, 2018: 370.4, 2019: 366.7,
}
FBI_PROPERTY_SRS = {
    1999: 3743.6, 2000: 3618.3, 2001: 3658.1, 2002: 3630.6, 2003: 3591.2, 2004: 3514.1,
    2005: 3431.5, 2006: 3346.6, 2007: 3276.4, 2008: 3214.6, 2009: 3041.3, 2010: 2945.9,
    2011: 2905.4, 2012: 2868.0, 2013: 2733.6, 2014: 2574.1, 2015: 2500.5, 2016: 2451.6,
    2017: 2362.9, 2018: 2209.8, 2019: 2109.9,
}
# 2020 onward: the FBI's UCR Summary of Reported Crimes in the Nation, 2025,
# Figures 1 and 2 (the 20-year offence-rate trend charts). The report prints
# the TOTAL violent and property rates only for 2024 and 2025; for 2020, 2022
# and 2023 the totals are the sum of the published offence rates (murder, rape,
# robbery, aggravated assault; burglary, larceny-theft, motor vehicle theft).
# The same sum reproduces the printed 2024 and 2025 totals exactly (362.9,
# 327.6, 1,761.1) and 2025 property to 0.1 (1,534.7 against 1,534.8), so the
# method is checked against the FBI's own figures. This report's vintage revises
# earlier FBI publications for the same years; it is the current one.
VIOLENT_PARTS = {  # murder, rape (revised definition), robbery, aggravated assault
    2020: (6.6, 40.1, 71.2, 271.3), 2022: (6.6, 43.1, 67.2, 272.6),
    2023: (6.0, 40.8, 67.4, 267.4),
}
PROPERTY_PARTS = {  # burglary, larceny-theft, motor vehicle theft
    2020: (306.0, 1379.3, 243.8), 2022: (272.6, 1414.8, 284.0),
    2023: (253.2, 1364.4, 321.9),
}
FBI_VIOLENT_NIBRS = {y: round(sum(v), 1) for y, v in VIOLENT_PARTS.items()} | {2024: 362.9, 2025: 327.6}
FBI_PROPERTY_NIBRS = {y: round(sum(v), 1) for y, v in PROPERTY_PARTS.items()} | {2024: 1761.1, 2025: 1534.8}

# BJS National Crime Victimization Survey: violent victimizations per 1,000
# persons age 12 or older (rape/sexual assault, robbery, aggravated and simple
# assault), including crimes never reported to police.
# 1999-2012 and 2024: Criminal Victimization, 2024, appendix table 1 / text.
# 2013-2023: Criminal Victimization, 2023, appendix table 1. The two editions
# agree where they overlap (2011 22.6, 2012 26.1). 2006 omitted (BJS).
NCVS_VIOLENT = {
    1999: 47.2, 2000: 37.5, 2001: 32.6, 2002: 32.1, 2003: 32.1, 2004: 27.8,
    2005: 28.4, 2007: 27.2, 2008: 25.3, 2009: 22.3, 2010: 19.3, 2011: 22.6,
    2012: 26.1, 2013: 23.2, 2014: 20.1, 2015: 18.6, 2016: 19.7, 2017: 20.6,
    2018: 23.2, 2019: 21.0, 2020: 16.4, 2021: 16.5, 2022: 23.5, 2023: 22.5,
    2024: 23.3,
}
NCVS_SRC = {y: ("cs106" if 2013 <= y <= 2023 else "cs_ncvs_cv24") for y in NCVS_VIOLENT}

# ---------------------------------------------------------------- arrests ----
# FBI estimated arrests, all offences except traffic, and drug abuse violations,
# each year from that year's own Crime in the United States, Table 29 (Table 18
# in 2016). Pre-2004 editions print some figures rounded to hundreds.
# 2004-2007 drug figures: BJS's reproduction of the same FBI tables (rounded to
# hundreds). 2004-2009 totals and 2008-2009 drug figures are missing because
# those editions sit on www2.fbi.gov, which could not be read; 2008's total is
# the FBI's own release (cs109), already on file. 2021 has no national estimate.
# 2020: the FBI's release states 7.6 million, rounded; no drug figure printed.
ARRESTS_TOTAL = {
    1995: (15119800, "ar_cius1995"), 1996: (15168100, "ar_cius1996"),
    1997: (15284300, "cs108"), 1998: (14528300, "ar_cius1998"),
    1999: (14031070, "ar_cius1999"), 2000: (13980297, "ar_cius2000"),
    2001: (13699254, "ar_cius2001"), 2002: (13741438, "ar_cius2002"),
    2003: (13639479, "ar_cius2003"), 2008: (14005615, "cs109"),
    2010: (13120947, "ar_cius2010"), 2011: (12408899, "ar_cius2011"),
    2012: (12196959, "ar_cius2012"), 2013: (11302102, "ar_cius2013"),
    2014: (11205833, "ar_cius2014"), 2015: (10797088, "ar_cius2015"),
    2016: (10662252, "ar_cius2016"), 2017: (10554985, "ar_cius2017"),
    2018: (10310960, "ar_cius2018"), 2019: (10085207, "ar_cius2019"),
    2020: (7600000, "ar_fbi2020"), 2024: (7522824, "cs004"),
}
ARRESTS_DRUG = {
    1995: (1476100, "ar_cius1995"), 1996: (1506200, "ar_cius1996"),
    1997: (1583600, "cs108"), 1998: (1559100, "ar_cius1998"),
    1999: (1532200, "ar_cius1999"), 2000: (1579566, "ar_cius2000"),
    2001: (1586902, "ar_cius2001"), 2002: (1538813, "ar_cius2002"),
    2003: (1678192, "ar_cius2003"), 2004: (1745700, "ar_bjs_drugs"),
    2005: (1846300, "ar_bjs_drugs"), 2006: (1889800, "ar_bjs_drugs"),
    2007: (1841200, "ar_bjs_drugs"), 2010: (1638846, "ar_cius2010"),
    2011: (1531251, "ar_cius2011"), 2012: (1552432, "ar_cius2012"),
    2013: (1501043, "ar_cius2013"), 2014: (1561231, "ar_cius2014"),
    2015: (1488707, "ar_cius2015"), 2016: (1572579, "ar_cius2016"),
    2017: (1632921, "ar_cius2017"), 2018: (1654282, "ar_cius2018"),
    2019: (1558862, "ar_cius2019"), 2024: (822488, "cs004"),
}
ARREST_BREAK = 2020  # last year on the Summary Reporting System basis


def load(p):
    return json.loads(pathlib.Path(p).read_text())


def save(p, d):
    pathlib.Path(p).write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")


def pct(a, b):
    return round((b - a) / a * 100)


def sign(n):
    return f"+{n}%" if n > 0 else f"−{abs(n)}%"


def lane(name, counts, publisher, unit_raw, basis_short, base_year, base_value,
         raw, caveats, emphasis=False, break_after=None, summary=None):
    pts = [{"year": y, "value": round(v / base_value * 100, 1), "raw": v, "tier": "A"}
           for y, v in sorted(raw.items())]
    out = {
        "name": name, "counts": counts, "publisher": publisher, "emphasis": emphasis,
        "base_year": base_year, "base_value": base_value, "unit_raw": unit_raw,
        "tier": "A", "basis_short": basis_short, "caveats": caveats, "points": pts,
    }
    if break_after is not None:
        out["break_after"] = break_after
    if summary:
        out["summary"] = summary
    return out


def overall_chart():
    v_old, v_new = FBI_VIOLENT_SRS, FBI_VIOLENT_NIBRS
    p_old, p_new = FBI_PROPERTY_SRS, FBI_PROPERTY_NIBRS
    split = ("Not joined at 2020. The FBI moved from its Summary Reporting System to "
             "NIBRS-based national estimates, and the 2020-onward figures come from a later "
             "report that re-estimated those years; 2019 and 2020 are not one measurement. "
             "The FBI calls the two 'analogous measures rather than as one being more "
             "accurate than the other.'")
    gap21 = ("2021 is not drawn: the FBI states its 2021 estimates are 'below a statistically "
             "acceptable level to be nationally representative and are not comparable to "
             "other yearly estimates.'")
    violent = lane(
        "Violent crime (police records)",
        "Violent crimes known to police per 100,000 people: murder, rape, robbery, aggravated assault",
        "FBI Uniform Crime Reporting Program", "offences per 100,000 inhabitants",
        "FBI violent crime rate per 100,000; indexed to 1999 = 100",
        1999, v_old[1999], v_old | v_new,
        [
            "1999: Crime in the United States 2010, Table 1. 2000-2019: Crime in the United States "
            "2019, Table 1, whose violent total uses the legacy rape definition for every year.",
            "2020 onward: UCR Summary of Reported Crimes in the Nation, 2025, Figure 1. That "
            "report prints the total only for 2024 (362.9) and 2025 (327.6); 2020, 2022 and 2023 "
            "are the sum of its four published offence rates, a method that reproduces the two "
            "printed totals exactly.",
            split, gap21,
            "From 2020 rape is counted under the FBI's broader 2013 definition.",
            "Counts only what reaches the police. The victim survey on the same chart also "
            "counts crimes that were never reported.",
        ],
        emphasis=True, break_after=2019,
        summary=(f"1999–2019: {sign(pct(v_old[1999], v_old[2019]))} (Summary Reporting System) "
                 f"· 2020–2025: {sign(pct(v_new[2020], v_new[2025]))} (NIBRS-based estimates)"),
    )
    prop = lane(
        "Property crime (police records)",
        "Property crimes known to police per 100,000 people: burglary, larceny-theft, motor vehicle theft",
        "FBI Uniform Crime Reporting Program", "offences per 100,000 inhabitants",
        "FBI property crime rate per 100,000; indexed to 1999 = 100",
        1999, p_old[1999], p_old | p_new,
        [
            "1999: Crime in the United States 2010, Table 1. 2000-2019: Crime in the United States "
            "2019, Table 1.",
            "2020 onward: UCR Summary of Reported Crimes in the Nation, 2025, Figure 2. The total "
            "is printed for 2024 (1,761.1) and 2025 (1,534.8); 2020, 2022 and 2023 are the sum of "
            "its three published offence rates.",
            split, gap21,
            "Most property crime is never reported to police, so this line is a floor, not a count "
            "of everything that happened.",
        ],
        break_after=2019,
        summary=(f"1999–2019: {sign(pct(p_old[1999], p_old[2019]))} (Summary Reporting System) "
                 f"· 2020–2025: {sign(pct(p_new[2020], p_new[2025]))} (NIBRS-based estimates)"),
    )
    survey = lane(
        "Violence reported by victims (survey)",
        "Violent victimizations per 1,000 people age 12 or older, from the National Crime "
        "Victimization Survey, including crimes never reported to police",
        "Bureau of Justice Statistics", "victimizations per 1,000 persons age 12 or older",
        "BJS violent victimization rate per 1,000 persons 12+; indexed to 1999 = 100",
        1999, NCVS_VIOLENT[1999], NCVS_VIOLENT,
        [
            "Asks a national sample of households whether they were victims, so it counts crimes "
            "the police never hear about. Includes simple assault, which the FBI's violent total "
            "does not.",
            "1999-2012 and 2024: Criminal Victimization, 2024, appendix table 1. 2013-2023: "
            "Criminal Victimization, 2023, appendix table 1. The two editions agree where they overlap.",
            "2006 is not drawn: BJS states that 'estimates for 2006 should not be compared to "
            "other years.'",
            "A survey estimate with a margin of error: BJS prints a standard error and a 95% "
            "confidence interval for every year, so small year-to-year moves may not be real.",
            "Measured on a different basis from the police lines, so it is indexed to its own "
            "1999 figure. Read the direction, not the distance between the lines.",
        ],
    )
    return {
        "title": "Police records and the victim survey, 1999 = 100",
        "unit": "Each line indexed to its own 1999 figure = 100",
        "note": ("Two measures of the same question, each indexed to its own 1999 figure so they "
                 "can share an axis: the chart shows direction, never size. The police lines "
                 "break at 2020, where the FBI changed how it counts, and skip 2021, which the "
                 "FBI says is not nationally representative. The survey line counts crimes the "
                 "police never hear about. Click any line for its raw figures, method and caveats."),
        "publisher": "FBI; Bureau of Justice Statistics", "tier": "A", "indexed": True,
        "series": [violent, prop, survey],
    }


def indicator_rows():
    rows = []
    def add(iid, y, v, unit, src, note=""):
        rows.append({"indicator_id": iid, "year": y, "value": v, "unit": unit, "tier": "A",
                     "publisher": "", "source_id": src, "note": note, "geography": "US",
                     "workstream": "W1"})
    pub = {"cs015": "FBI (CIUS 2010, Table 1)", "cs017": "FBI (CIUS 2019, Table 1)",
           "cs006": "FBI (UCR Summary of Reported Crimes in the Nation, 2025)",
           "cs106": "BJS (Criminal Victimization, 2023)",
           "cs_ncvs_cv24": "BJS (Criminal Victimization, 2024)"}
    for y, v in FBI_VIOLENT_SRS.items():
        add("fbi_violent_crime_rate_srs", y, v, "per 100,000 (Summary Reporting System, legacy rape definition)",
            "cs015" if y == 1999 else "cs017")
    for y, v in FBI_PROPERTY_SRS.items():
        add("fbi_property_crime_rate_srs", y, v, "per 100,000 (Summary Reporting System)",
            "cs015" if y == 1999 else "cs017")
    for y, v in FBI_VIOLENT_NIBRS.items():
        add("fbi_violent_crime_rate_nibrs", y, v, "per 100,000 (NIBRS-based estimates, 2025 report)",
            "cs006", "" if y >= 2024 else "Sum of the report's four published offence rates.")
    for y, v in FBI_PROPERTY_NIBRS.items():
        add("fbi_property_crime_rate_nibrs", y, v, "per 100,000 (NIBRS-based estimates, 2025 report)",
            "cs006", "" if y >= 2024 else "Sum of the report's three published offence rates.")
    for y, v in NCVS_VIOLENT.items():
        add("ncvs_violent_victimization_rate", y, v, "victimizations per 1,000 persons age 12+", NCVS_SRC[y])
    for y, (v, s) in ARRESTS_TOTAL.items():
        add("total_arrests_us", y, v, "estimated arrests", s,
            "Rounded as published ('7.6 million')." if y == 2020 else "")
    for y, (v, s) in ARRESTS_DRUG.items():
        add("drug_arrests_us", y, v, "drug arrests", s,
            "BJS reproduction of the FBI table, rounded to hundreds." if s == "ar_bjs_drugs" else "")
    for r in rows:
        r["publisher"] = pub.get(r["source_id"], "FBI")
        if r["indicator_id"].endswith("arrests_us"):
            r["workstream"] = "W3"
        if r["source_id"] == "ar_bjs_drugs":
            r["publisher"] = "BJS (Drugs and Crime Facts, from FBI CIUS)"
    return rows


def update_arrests():
    path = CRIME_C / "arrests_over_time.json"
    chart = load(path)
    for s in chart["series"]:
        if s["name"] == "All arrests":
            old = {p["year"]: p for p in s["points"]}
            pts = [old[1980]] if 1980 in old else []  # 1980 stays as filed (tier B)
            pts += [{"year": y, "value": v, "tier": "A"} for y, (v, _) in sorted(ARRESTS_TOTAL.items())]
            s["points"] = pts
            s["break_after"] = ARREST_BREAK
            s["caveats"] = [
                "Each year from that year's own FBI Crime in the United States, Table 29 (Table 18 "
                "in 2016), 1995-2019 — never mixed with the BJS 1980-2009 series, which uses "
                "different weights and yields about 11.6M for 1997.",
                "2004-2007 and 2009 are not drawn: those editions could not be read from the FBI's "
                "own pages. 2008 is the FBI's release. Nothing is filled in between.",
                "2020 is the FBI's release figure, '7.6 million', rounded as published.",
                "The line breaks after 2020. 2021 has no national estimate, and 2024 is a "
                "NIBRS-based estimate (Reported Crimes in the Nation, 2024) — a different basis "
                "from the years before.",
                "An arrest is an enforcement action, not a conviction; 82-84% of arrests across "
                "this whole period are for lesser (Part II) offences.",
            ]
        elif s["name"] == "Drug arrests":
            old = {p["year"]: p for p in s["points"]}
            pts = [old[1980]] if 1980 in old else []
            pts += [{"year": y, "value": v, "tier": "A"} for y, (v, _) in sorted(ARRESTS_DRUG.items())]
            s["points"] = pts
            s["break_after"] = ARREST_BREAK
            s["caveats"] = [
                "Each year from that year's own FBI Table 29 (Table 18 in 2016). 2004-2007 are BJS's "
                "reproduction of the same FBI tables, rounded to hundreds.",
                "Peaked in 2006 at about 1.89 million (1,889,800 in BJS's reproduction of the FBI "
                "table; 1,889,810 in third-party compilations of it). 2024 (822,488) is still the "
                "largest single arrest category.",
                "2008, 2009, 2020 and 2021 are not drawn: no figure could be read from the FBI's own "
                "pages. The line breaks before 2024, which is a NIBRS-based estimate.",
            ]
    chart["accuracy_note"] = (
        "About the accuracy of these figures: arrest totals are estimates assembled from agency "
        "reports, and two official federal criminal-arrest series disagree (see the data-quality "
        "register). The criminal lines are annual from 1995 with gaps where an FBI edition could "
        "not be read (2004-2009 in part), and break after 2020, where the FBI changed how it "
        "estimates; 2021 has no national estimate. The immigration line is federal FISCAL years. "
        "It is published federal statistics through FY2024 and nothing official after that — the "
        "2025 point is FOIA-derived, marked tier B and drawn dotted."
    )
    chart["note"] = chart["note"].replace(
        "Sparse points are drawn as points, not smoothed into a line the data cannot support; ",
        "Years with no published figure are left as gaps and the points are shown; ")
    save(path, chart)
    return chart


def main():
    srcs = load(CRIME_T / "crime_sources.json")
    have = {s["source_id"] for s in srcs}
    added = 0
    for s in SOURCES:
        if s["source_id"] in have:
            continue
        srcs.append({**s, "accessed": ACCESSED, "archived_url": None})
        added += 1
    save(CRIME_T / "crime_sources.json", srcs)

    rows = indicator_rows()
    ind = load(CRIME_T / "crime_indicators.json")
    mine = {(r["indicator_id"], r["geography"], r["year"]) for r in rows}
    # A replaced row keeps the note it carried when this script has none of its own.
    old_notes = {(r["indicator_id"], r.get("geography"), r["year"]): r.get("note")
                 for r in ind if r.get("note")}
    for r in rows:
        k = (r["indicator_id"], r["geography"], r["year"])
        if not r["note"] and old_notes.get(k):
            r["note"] = old_notes[k]
    kept = [r for r in ind if (r["indicator_id"], r.get("geography"), r["year"]) not in mine]
    save(CRIME_T / "crime_indicators.json", kept + rows)

    path = CRIME_C / "crime_overall_indexed.json"
    chart = overall_chart()
    if path.exists():  # keep the themes build_crime_copy.py wrote
        prev = load(path)
        if prev.get("themes"):
            chart["themes"] = prev["themes"]
    save(path, chart)

    ar = update_arrests()
    print(f"sources     : +{added} (total {len(srcs)})")
    print(f"indicators  : {len(rows)} annual rows (total {len(kept) + len(rows)})")
    for s in chart["series"]:
        print(f"overall     : {s['name']:<40} {len(s['points'])} points  {s.get('summary', '')}")
    for s in ar["series"][:2]:
        print(f"arrests     : {s['name']:<40} {len(s['points'])} points")


if __name__ == "__main__":
    main()

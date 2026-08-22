#!/usr/bin/env python3
"""
Incarceration: the stock, where arrests were the flow.

Sean, 2026-08-22: "we weren't able to detect a rise in arrests. Really, a rise
in crime. But can we find data that aligns with our prison system or a penal
system data store that illustrates a rise or decline in incarceration?"

It is a good question because it is a genuinely INDEPENDENT check. Arrests are
a flow counted by police agencies; incarceration is a stock counted by
corrections departments. Different institutions, different returns, different
failure modes. If both fall, that is corroboration. If they diverge, the
divergence is the finding.

What the record says: a mountain, a collapse, and a climb.
  * State and federal prison peaked in 2009 at 1,615,487
  * Fell for twelve years to 1,205,087 in 2021 — a quarter of the system
  * Has risen every year since: +2.1% (2022), +2.0% (2023)

And then it stops. BJS's "Prisoners in 2024" is listed as forthcoming for Q3
2026 and does not exist. Which is the SAME structural answer the arrests
question got: the federal statistical record ends before the period being
asked about. Twice now. That belongs on the page in those words.

Three findings that were not expected:
  * The jail decline is entirely a decline in CONVICTED people. 2013→2023 the
    sentenced jail population fell 29% while the unconvicted population rose
    3%. Seventy percent of people in American jails are unconvicted.
  * BJS stopped publishing prison capacity after 2016. The answer to "is the
    system overcrowded" is that the federal government stopped counting.
  * The US is no longer the world's top jailer by rate. It is fourth.

MERGE, never clobber — same contract as build_crime_burglary.py.
Idempotent: re-running replaces its own rows and leaves every other builder's.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_T = ROOT / "public/data/crime/tables"
CRIME_C = ROOT / "public/data/crime/charts"

ACCESSED = "2026-08-22"

# --------------------------------------------------------------- sources ---
SOURCES = [
    {"source_id": "inc_bjs_p23st", "publisher": "Bureau of Justice Statistics",
     "title": "Prisoners in 2023 – Statistical Tables (Sept 2025, NCJ 310197) — the most recent in the series",
     "url": "https://bjs.ojp.gov/document/p23st.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_p19", "publisher": "Bureau of Justice Statistics",
     "title": "Prisoners in 2019 (Oct 2020, NCJ 255115) — carries the revised 2009–2012 counts",
     "url": "https://bjs.ojp.gov/content/pub/pdf/p19.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_p09", "publisher": "Bureau of Justice Statistics",
     "title": "Prisoners in 2009 (Dec 2010, NCJ 231675) — the 2000–2008 annual series",
     "url": "https://bjs.ojp.gov/content/pub/pdf/p09.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_p00", "publisher": "Bureau of Justice Statistics",
     "title": "Prisoners in 2000 (Aug 2001, NCJ 188207) — the 1999 count",
     "url": "https://bjs.ojp.gov/content/pub/pdf/p00.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_p20st", "publisher": "Bureau of Justice Statistics",
     "title": "Prisoners in 2020 – Statistical Tables (Dec 2021, NCJ 302776) — states the COVID mechanism",
     "url": "https://bjs.ojp.gov/content/pub/pdf/p20st.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_p16", "publisher": "Bureau of Justice Statistics",
     "title": "Prisoners in 2016 (Jan 2018, NCJ 251149), Table 16 — the LAST prison capacity table BJS published",
     "url": "https://bjs.ojp.gov/content/pub/pdf/p16.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_ji23st", "publisher": "Bureau of Justice Statistics",
     "title": "Jail Inmates in 2023 – Statistical Tables (Apr 2025, NCJ 309965)",
     "url": "https://bjs.ojp.gov/document/ji23st.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_ji19", "publisher": "Bureau of Justice Statistics",
     "title": "Jail Inmates in 2019 (Mar 2021, NCJ 255608) — 2019 is a Census of Jails year, not a survey year",
     "url": "https://bjs.ojp.gov/content/pub/pdf/ji19.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_jim09", "publisher": "Bureau of Justice Statistics",
     "title": "Jail Inmates at Midyear 2009 – Statistical Tables (Jun 2010, NCJ 230122)",
     "url": "https://bjs.ojp.gov/content/pub/pdf/jim09st.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_pjim00", "publisher": "Bureau of Justice Statistics",
     "title": "Prison and Jail Inmates at Midyear 2000 (Mar 2001, NCJ 185989)",
     "url": "https://bjs.ojp.gov/content/pub/pdf/pjim00.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_pdrj24", "publisher": "Bureau of Justice Statistics",
     "title": "Jails Report Series: 2024 Preliminary Data Release (Dec 2025) — PRELIMINARY, may be revised",
     "url": "https://bjs.ojp.gov/library/publications/jails-report-series-2024-preliminary-data-release/web-report",
     "evidence_tier": "B"},
    {"source_id": "inc_bjs_cpus23", "publisher": "Bureau of Justice Statistics",
     "title": "Correctional Populations in the United States, 2023 – Statistical Tables (Sept 2025, NCJ 310413)",
     "url": "https://bjs.ojp.gov/document/cpus23st.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_cpus13", "publisher": "Bureau of Justice Statistics",
     "title": "Correctional Populations in the United States, 2013, Appendix Table 5 (Dec 2014, NCJ 248479)",
     "url": "https://bjs.ojp.gov/content/pub/pdf/cpus13.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_facilities19", "publisher": "Bureau of Justice Statistics",
     "title": "Census of State and Federal Adult Correctional Facilities, 2019 (Nov 2021, NCJ 301366)",
     "url": "https://bjs.ojp.gov/content/pub/pdf/csfacf19st.pdf", "evidence_tier": "A"},
    {"source_id": "inc_bjs_forthcoming", "publisher": "Bureau of Justice Statistics",
     "title": "BJS forthcoming publications — 'Prisoners in 2024 – Statistical Tables' listed for Q3 2026, unpublished as of 22 Aug 2026",
     "url": "https://bjs.ojp.gov/library/publications/forthcoming", "evidence_tier": "A"},
    {"source_id": "inc_wpb_rank", "publisher": "World Prison Brief (Institute for Crime & Justice Policy Research, Birkbeck)",
     "title": "Highest to Lowest — Prison Population Rate (the ranking page carries NO reference-date column)",
     "url": "https://www.prisonstudies.org/highest-to-lowest/prison_population_rate", "evidence_tier": "B"},
    {"source_id": "inc_wpb_us", "publisher": "World Prison Brief",
     "title": "United States of America — 542 per 100,000 (2023); total built from jails, state and federal prisons",
     "url": "https://www.prisonstudies.org/country/united-states-america", "evidence_tier": "B"},
    {"source_id": "inc_wpb_china", "publisher": "World Prison Brief",
     "title": "China — sentenced prisoners in Ministry of Justice prisons only; WPB's own estimate is 'at least 2,340,000'",
     "url": "https://www.prisonstudies.org/country/china", "evidence_tier": "B"},
    {"source_id": "inc_wppl", "publisher": "Institute for Crime & Justice Policy Research",
     "title": "World Prison Population List — 'The information does not relate to the same date'",
     "url": "https://www.prisonstudies.org/sites/default/files/publications/wppl_10.pdf", "evidence_tier": "A"},
    {"source_id": "inc_space_i", "publisher": "Council of Europe / University of Lausanne",
     "title": "SPACE I 2025 key findings — one uniform reference date (31 Jan 2025), 100% response across 51 prison administrations",
     "url": "https://wp.unil.ch/space/files/2026/06/260626_key-findings-space-i_prisons-europe-2025.pdf",
     "evidence_tier": "A"},
    {"source_id": "inc_unodc_prisons", "publisher": "UNODC",
     "title": "UNODC data portal, prison capacity and persons held — LIVE, but the legacy dataunodc.un.org/dp-prisons URLs now redirect to the site root",
     "url": "https://data.unodc.org/datareport/prison-capacity", "evidence_tier": "A"},
    {"source_id": "inc_vera_2024", "publisher": "Vera Institute of Justice",
     "title": "People in Jail and Prison in 2024 — 40 states increased prison populations between fall 2022 and spring 2024",
     "url": "https://vera-institute.files.svdcdn.com/production/downloads/publications/People-in-Jail-and-Prison-in-2024-Full-Reportpdf.pdf",
     "evidence_tier": "B"},
]

# ------------------------------------------------------------- the series ---
# BJS National Prisoner Statistics, persons under state or federal
# jurisdiction, 31 December. Vintages differ: 1999 from p00, 2000-2008 from
# p09, 2009-2012 from p19 (revised), 2013-2023 from p23st. Mixing vintages is
# normal for this series and the differences are small (2009 moved 1,613,740 ->
# 1,615,487) but the choice is recorded rather than silent.
PRISON = {
    1999: 1363701, 2000: 1391261, 2001: 1404032, 2002: 1440144, 2003: 1468601,
    2004: 1497100, 2005: 1527929, 2006: 1569945, 2007: 1598245, 2008: 1609759,
    2009: 1615487, 2010: 1613803, 2011: 1598968, 2012: 1570397, 2013: 1576950,
    2014: 1562319, 2015: 1526603, 2016: 1508129, 2017: 1489189, 2018: 1464385,
    2019: 1430165, 2020: 1221164, 2021: 1205087, 2022: 1230143, 2023: 1254224,
}
PRISON_SRC = {1999: "inc_bjs_p00", 2009: "inc_bjs_p19", 2010: "inc_bjs_p19",
              2011: "inc_bjs_p19", 2012: "inc_bjs_p19"}

# Sentenced prisoners per 100,000 US residents of all ages. No verified 1999
# figure: the 2000 report's table and its own narrative disagree, so the year
# is left out rather than guessed.
PRISON_RATE = {
    2000: 478, 2001: 470, 2002: 476, 2003: 482, 2004: 486, 2005: 491,
    2006: 501, 2007: 506, 2008: 504, 2009: 502, 2010: 500, 2011: 492,
    2012: 480, 2013: 479, 2014: 472, 2015: 459, 2016: 450, 2017: 442,
    2018: 431, 2019: 419, 2020: 357, 2021: 350, 2022: 355, 2023: 360,
}

# BJS Annual Survey of Jails, inmates confined at midyear (30 June).
JAIL = {
    1999: 605943, 2000: 621149, 2001: 631240, 2002: 665475, 2003: 691301,
    2004: 713990, 2005: 747529, 2006: 765819, 2007: 780174, 2008: 785556,
    2009: 767620, 2010: 748700, 2011: 735600, 2012: 744500, 2013: 731200,
    2014: 744600, 2015: 727400, 2016: 740700, 2017: 745200, 2018: 738400,
    2019: 734500, 2020: 549100, 2021: 636300, 2022: 663100, 2023: 664200,
    2024: 657500,
}

# The composition finding: convicted down 29%, unconvicted UP 3%.
JAIL_UNCONVICTED = {2013: 453200, 2014: 467500, 2015: 454400, 2016: 482100,
                    2017: 482000, 2018: 490000, 2019: 480700, 2020: 380700,
                    2021: 451400, 2022: 466100, 2023: 467600, 2024: 450600}
JAIL_CONVICTED = {2013: 278000, 2014: 277100, 2015: 273000, 2016: 258500,
                  2017: 263200, 2018: 248500, 2019: 253700, 2020: 168400,
                  2021: 185000, 2022: 197000, 2023: 196600, 2024: 206900}

# Prison + jail + probation + parole, less persons with dual status.
CORRECTIONAL = {
    2000: 6467900, 2001: 6585000, 2002: 6731100, 2003: 6887000, 2004: 6997200,
    2005: 7055800, 2006: 7199800, 2007: 7339900, 2008: 7314400, 2009: 7237100,
    2010: 7088500, 2011: 6990400, 2012: 6940500, 2013: 6899700, 2014: 6856900,
    2015: 6740300, 2016: 6616200, 2017: 6549700, 2018: 6409200, 2019: 6343200,
    2020: 5506400, 2021: 5442300, 2022: 5480600, 2023: 5530300,
}
CORRECTIONAL_BREAK = 2021  # BJS declares 2022 and 2023 not comparable to earlier years

# ICE detainees held in local jails — inside the BJS jail count, and small.
ICE_IN_JAILS = {2013: 17200, 2014: 16400, 2015: 13700, 2016: 16500, 2017: 13300,
                2018: 14900, 2019: 17300, 2020: 9300, 2021: 7400, 2022: 6900,
                2023: 7000}

ROWS = []


def row(ind, year, value, unit, sid, note="", tier="A", geo="US",
        publisher="Bureau of Justice Statistics"):
    ROWS.append({
        "indicator_id": ind, "geography": geo, "year": year, "value": value,
        "unit": unit, "tier": tier, "publisher": publisher, "source_id": sid,
        "workstream": "W2", "note": note,
    })


for y, v in PRISON.items():
    note = ""
    if y == 2009:
        note = "SERIES PEAK. Revised upward from 1,613,740 in the original 2009 publication."
    elif y == 2020:
        note = ("BJS attributes the fall to COVID: admissions dropped 40%, from 576,956 to "
                "346,461, as courts delayed trials and sentencing. BJS states 2019 and 2020 "
                "remain directly comparable — the change is in the world, not the method.")
    elif y == 2021:
        note = "SERIES TROUGH — 25.4% below the 2009 peak."
    elif y == 2023:
        note = ("Most recent year published. 'Prisoners in 2024' is listed by BJS as "
                "forthcoming for Q3 2026 and does not exist as of 22 August 2026.")
    row("bjs_prison_population", y, v, "persons under state or federal jurisdiction, 31 December",
        PRISON_SRC.get(y, "inc_bjs_p09" if y <= 2008 else "inc_bjs_p23st"), note)

for y, v in PRISON_RATE.items():
    note = "RATE PEAK." if y == 2007 else ("RATE TROUGH." if y == 2021 else "")
    row("bjs_imprisonment_rate_p100k", y, v,
        "sentenced prisoners per 100,000 US residents",
        "inc_bjs_p09" if y <= 2009 else ("inc_bjs_p19" if y <= 2012 else "inc_bjs_p23st"), note)

for y, v in JAIL.items():
    note, tier = "", "A"
    if y == 2008:
        note = "SERIES PEAK."
    elif y == 2019:
        note = ("From the Census of Jails, a full enumeration — every other year in this "
                "series is a sample-based estimate from the Annual Survey of Jails.")
    elif y == 2020:
        note = "SERIES TROUGH — a 25% single-year fall BJS attributes mainly to the pandemic."
    elif y == 2024:
        note, tier = "PRELIMINARY. May be revised when the final statistical tables appear.", "B"
    row("bjs_jail_population", y, v, "inmates confined at midyear (30 June)",
        "inc_bjs_pjim00" if y <= 2000 else ("inc_bjs_jim09" if y <= 2009 else
        ("inc_bjs_ji19" if y <= 2019 else ("inc_bjs_pdrj24" if y == 2024 else "inc_bjs_ji23st"))),
        note, tier)

for y, v in JAIL_UNCONVICTED.items():
    row("bjs_jail_unconvicted", y, v, "jail inmates not convicted (held pretrial)",
        "inc_bjs_pdrj24" if y == 2024 else "inc_bjs_ji23st",
        "69% of the jail population." if y == 2024 else
        ("70% of the jail population — and 3% ABOVE 2013, while the convicted "
         "population fell 29% over the same years." if y == 2023 else ""),
        "B" if y == 2024 else "A")
for y, v in JAIL_CONVICTED.items():
    row("bjs_jail_convicted", y, v, "jail inmates convicted",
        "inc_bjs_pdrj24" if y == 2024 else "inc_bjs_ji23st",
        "29% below 2013. Almost the entire decade-long jail decline is here." if y == 2023 else "",
        "B" if y == 2024 else "A")

for y, v in CORRECTIONAL.items():
    note = ""
    if y == 2007:
        note = "SERIES PEAK — one adult in every 31 was under some form of correctional control."
    elif y == 2022:
        note = ("BJS states 2022 is NOT comparable to earlier years for the total, community "
                "supervision or probation.")
    elif y == 2023:
        note = ("Also not comparable to pre-2022 years. The probation survey added 285 agencies "
                "supervising misdemeanour probation only, roughly 120,000 people — most of the "
                "apparent 2022→2023 rise is that universe expansion, not growth.")
    row("bjs_correctional_population", y, v,
        "persons under correctional supervision (prison, jail, probation, parole)",
        "inc_bjs_cpus13" if y <= 2012 else "inc_bjs_cpus23", note)

for y, v in ICE_IN_JAILS.items():
    row("ice_detainees_in_local_jails", y, v, "ICE detainees held in local jails at midyear",
        "inc_bjs_ji23st",
        "About 1% of the jail population — and falling while ICE's own detained population "
        "hit records. The two systems barely touch in this series." if y == 2023 else "")

# Composition of the most recent correctional year, and the capacity record.
row("bjs_probation_population", 2023, 3103400, "adults on probation", "inc_bjs_cpus23",
    "56.1% of everyone under correctional control — the largest component by far.")
row("bjs_parole_population", 2023, 680400, "adults on parole", "inc_bjs_cpus23",
    "Down from 878,700 in 2019, but that fall is substantially a California reporting "
    "failure: updated post-release community supervision counts have been unavailable "
    "since 2018.")
row("bjs_prison_capacity_pct", 2016, 114.0, "percent of lowest reported capacity",
    "inc_bjs_p16",
    "THE LAST YEAR BJS PUBLISHED THIS. 26 states at or above 100% — Alabama 175.7%, "
    "Illinois 164.1%, Nebraska 157.8%. 'Prisoners in 2019' and every edition since "
    "contain no capacity table at all.")
row("bjs_facilities_over_capacity", 2019, 292, "confinement facilities operating over capacity",
    "inc_bjs_facilities19",
    "Holding 36.0% of all prisoners in confinement facilities. The most recent federal "
    "facility-capacity figure of any kind; the 2024 census is forthcoming.")
row("bjs_jail_occupancy_pct", 2023, 73.0, "percent of rated jail capacity occupied",
    "inc_bjs_ji23st",
    "Jails are collectively well UNDER capacity and have been since 2010 — beds grew 5% "
    "over the decade while occupancy fell from 84% to 73%. 12% of individual jurisdictions "
    "were over capacity, so crowding is a distribution problem, not a system-wide one.")
row("wpb_prison_rate_p100k", 2023, 542, "prisoners per 100,000 population (World Prison Brief)",
    "inc_wpb_us",
    "Rank 4 in the world, behind El Salvador, Cuba and Turkmenistan. The US total on this "
    "basis includes local jails.", "B")

# --------------------------------------------------------------- the chart --
def series(name, data, measure, emphasis, tier, unit, basis, publisher, caveats,
           break_after=None, src_note=None):
    pts = [{"year": y, "value": v, "tier": tier} for y, v in sorted(data.items())]
    if src_note:
        pts[-1]["note"] = src_note
    s = {
        "name": name, "emphasis": emphasis, "tier": tier, "measure": measure,
        "unit": unit, "basis_short": basis, "publisher": publisher,
        "points": pts, "caveats": caveats,
    }
    if break_after is not None:
        s["break_after"] = break_after
    return s


CHART = {
    "title": "Who is held: the US penal system, 1999–2024",
    "unit": "People in prison, in jail, and under correctional control",
    "window": {"from": 1999, "to": 2025},
    "window_note": (
        "This chart uses the section's shared 1999–2025 window, so its years line up with "
        "every other chart on the page."
    ),
    "y_format": "millions",
    "change_view": True,
    "legend_note": (
        "These three counts are nested, not parallel — the widest line contains the other "
        "two, and prison is counted in December where jails are counted in June."
    ),
    "note": (
        "Three counts of people, nested rather than parallel: the widest line CONTAINS the "
        "other two, plus everyone on probation or parole. Prison is counted on 31 December, "
        "jails on 30 June. The widest line breaks after 2021 because BJS states its own 2022 "
        "and 2023 figures are not comparable with earlier years. Click any line for its full "
        "record, its method and what it cannot show."
    ),
    "publisher": "Bureau of Justice Statistics (National Prisoner Statistics; Annual Survey of Jails; Correctional Populations)",
    "tier": "A",
    "series": [
        series("Under correctional control", CORRECTIONAL, "stock", False, "A",
               "persons under correctional supervision",
               "prison + jail + probation + parole, less dual-status persons",
               "BJS Correctional Populations in the United States",
               ["THE LINE BREAKS AFTER 2021 and the break is not cosmetic. BJS states that "
                "2022 and 2023 are not comparable to earlier years for this total, for "
                "community supervision, or for probation.",
                "The 2023 probation survey added 285 agencies supervising misdemeanour "
                "probation only — roughly 120,000 people, about 4%. Most of the apparent "
                "2022→2023 rise is that expansion rather than growth.",
                "The parole fall from 878,700 (2019) to 680,400 (2023) is substantially a "
                "California reporting failure: updated post-release community supervision "
                "counts have been unavailable since 2018. It is the most misleading "
                "movement on this chart if read as a real decline.",
                "Probation and parole are 68% of this line. Most people under correctional "
                "control in America are not behind anything.",
                "No 2024 or 2025 total has been published."],
               break_after=CORRECTIONAL_BREAK),
        series("In prison (state and federal)", PRISON, "stock", True, "A",
               "persons under state or federal jurisdiction",
               "BJS National Prisoner Statistics, 31 December, persons under jurisdiction",
               "BJS Prisoners series",
               ["Peak 1,615,487 in 2009; trough 1,205,087 in 2021, a fall of 410,400 — a "
                "quarter of the system. Then up 2.1% in 2022 and 2.0% in 2023.",
                "THE SERIES ENDS AT 2023. 'Prisoners in 2024' is listed by BJS as "
                "forthcoming for Q3 2026 and does not exist as of 22 August 2026 — so this "
                "line, like the arrests chart above it, stops before the enforcement period "
                "it is most often asked about.",
                "The 2020 drop is a collapse in INTAKE, not mass release: admissions fell "
                "40% as courts delayed trials and sentencing. BJS states 2019 and 2020 "
                "remain directly comparable.",
                "'Under jurisdiction' means legal authority, not location — a prisoner "
                "counted here may physically be in a local jail, a private facility, a "
                "halfway house, or another state's prison.",
                "Counts are revised between publication vintages. 2009 moved from 1,613,740 "
                "to 1,615,487, 2020 from 1,215,800 to 1,221,164."],
               src_note="most recent year BJS has published"),
        series("In local jails", JAIL, "stock", True, "A",
               "inmates confined at midyear",
               "BJS Annual Survey of Jails, inmates confined at 30 June",
               "BJS Jail Inmates series",
               ["THE COMPOSITION INVERTED. Between 2013 and 2023 the CONVICTED jail "
                "population fell 29% while the UNCONVICTED population rose 3%. Seventy "
                "percent of people in American jails in 2023 had not been convicted of "
                "anything. Almost the entire decade-long decline is a decline in sentenced "
                "people.",
                "2019 comes from the Census of Jails, a full enumeration; every other year "
                "is a sample-based estimate from the Annual Survey of Jails.",
                "Jails are collectively UNDER capacity — 73% of rated capacity in 2023, down "
                "from 84% in 2013 — though 12% of individual jurisdictions were over it.",
                "ICE detainees held in local jails ARE inside this count: 7,000 at midyear "
                "2023, about 1%, and falling while ICE's own detained population set "
                "records. The immigration system is almost entirely outside this line.",
                "2024 is preliminary and may be revised."],
               src_note="preliminary"),
    ],
    "themes": [
        {"statement": "American imprisonment peaked in 2009 and fell for twelve years — "
                      "1,615,487 people down to 1,205,087, a quarter of the whole system.",
         "tier": "A"},
        {"statement": "It is rising again. Up 2.1% in 2022 and 2.0% in 2023, about 49,000 "
                      "people over two years — from a base a quarter below the peak.",
         "tier": "A"},
        {"statement": "The record then stops. BJS has published nothing for 2024 or 2025, "
                      "and 'Prisoners in 2024' is listed as forthcoming. This is the second "
                      "chart in this section whose official series ends just before the "
                      "years it is most often asked about — the arrests chart does the same.",
         "tier": "A"},
        {"statement": "Seventy percent of people in American jails have not been convicted "
                      "of anything. Between 2013 and 2023 the convicted jail population fell "
                      "29% while the unconvicted population rose 3%: the system did not "
                      "shrink so much as change who it holds.",
         "tier": "A"},
        {"statement": "Most people under correctional control are not behind anything — "
                      "probation and parole are 68% of the widest line, and its fall after "
                      "2021 is partly a change in what was counted rather than in what "
                      "happened.",
         "tier": "A"},
        {"statement": "Immigration detention is a different system and this chart shows it: "
                      "ICE detainees inside the jail count numbered 7,000 in 2023, about 1%, "
                      "and were falling while ICE's own population set records.",
         "tier": "A"},
    ],
    "accuracy_note": (
        "Prison is counted on 31 December and jails at 30 June, so no two lines here are a "
        "snapshot of the same day. Every figure is Bureau of Justice Statistics unless "
        "marked otherwise, and each line's modal carries its vintage, its breaks and what "
        "it cannot show."
    ),
}

# ------------------------------------------------- international non-chart --
INTL = {
    "title": "Incarceration internationally — why there is no chart here",
    "why_no_chart": (
        "There is one obvious chart to draw — every country's imprisonment rate on a shared "
        "axis — and the source that would supply it says not to. The World Prison Brief's "
        "ranking page carries no reference-date column, and behind it the dates run from "
        "December 2018 to August 2026: Cuba sits second in the world on a January 2020 "
        "figure, China's is nearly eight years old. And China's entry is not a smaller "
        "number but a different statistic — sentenced prisoners in Ministry of Justice "
        "prisons only, where WPB's own estimate of the true total is 'at least 2,340,000', "
        "plus roughly a million detained in Xinjiang for whom no reliable figures exist. "
        "The World Prison Population List states the problem in its own words: the "
        "information does not relate to the same date. So the figures are given here as a "
        "dated table, each row carrying the day it describes, and never as bars on a shared "
        "axis. One thing can be said cleanly: the United States is no longer the world's "
        "top jailer by rate. It is fourth."
    ),
    "rows": [
        {"country": "El Salvador", "value": 1659, "year": "March 2024", "unit": "per 100,000",
         "definition": "Rank 1. 109,519 held. Rate more than three times the United States'.",
         "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "Cuba", "value": 794, "year": "January 2020", "unit": "per 100,000",
         "definition": "Rank 2 — on a figure more than six years old, and excluding labour camps.",
         "tier": "C", "source_id": "inc_wpb_rank"},
        {"country": "Turkmenistan", "value": 576, "year": "early 2021", "unit": "per 100,000",
         "definition": "Rank 3. Published by WPB as an estimate ('c. 576'), not a count.",
         "tier": "C", "source_id": "inc_wpb_rank"},
        {"country": "United States", "value": 542, "year": "2023", "unit": "per 100,000",
         "definition": "Rank 4. 1,833,700 held. Unusually for this table the US total is "
                       "explicit about its parts — 664,200 in local jails at 30 June 2023, "
                       "1,013,500 in state prisons and 156,000 in federal prisons at 31 "
                       "December — so it blends a June and a December count.",
         "tier": "B", "source_id": "inc_wpb_us"},
        {"country": "Turkey", "value": 503, "year": "3 August 2026", "unit": "per 100,000",
         "definition": "433,520 held. The Council of Europe's harmonised count put Türkiye at "
                       "458 on 31 January 2025 — a 45-point gap between two respectable "
                       "sources, which is the reference-date problem measured.",
         "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "Russia", "value": 197, "year": "May 2026", "unit": "per 100,000",
         "definition": "282,000 held; 30.1% pre-trial.", "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "England & Wales", "value": 136, "year": "27 July 2026", "unit": "per 100,000",
         "definition": "86,267 held. Excludes juveniles in secure training centres and "
                       "local-authority secure children's homes.",
         "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "France", "value": 131, "year": "1 July 2026", "unit": "per 100,000",
         "definition": "89,446 held — and excludes 19,190 écroués non détenus, people on the "
                       "prison register who are not in a cell.",
         "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "China", "value": 119, "year": "31 December 2018", "unit": "per 100,000",
         "definition": "NOT COMPARABLE, and the largest single reason this cannot be a chart. "
                       "Counts sentenced prisoners in Ministry of Justice prisons only, "
                       "excluding pre-trial detainees and administrative detention. WPB's own "
                       "note puts the real total at 'at least 2,340,000' and adds that about "
                       "a million Uighur Muslims are reported detained in Xinjiang, with no "
                       "reliable figures available.",
         "tier": "C", "source_id": "inc_wpb_china"},
        {"country": "Canada", "value": 98, "year": "year ending 31 March 2024", "unit": "per 100,000",
         "definition": "39,819 — but an ANNUAL AVERAGE, where every other row is a single-day "
                       "count. A different statistic sharing a column.",
         "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "Germany", "value": 69, "year": "31 January 2025", "unit": "per 100,000",
         "definition": "57,812 held. Sourced by WPB from the Council of Europe's SPACE I, "
                       "which is the one genuinely harmonised collection here.",
         "tier": "A", "source_id": "inc_space_i"},
        {"country": "Japan", "value": 33, "year": "mid-2025", "unit": "per 100,000",
         "definition": "41,232 held; 15.8% pre-trial. About one sixteenth the US rate.",
         "tier": "B", "source_id": "inc_wpb_rank"},
        {"country": "Europe (46 states)", "value": 127, "year": "31 January 2025", "unit": "per 100,000",
         "definition": "The alternative that works: Council of Europe SPACE I uses ONE "
                       "reference date for every country and had a 100% response rate across "
                       "51 prison administrations. Average 127, median 110, from Norway at 54 "
                       "to Türkiye at 458. It is the harmonised comparison this section would "
                       "want — and the United States cannot appear on it.",
         "tier": "A", "source_id": "inc_space_i"},
    ],
}

# ------------------------------------------------------------ registers ----
NOT_COUNTED = [
    {
        "nc_id": "nc09",
        "category": "Prison capacity, since 2016",
        "status": "Measured, published, then discontinued",
        "detail": (
            "'Is the prison system overcrowded?' has a federal answer only up to 2016. "
            "Table 16 of Prisoners in 2016 put the United States at 114.0% of its lowest "
            "reported capacity, with 26 states at or above 100% — Alabama 175.7%, Illinois "
            "164.1%, Nebraska 157.8%, Delaware 154.8%. Prisoners in 2019 contains no "
            "capacity table. Neither does any edition since. The nearest surviving federal "
            "measurement is the 2019 facilities census, which found 292 confinement "
            "facilities operating over capacity, holding 36.0% of all prisoners — and the "
            "next census is still forthcoming. Even the 2016 table came with a trap worth "
            "keeping: states report up to three capacity measures and many report only "
            "one, so Alabama was at 175.7% of DESIGN capacity and 90.7% of OPERATIONAL "
            "capacity in the same row. The same state, the same year, opposite answers."
        ),
        "who_would_collect": (
            "Bureau of Justice Statistics, which collected it until 2016 and stopped. No "
            "federal body has published a national prison capacity series since."
        ),
        "tier": "A",
        "source_id": "inc_bjs_p16",
    },
    {
        "nc_id": "nc10",
        "category": "Incarceration, compared between countries",
        "status": "No shared reference date — the publisher says so itself",
        "detail": (
            "The World Prison Brief is the standard international source and it does not "
            "claim to be a same-date comparison. Its ranking page carries no date column at "
            "all, while the figures behind it run from December 2018 to August 2026; Cuba "
            "ranks second in the world on a January 2020 number. The World Prison "
            "Population List states it plainly: the information does not relate to the same "
            "date, and comparability is further compromised by different practice in "
            "different countries. Beneath the dates sit definitional gaps that no axis can "
            "absorb — China's figure counts sentenced prisoners in Ministry of Justice "
            "prisons only, against WPB's own estimate of 'at least 2,340,000'; Canada "
            "publishes an annual average where others publish a single day; France excludes "
            "19,190 people on the prison register who are not in a cell. WPB's own two "
            "products disagree with each other, giving El Salvador 1,086 in the 14th edition "
            "and 1,659 in the live database for overlapping periods. The Council of Europe's "
            "SPACE I does it properly — one reference date, 31 January 2025, and a 100% "
            "response rate — and covers Europe only."
        ),
        "who_would_collect": (
            "No one currently does, at global scale, on one date. UNODC's prison indicators "
            "are live but the legacy dataunodc.un.org/dp-prisons URLs now redirect to the "
            "site root; SPACE I is the model, and it is regional."
        ),
        "tier": "A",
        "source_id": "inc_wppl",
    },
]

DATA_QUALITY = [
    {
        "dq_id": "cq16", "geography": "US",
        "topic": "The prison series ends before the years it is asked about",
        "issue": (
            "BJS's most recent Prisoners release covers 2023 and was published in September "
            "2025. 'Prisoners in 2024 – Statistical Tables' is listed on BJS's forthcoming "
            "page for Q3 2026 and does not exist as of 22 August 2026; the direct URL "
            "returns 404. There is no preliminary prisons release for 2024 either, though "
            "BJS did publish one for jails."
        ),
        "effect": (
            "This is the second national series in this section to stop just short of the "
            "period in question — criminal arrests end at 2024, imprisonment at 2023. A "
            "reader asking whether the enforcement of 2025 and 2026 shows up in the prison "
            "population cannot be answered from federal statistics, and the honest response "
            "is that the record is not there yet rather than that nothing happened."
        ),
        "tier": "A", "source_id": "inc_bjs_forthcoming",
    },
    {
        "dq_id": "cq17", "geography": "US",
        "topic": "BJS declares its own 2022 and 2023 correctional totals non-comparable",
        "issue": (
            "Three separate problems land in the same two years. BJS states that 2022 and "
            "2023 cannot be compared with earlier years for the total correctional "
            "population, community supervision or probation. The 2023 Annual Probation "
            "Survey added 285 agencies supervising misdemeanour probation only, about "
            "120,000 people. And California's post-release community supervision counts have "
            "not been updated since 2018, which drives much of the parole fall from 878,700 "
            "(2019) to 680,400 (2023)."
        ),
        "effect": (
            "The widest line on the incarceration chart is broken after 2021 for this "
            "reason. Read as a continuous series it would show correctional control falling "
            "and then recovering; in truth part of the recovery is 120,000 people who were "
            "always there and are now counted, and part of the earlier fall is a state that "
            "stopped reporting."
        ),
        "tier": "A", "source_id": "inc_bjs_cpus23",
    },
    {
        "dq_id": "cq18", "geography": "US",
        "topic": "Prison capacity stopped being published in 2016",
        "issue": (
            "Table 16 of Prisoners in 2016 is the last national prison capacity table BJS "
            "published. Prisoners in 2019 and every edition since contain none. Where it "
            "did exist it was ambiguous by construction: states report design, rated and "
            "operational capacity, many report only some, and BJS published population "
            "against both the lowest and the highest reported measure."
        ),
        "effect": (
            "'Is the prison system overcrowded' cannot be answered from current federal "
            "data at all, and where it could be answered the answer depended on which "
            "capacity measure was chosen — Alabama was simultaneously at 175.7% of design "
            "capacity and 90.7% of operational capacity in 2016."
        ),
        "tier": "A", "source_id": "inc_bjs_p16",
    },
    {
        "dq_id": "cq19", "geography": "International",
        "topic": "The world incarceration ranking mixes eight years of reference dates",
        "issue": (
            "The World Prison Brief's rate ranking presents countries in a single ordered "
            "list with no reference-date column. Retrieved individually, the dates run from "
            "31 December 2018 (China) to 3 August 2026 (Turkey). Cuba is ranked second in "
            "the world on a January 2020 figure and Turkmenistan third on a 2021 estimate. "
            "WPB's own World Prison Population List states that the information does not "
            "relate to the same date."
        ),
        "effect": (
            "Any bar chart built from that page silently compares 2018 with 2026. This "
            "section therefore publishes the figures as a dated table where every row "
            "carries its own date, and no international incarceration chart — the same "
            "decision already taken for drug deaths and missing persons."
        ),
        "tier": "A", "source_id": "inc_wppl",
    },
]

TRENDS = [
    {"topic": "incarceration_us",
     "statement": (
         "American imprisonment peaked in 2009 at 1,615,487 people under state or federal "
         "jurisdiction, fell for twelve years to 1,205,087 in 2021 — a quarter of the "
         "system — and has risen every year since, by 2.1% in 2022 and 2.0% in 2023. The "
         "imprisonment rate followed the same shape, peaking at 506 per 100,000 in 2007 and "
         "reaching 360 in 2023. No figure for 2024 or 2025 has been published."
     ), "tier": "A", "source_id": "inc_bjs_p23st"},
    {"topic": "jail_composition",
     "statement": (
         "The decade-long fall in the American jail population is almost entirely a fall in "
         "convicted people. Between 2013 and 2023 the sentenced jail population fell 29%, "
         "from 278,000 to 196,600, while the unconvicted population rose 3%, from 453,200 to "
         "467,600. Seventy percent of people held in local jails in 2023 had not been "
         "convicted of anything."
     ), "tier": "A", "source_id": "inc_bjs_ji23st"},
    {"topic": "incarceration_international",
     "statement": (
         "The United States is no longer the world's highest incarcerator by rate. The World "
         "Prison Brief puts it fourth at 542 per 100,000 for 2023, behind El Salvador "
         "(1,659, March 2024), Cuba (794, January 2020) and Turkmenistan (about 576, early "
         "2021). It remains several times above every comparable country — Germany 69, Japan "
         "33 — but the ranking itself mixes reference dates across eight years and cannot be "
         "drawn as a chart."
     ), "tier": "B", "source_id": "inc_wpb_rank"},
]


def load(p):
    return json.loads(pathlib.Path(p).read_text())


def save(p, d):
    pathlib.Path(p).write_text(json.dumps(d, indent=2) + "\n")


def merge(path, rows, key, keep_order=False):
    existing = load(path) if pathlib.Path(path).exists() else []
    mine = {r[key] for r in rows}
    out = [r for r in existing if r.get(key) not in mine] + rows
    if not keep_order:
        out.sort(key=lambda r: str(r.get(key)))
    save(path, out)
    return len(out)


def fix_ice_figure():
    """Three numbers were circulating for one January 2026 event.

    The detention chart carries the two sourced ones — about 73,000 (CBS,
    citing ICE) and 70,766 (Kocher, from ICE's published detention files) —
    but the milestone and the sweeps register both quoted 73,400, which is
    neither, and which nothing on the site supports. Replaced with the
    chart's own figures so the page states one thing.
    """
    changed = []
    mp = CRIME_T / "crime_milestones.json"
    mils = load(mp)
    for m in mils:
        if "73,400" in m.get("title", "") or "73,400" in m.get("description", ""):
            m["title"] = "ICE detention passes 70,000 held in a single day"
            m["description"] = (
                "Reported two ways for the same month: about 73,000 on 16 January (CBS, "
                "citing ICE) and 70,766 on 24 January (Kocher, from ICE's published "
                "detention files). Either way the first time above 70,000 in ICE's "
                "23-year history. By 11 July 2026 the published count was 65,765, of whom "
                "70.6% had no criminal conviction."
            )
            changed.append(m["milestone_id"])
    save(mp, mils)

    sp = CRIME_T / "crime_sweeps.json"
    sweeps = load(sp)
    for s in sweeps:
        if "73,400" in s.get("headline", ""):
            s["headline"] = (
                "More than 70,000 people held in ICE detention on a single day in January "
                "2026 — above the previous 2019 peak — with about 444,900 detention "
                "bookings since January 2025"
            )
            changed.append(s["sweep_id"])
    save(sp, sweeps)
    return changed


def enable_arrests_change_view():
    """The arrests chart has no builder of its own — it predates them — so its
    doc-level flags are set here. Its THEMES used to be rewritten here too; that
    now belongs to build_crime_copy.py, which owns the plain-language layer for
    every chart and enforces the word ceiling.
    """
    path = CRIME_C / "arrests_over_time.json"
    chart = load(path)
    chart["change_view"] = True
    save(path, chart)
    return True


def main():
    sources = load(CRIME_T / "crime_sources.json")
    have = {s["source_id"] for s in sources}
    added = 0
    for s in SOURCES:
        if s["source_id"] in have:
            continue
        sources.append({**s, "accessed": ACCESSED, "archived_url": None})
        have.add(s["source_id"])
        added += 1
    save(CRIME_T / "crime_sources.json", sources)

    ind = load(CRIME_T / "crime_indicators.json")
    mine = {(r["indicator_id"], r["geography"], r["year"]) for r in ROWS}
    kept = [r for r in ind if (r["indicator_id"], r.get("geography"), r["year"]) not in mine]
    save(CRIME_T / "crime_indicators.json", kept + ROWS)

    save(CRIME_C / "incarceration_over_time.json", CHART)
    save(CRIME_T / "crime_intl_incarceration.json", INTL)

    n_nc = merge(CRIME_T / "crime_not_counted.json", NOT_COUNTED, "nc_id")
    n_dq = merge(CRIME_T / "crime_data_quality.json", DATA_QUALITY, "dq_id")
    n_tr = merge(CRIME_T / "crime_trends.json", TRENDS, "topic", keep_order=True)
    fixed = fix_ice_figure()
    theme_fixed = enable_arrests_change_view()

    print(f"sources    : +{added} (total {len(sources)})")
    print(f"indicators : +{len(ROWS)} incarceration rows (total {len(kept) + len(ROWS)})")
    print(f"chart      : incarceration_over_time.json — {len(CHART['series'])} measures")
    for s in CHART["series"]:
        p0, p1 = s["points"][0], s["points"][-1]
        brk = f" break@{s['break_after']}" if "break_after" in s else ""
        print(f"    {s['name']:<32} {p0['year']} {p0['value']:>9,} -> "
              f"{p1['year']} {p1['value']:>9,}{brk}")
    print(f"non-chart  : crime_intl_incarceration.json — {len(INTL['rows'])} dated rows")
    print(f"not counted: {n_nc} rows (nc09, nc10 added)")
    print(f"data qual. : {n_dq} rows (cq16-cq19 added)")
    print(f"trends     : {n_tr} rows")
    print(f"ICE 73,400 -> sourced figures in: {', '.join(fixed) or 'nothing (already fixed)'}")
    print(f"arrests chart change_view enabled: {theme_fixed}")


if __name__ == "__main__":
    main()

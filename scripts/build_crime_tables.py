#!/usr/bin/env python3
"""
Build the Crime section's data tables (W9 data-quality spine + W1 homicide).

Scope, set by Sean: United States only. No international comparison set.

The hard problem this file solves is that "US homicide" is not one number.
There are three separate measurement systems and, within the FBI's own, several
publication vintages that revise each other. Rather than picking one and hiding
the rest, both series are carried side by side and every row records its vintage.

Sources are researched and fetched; see crime_sources.json for the URL, publisher
and access date behind every source_id. Nothing here is from memory.

Idempotent: rebuilds every crime table from /tmp/crime_rows.json + the literals
below on each run.
"""
import json
import pathlib
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Research inputs live in the repo, not in /tmp. They were scratch files until
# 2026-08-22, which meant a rebuild only worked inside the container that did
# the original research and died with FileNotFoundError anywhere else. The
# /tmp path is kept as a fallback so an in-flight research session still works.
def _research(name):
    repo = ROOT / "research/crime" / name
    if repo.exists():
        return repo
    return pathlib.Path("/tmp") / name

OUT = ROOT / "public/data/crime/tables"
CHARTS = ROOT / "public/data/crime/charts"
RESEARCH_ROWS = None  # set in main() via _research()
RESEARCH_SRCS = None

# Indicators that are statements or one-off facts rather than time series —
# they belong in the data-quality register and caveats, not the indicator table.
NON_SERIES = {
    "nibrs_comparability_statement",
    "nibrs_significance_statement",
    "nibrs_major_departments_missing",
    "homicide_clearance_rate_annual_series",
}

# ---------------------------------------------------------------------- YTD ---
# 2026 year-to-date. Deliberately NOT plotted on the homicide chart: a partial
# year on an annual series is a category error, and the chart's window ends at
# the last COMPLETE year so it stays aligned with the other Data-section charts.
# Rendered instead as a labelled current-position block beneath the chart.
YTD_2026 = [
    {"indicator_id": "ccj_h1_homicide_pct_change", "year": 2026, "value": -18.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026",
     "note": "215 fewer homicides across the 30 cities reporting homicide data."},
    {"indicator_id": "ccj_h1_robbery_pct_change", "year": 2026, "value": -17.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026", "note": ""},
    {"indicator_id": "ccj_h1_carjacking_pct_change", "year": 2026, "value": -47.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026", "note": ""},
    {"indicator_id": "ccj_h1_mv_theft_pct_change", "year": 2026, "value": -20.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026", "note": ""},
    {"indicator_id": "ccj_h1_gun_assault_pct_change", "year": 2026, "value": -6.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026", "note": ""},
    {"indicator_id": "ccj_h1_agg_assault_pct_change", "year": 2026, "value": -2.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026", "note": ""},
    # The two that ROSE. Reporting the eleven that fell without these would be
    # exactly the selective framing this dataset exists to avoid.
    {"indicator_id": "ccj_h1_sexual_assault_pct_change", "year": 2026, "value": 3.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026",
     "note": "ROSE. One of four offences of thirteen that did not fall."},
    {"indicator_id": "ccj_h1_domestic_violence_pct_change", "year": 2026, "value": 8.0,
     "unit": "% change, H1 2026 vs H1 2025, 36 large cities", "tier": "A",
     "publisher": "Council on Criminal Justice", "source_id": "cs_ccj_2026",
     "note": "ROSE, and by the largest margin of any offence in the sample."},
    {"indicator_id": "rtci_ytd_murder_pct_change", "year": 2026, "value": -18.7,
     "unit": "% change, Jan-Apr 2026 vs 2025, 566 agencies / ~119M people", "tier": "B",
     "publisher": "Real-Time Crime Index", "source_id": "cs_rtci_2026",
     "note": "Independent of the CCJ sample and agreeing closely with it."},
]

YTD_SOURCES = [
    {"source_id": "cs_ccj_2026",
     "url": "https://counciloncj.org/crime-trends-in-u-s-cities-mid-year-2026-update/",
     "publisher": "Council on Criminal Justice",
     "title": "Crime Trends in U.S. Cities: Mid-Year 2026 Update (2026-07-22)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "cs_rtci_2026",
     "url": "https://jasher.substack.com/p/murder-in-the-us-fell-dramatically",
     "publisher": "Jeff Asher / Real-Time Crime Index",
     "title": "Murder in the US Fell Dramatically in the First Half of 2026 (2026-07-06)",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
]

# ---------------------------------------------------------------- registers ---

DATA_QUALITY = [
    {
        "dq_id": "cq01",
        "geography": "US",
        "topic": "US crime is measured by three systems that disagree",
        "issue": (
            "Police-recorded crime (FBI UCR/NIBRS), crimes people report experiencing "
            "when surveyed (BJS National Crime Victimization Survey), and homicide "
            "deaths recorded on death certificates (CDC/NCHS vital statistics) are "
            "three different counts of three different things. All are correct. None "
            "is 'the' crime rate."
        ),
        "effect": (
            "A question as simple as 'is crime rising?' has more than one defensible "
            "answer depending on which system is cited, and the systems have recently "
            "pointed in opposite directions."
        ),
        "tier": "A",
        "source_id": "cs_two_measures",
    },
    {
        "dq_id": "cq02",
        "geography": "US",
        "topic": "The 2021 NIBRS transition broke comparability",
        "issue": (
            "The FBI retired its Summary Reporting System in favour of NIBRS for 2021. "
            "Agency participation collapsed: NIBRS covered 65.7% of the US population "
            "in 2021, against 96.2% in 2025. Major departments including the NYPD, LAPD "
            "and San Francisco PD did not submit 2021 data. The FBI's own language is "
            "that 'traditional methodologies could not be applied', and that the 2021 "
            "estimated trends are 'not considered statistically significant'."
        ),
        "effect": (
            "Comparisons that span 2021 — including most 'crime since the pandemic' "
            "reporting — often compare two different collection systems rather than two "
            "years of crime."
        ),
        "tier": "A",
        "source_id": "cs_nibrs_2021",
    },
    {
        "dq_id": "cq03",
        "geography": "US",
        "topic": "FBI figures are revised, and the vintage changes the answer",
        "issue": (
            "The same year carries different values depending on which annual report it "
            "is read from. 2019 murders were first published as 16,425 and revised to "
            "16,669 — and the FBI's own headline '+29.4% in 2020' is calculated against "
            "the revised base. 2020 has both a 21,570 SRS-based estimate and a 22,000 "
            "NIBRS-based estimate for the same year. The 2024 rate was published as 5.0 "
            "and revised to 5.1."
        ),
        "effect": (
            "Mixing vintages on one chart produces changes that are artefacts of "
            "publication rather than of crime. Every row in this dataset records its "
            "vintage for that reason."
        ),
        "tier": "A",
        "source_id": "cs_cius2020",
    },
    {
        "dq_id": "cq04",
        "geography": "US",
        "topic": "FBI and CDC homicide counts do not match, and should not",
        "issue": (
            "The FBI counts murder and nonnegligent manslaughter as offences known to "
            "police. CDC/NCHS counts deaths certified as homicide, including those the "
            "FBI classifies as justifiable and those never cleared as an offence. The "
            "CDC rate is also age-adjusted; the FBI rate is crude."
        ),
        "effect": (
            "The two series run in parallel with a persistent gap. Neither is an error "
            "in the other. Quoting one as a correction of the other is the error."
        ),
        "tier": "A",
        "source_id": "cs_nchs_db526",
    },
    {
        "dq_id": "cq05",
        "geography": "US",
        "topic": "Clearance is not conviction, and the series is sparse",
        "issue": (
            "A homicide is 'cleared' when closed by arrest or by exceptional means — "
            "which includes cases where the suspect died or could not be extradited. It "
            "is not a conviction rate and not a 'solve rate', though it is reported as "
            "both. A continuous year-by-year national series could not be assembled "
            "from fetchable sources; what is recorded here is selected years."
        ),
        "effect": (
            "The long decline from 93% in 1962 to the low 50s in 2022 is well "
            "documented, but the intervening shape is reconstructed from scattered "
            "years, not a published annual series."
        ),
        "tier": "A",
        "source_id": "cs_cook_mancik",
    },
    {
        "dq_id": "cq06",
        "geography": "US",
        "topic": "Only about half of violent victimisations reach police records",
        "issue": (
            "Approximately 48% of violent victimisations were reported to police in "
            "2024. Police-recorded crime can therefore fall while victimisation rises, "
            "with no contradiction between the two."
        ),
        "effect": (
            "Police-recorded series measure reported crime and the propensity to "
            "report, combined. They cannot separate the two."
        ),
        "tier": "A",
        "source_id": "cs_ncvs_cv24",
    },
    {
        "dq_id": "cq07",
        "geography": "US",
        "topic": "The 2021 NCVS baseline was collected under pandemic conditions",
        "issue": (
            "NCVS violent victimisation reads 16.5 per 1,000 in 2021 and 23.5 in 2022. "
            "Some of that step is likely collection: 2020 and 2021 fieldwork was "
            "disrupted, and the survey's own documentation cautions on comparability "
            "across that period."
        ),
        "effect": (
            "A 2021-to-2024 percentage change overstates the rise by an unknown amount. "
            "This dataset does not publish that percentage as a headline for that reason."
        ),
        "tier": "B",
        "source_id": "cs_ncvs_cv24",
    },
    {
        "dq_id": "cq09",
        "geography": "US",
        "topic": "2026 figures are partial-year and city-sample, not national",
        "issue": (
            "There is no national 2026 crime statistic yet — the FBI publishes annually "
            "and released final 2025 data on 14 August 2026. What exists for 2026 is a "
            "36-city half-year comparison and a 566-agency index covering about 119 "
            "million people, roughly a third of the country. Both are samples of larger "
            "urban agencies, which are not representative of national crime."
        ),
        "effect": (
            "2026 figures are shown as a stated percentage change over a stated period "
            "and sample, never as a point on the annual chart. A partial year plotted on "
            "an annual series reads as a completed year and would be wrong."
        ),
        "tier": "A",
        "source_id": "cs_ccj_2026",
    },
    {
        "dq_id": "cq08",
        "geography": "US",
        "topic": "Two recent FBI counts could not be verified",
        "issue": (
            "Murder counts for 2022 and 2023 are absent here. The FBI's 2022 release "
            "publishes only a percentage change; the 2023 release and the 2023 CDE "
            "summary were unreachable when this dataset was assembled. The 2025 count "
            "is secondary — the FBI published the rate (4.1) but not the count."
        ),
        "effect": (
            "The count series has two gaps. The rate series, which is what the charts "
            "use, is complete."
        ),
        "tier": "A",
        "source_id": "cs_fbi2022",
    },
]

TRENDS = [
    {
        "topic": "homicide_2020_spike",
        "statement": (
            "US murder rose 29.4% in 2020 — the largest single-year increase the FBI has "
            "recorded. CDC vital statistics show the same event independently: the "
            "age-adjusted homicide death rate went from 6.0 to 7.8 per 100,000."
        ),
        "tier": "A",
        "source_id": "cs_fbi2020",
    },
    {
        "topic": "homicide_reversal",
        "statement": (
            "The spike has fully reversed on the police measure. The FBI's final 2025 "
            "data records murder down 18.1% and violent crime down 9.3% year-over-year — "
            "the largest year-to-year violent-crime decline since FBI estimation began "
            "in 1936 — at a murder rate of 4.1 per 100,000, tied with 1955 and 1956 for "
            "the lowest ever recorded and below the 2019 pre-pandemic rate of 5.0."
        ),
        "tier": "A",
        "source_id": "cs_fbi2025",
    },
    {
        "topic": "two_measures_diverge",
        "statement": (
            "The victimisation survey does not show the same recovery. NCVS violent "
            "victimisation was 23.3 per 1,000 persons age 12+ in 2024 against 16.5 in "
            "2021, and has stayed near that level since 2022, while NIBRS-estimated "
            "police-recorded violent crime fluctuated only between 3.7 and 4.0 per 1,000 "
            "across 2015-2024. About 48% of violent victimisations were reported to "
            "police in 2024."
        ),
        "tier": "A",
        "source_id": "cs_two_measures",
    },
    {
        "topic": "ytd_2026",
        "statement": (
            "2026 so far continues the fall. Across 36 large cities, homicide in the first "
            "half of 2026 was 18% below the first half of 2025 — 215 fewer deaths — with "
            "carjacking down 47%, motor vehicle theft down 20% and robbery down 17%. The "
            "Real-Time Crime Index, a separate sample of 566 agencies covering about 119 "
            "million people, independently records murder down 18.7% through April. Nine "
            "of thirteen offences fell. Two rose: domestic violence by 8% and sexual "
            "assault by 3%."
        ),
        "tier": "A",
        "source_id": "cs_ccj_2026",
    },
    {
        "topic": "clearance_decline",
        "statement": (
            "The share of homicides cleared by arrest or exceptional means fell from 93% "
            "in 1962 to 64% by 1994, reached 61.4% in 2019, dropped sharply to 54% in "
            "2020 and to a reported low of 52.3% in 2022, recovering to 61.4% in 2024. "
            "Roughly four in ten US homicides are not cleared."
        ),
        "tier": "B",
        "source_id": "cs_cook_mancik",
    },
]

VERDICT = {
    "claim": "Is crime in the United States rising or falling after the pandemic?",
    "summary": (
        "Both answers are defensible, and which one you get depends entirely on which "
        "measurement system you use. There was a real and large increase: murder rose "
        "29.4% in 2020, the largest single-year rise the FBI has recorded, and CDC death "
        "certificates register the same event independently. On the police measure that "
        "increase has now fully reversed — the FBI's final 2025 data shows the largest "
        "year-to-year violent-crime decline since 1936, and a murder rate of 4.1 per "
        "100,000 that is below the pre-pandemic level and tied for the lowest ever "
        "recorded. But the survey that asks people directly whether they were victimised "
        "shows violent victimisation higher in 2024 than in 2021 and holding near that "
        "level, while police-recorded violent crime barely moved across the same decade. "
        "Only about half of violent victimisations are reported to police at all, which "
        "is how both things can be true at once. The gap between the two measures is not "
        "a flaw in the data. On this record it is the most substantial finding."
    ),
    "key_figures": [
        {"figure": "Murder rose 29.4% in 2020 — the largest single-year increase the FBI has recorded", "tier": "A", "source_id": "cs_fbi2020"},
        {"figure": "2025 murder rate 4.1 per 100,000 — tied with 1955-56 for the lowest ever recorded", "tier": "A", "source_id": "cs_fbi2025"},
        {"figure": "Violent crime down 9.3% in 2025 — largest year-to-year decline since FBI estimation began in 1936", "tier": "A", "source_id": "cs_fbi2025"},
        {"figure": "NCVS violent victimisation 23.3 per 1,000 in 2024, against 16.5 in 2021", "tier": "A", "source_id": "cs_ncvs_cv24"},
        {"figure": "Police-recorded violent crime moved only between 3.7 and 4.0 per 1,000 across 2015-2024", "tier": "A", "source_id": "cs_two_measures"},
        {"figure": "About 48% of violent victimisations were reported to police in 2024", "tier": "A", "source_id": "cs_ncvs_cv24"},
        {"figure": "NIBRS covered 65.7% of the US population in 2021, against 96.2% in 2025", "tier": "A", "source_id": "cs_nibrs_2021"},
    ],
}

CAVEATS = [
    {"workstream": "W1", "caveat": "FBI and CDC homicide series count different things and are never reconciled here. The gap between them is expected.", "tier": "A"},
    {"workstream": "W1", "caveat": "Every FBI row records its publication vintage. Do not compare a first-published figure with a revised one.", "tier": "A"},
    {"workstream": "W1", "caveat": "Murder counts for 2022 and 2023 could not be verified against a fetched source and are absent rather than estimated.", "tier": "A"},
    {"workstream": "W1", "caveat": "The 2025 murder count is secondary; the FBI published the rate but not the count. The rate is Tier A.", "tier": "B"},
    {"workstream": "W1", "caveat": "Clearance figures are selected years, not a continuous published annual series.", "tier": "A"},
    {"workstream": "W9", "caveat": "The 2021 data year is the weakest in the modern record on both measures — NIBRS participation collapsed and NCVS fieldwork was disrupted. Treat any percentage change anchored on 2021 with suspicion.", "tier": "A"},
    {"workstream": "W9", "caveat": "This dataset does not corroborate the Government Cloud dataset or the journal, and neither corroborates it.", "tier": "A"},
]

# Additional sources for figures researched directly rather than via the series pull.
EXTRA_SOURCES = YTD_SOURCES + [
    {"source_id": "cs_ncvs_cv24", "url": "https://bjs.ojp.gov/document/cv24.pdf",
     "publisher": "Bureau of Justice Statistics", "title": "Criminal Victimization, 2024",
     "evidence_tier": "A", "accessed": "2026-08-20", "archived_url": None},
    {"source_id": "cs_two_measures", "url": "https://bjs.ojp.gov/library/publications/nations-two-crime-measures-2015-2024",
     "publisher": "Bureau of Justice Statistics", "title": "The Nation's Two Crime Measures, 2015-2024",
     "evidence_tier": "A", "accessed": "2026-08-20", "archived_url": None},
]

# Map the register/trend source_ids onto real researched URLs.
SOURCE_ALIASES = {
    "cs_fbi2025": "fbi.gov/news/press-releases/fbi-releases-2025",
    "cs_fbi2024": "fbi-releases-2024-reported-crimes",
    "cs_fbi2020": "ucr.fbi.gov",
    "cs_fbi2022": "fbi-releases-2022",
    "cs_nibrs_2021": "nibrs",
    # The vintage-revision evidence: FBI 2020 release (which states the 29.4% against
    # the revised 2019 base) plus the CIUS 2019 table the first-published figure came from.
    "cs_cius2020": "crime-in-the-u.s/2019/crime-in-the-u.s.-2019/topic-p",
    "cs_nchs_db526": "db526",
    "cs_cook_mancik": "clearance",
}



def preserve(path, chart, keys=("themes", "accuracy_note", "change_view", "answer")):
    """Carry hand-authored keys forward across a rebuild.

    These chart docs gained `themes` (the plain-language block under every
    chart) after their builders were written, so a rebuild deleted them and
    the page lost its summaries. Caught 2026-08-22 by the roundtrip suite.
    Anything the builder itself sets wins; anything only on disk is kept.
    """
    import json as _json
    p = pathlib.Path(path)
    if not p.exists():
        return chart
    try:
        old = _json.loads(p.read_text())
    except Exception:
        return chart
    for k in keys:
        if k in old and k not in chart:
            chart[k] = old[k]
    return chart

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    CHARTS.mkdir(parents=True, exist_ok=True)

    rows = json.loads(_research("crime_rows.json").read_text())
    raw_srcs = json.loads(_research("crime_srcs.json").read_text())

    # ---- sources: stable ids, url-keyed -----------------------------------
    sources, by_url = [], {}
    for i, s in enumerate(sorted(raw_srcs, key=lambda x: x["url"]), start=1):
        sid = f"cs{i:03d}"
        rec = {
            "source_id": sid, "url": s["url"], "publisher": s.get("publisher"),
            "title": s.get("title"), "evidence_tier": s.get("evidence_tier"),
            "accessed": s.get("accessed_date", "2026-08-20"), "archived_url": None,
        }
        sources.append(rec)
        by_url[s["url"]] = sid
    for e in EXTRA_SOURCES:
        if e["url"] not in by_url:
            sources.append(e)
            by_url[e["url"]] = e["source_id"]

    def resolve(alias):
        """Register source_ids are written as readable aliases; bind to a real id."""
        if alias in by_url.values():
            return alias
        needle = SOURCE_ALIASES.get(alias, "")
        for url, sid in by_url.items():
            if needle and needle.lower() in url.lower():
                return sid
        return None

    # ---- indicators --------------------------------------------------------
    indicators = []
    dropped_null = dropped_stmt = 0
    for r in rows:
        ind = r.get("indicator_id")
        if ind in NON_SERIES:
            dropped_stmt += 1
            continue
        if r.get("value") is None or r.get("year") is None:
            dropped_null += 1
            continue
        indicators.append({
            "indicator_id": ind,
            "geography": "US",
            "year": r["year"],
            "value": r["value"],
            "unit": r.get("unit", ""),
            "tier": r.get("tier", "C"),
            "publisher": r.get("publisher"),
            "source_id": by_url.get(r.get("source_url", "")),
            "workstream": "W1",
            "note": r.get("note", "") or "",
        })
    for y in YTD_2026:
        rec = dict(y)
        rec.update({"geography": "US", "workstream": "W1-YTD"})
        indicators.append(rec)
    indicators.sort(key=lambda r: (r["indicator_id"], r["year"]))

    unresolved = [r for r in indicators if not r["source_id"]]
    if unresolved:
        print(f"  ! {len(unresolved)} indicator rows have no source_id match")

    # ---- registers, with aliases bound ------------------------------------
    def bind(recs):
        out = []
        for rec in recs:
            rec = dict(rec)
            if rec.get("source_id"):
                rec["source_id"] = resolve(rec["source_id"]) or rec["source_id"]
            out.append(rec)
        return out

    dq = bind(DATA_QUALITY)
    tr = bind(TRENDS)
    vd = dict(VERDICT)
    vd["key_figures"] = bind(VERDICT["key_figures"])

    # ---- landing chart: FBI vs CDC homicide rate --------------------------
    def series(ind):
        """Points carry their tier so the chart can dot the un-vetted years —
        the same convention the Public Health charts use for a weaker basis."""
        return [{"year": r["year"], "value": r["value"], "tier": r["tier"],
                 "note": r.get("note", "")}
                for r in indicators if r["indicator_id"] == ind]

    fbi, cdc = series("fbi_murder_rate"), series("cdc_homicide_rate_aa")
    chart = {
        "title": "US homicide, two official measures",
        "unit": "Deaths per 100,000 people per year",
        "note": (
            "The FBI counts murder and nonnegligent manslaughter known to police, as a "
            "crude rate. The CDC counts deaths certified as homicide, age-adjusted. The "
            "gap between them is expected: they count different things. Neither series "
            "corrects the other. Dotted segments mark years that are not Tier A — read "
            "from a published chart rather than stated in a report, or resting on a "
            "collection the publisher itself flagged."
        ),
        "publisher": "FBI; CDC/NCHS",
        "tier": "A",
        "series": [
            {"name": "FBI — murder known to police", "emphasis": True,
             "basis_short": "crude rate, offences known to police",
             "publisher": "FBI (UCR/NIBRS)", "tier": "A", "points": fbi,
             "caveats": [
                 "Vintages differ between annual reports; see the data-quality register.",
                 "2021 and 2023 are drawn dotted: both were read from a published chart "
                 "rather than stated in report text, and 2021 additionally rests on a "
                 "collection the FBI flagged as not statistically significant (NIBRS "
                 "covered 65.7% of the population that year).",
             ]},
            {"name": "CDC — homicide deaths", "emphasis": False,
             "basis_short": "age-adjusted rate, death certificates",
             "publisher": "CDC/NCHS", "tier": "A", "points": cdc,
             "caveats": [
                 "Includes deaths the FBI classifies as justifiable homicide.",
                 "Age-adjusted to the US 2000 standard population.",
                 "Sampled at ten-year intervals before 2003 and annually after. Points are "
                 "marked on the chart so the sampling is visible; the line between two "
                 "decadal points is drawn to connect them, not to assert the years between.",
             ]},
        ],
        "markers": [
            {"year": 2020, "label": "Murder +29.4% — largest single-year rise on record"},
            {"year": 2021, "label": "NIBRS transition: 65.7% population coverage"},
            {"year": 2025, "label": "Rate 4.1 — tied for lowest ever recorded"},
        ],
    }

    # ---- write -------------------------------------------------------------
    def save(name, data, folder=OUT):
        (folder / name).write_text(json.dumps(data, indent=2) + "\n")

    def merge_save(name, data, key):
        """Keep rows this script does not own.

        This script was the FIRST crime builder and wrote these four files
        wholesale, which was correct when it was the only writer. It is now one
        of seven, and several of the others add rows here — plus the arrests and
        detention material, which has no builder of its own and lives only in
        these files. A wholesale write destroyed 36 sources, 42 indicator rows
        and two data-quality rows (cq10, cq11) the moment every builder was run
        in sequence. Caught 2026-08-22 by re-running the whole pipeline; the
        same clobber previously ate sw02 and nc07 in build_crime_lanes.py.

        Rows this script produces are replaced by key; everything else is kept
        in place, so running any subset of builders in any order is safe.
        """
        path = OUT / name
        existing = json.loads(path.read_text()) if path.exists() else []
        mine = {r[key] for r in data if key in r}
        kept = [r for r in existing if r.get(key) not in mine]

        # Sticky fields are filled OUT OF BAND, by something that is not a
        # builder — archived_url comes from scripts/wayback_sweep.py, which
        # takes hours to run against the Internet Archive. This script rebuilds
        # its own rows from research/ and would hand every one of them back with
        # archived_url: None, silently erasing the entire sweep on the next
        # pipeline run. Eight of the nine builders only append sources they do
        # not already have and never touch the field; this one replaces by key,
        # so this is the single place the loss could happen.
        prior = {r.get(key): r for r in existing}
        for row in data:
            was = prior.get(row.get(key))
            if not was:
                continue
            for field in ("archived_url", "archived_at", "local_copy"):
                if not (row.get(field) or "") and (was.get(field) or ""):
                    row[field] = was[field]

        save(name, data + kept)

    merge_save("crime_indicators.json", indicators, "indicator_id")
    merge_save("crime_sources.json", sources, "source_id")
    merge_save("crime_data_quality.json", dq, "dq_id")
    merge_save("crime_trends.json", tr, "topic")
    save("crime_verdict.json", vd)
    save("crime_caveats.json", CAVEATS)
    save("homicide_two_measures.json", preserve(CHARTS / "homicide_two_measures.json", chart), CHARTS)

    tiers = Counter(r["tier"] for r in indicators)
    stiers = Counter(s["evidence_tier"] for s in sources)
    print(f"indicators : {len(indicators)} rows  {dict(tiers)}")
    print(f"             dropped {dropped_null} unverified, {dropped_stmt} statements")
    print(f"sources    : {len(sources)}  {dict(stiers)}")
    print(f"data quality: {len(dq)} | trends: {len(tr)} | caveats: {len(CAVEATS)}")
    print(f"chart      : FBI {len(fbi)} pts ({fbi[0]['year']}-{fbi[-1]['year']}), "
          f"CDC {len(cdc)} pts ({cdc[0]['year']}-{cdc[-1]['year']})")


if __name__ == "__main__":
    main()

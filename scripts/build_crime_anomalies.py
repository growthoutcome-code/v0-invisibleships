#!/usr/bin/env python3
"""
Reports of the unexplained: four records, four different things.

Sean, 2026-08-22: "find any increase in reported missing persons, home invasion
and reported anomalies e.g. hauntings or hallucinations. Ideally this is one
chart with concise laymans terms summaries."

One chart, yes. But not the chart the request implies, because the research
does not support it and building it anyway would undo the discipline the rest
of the section is built on. What the record actually holds:

  * MISSING PERSONS — counted, and FALLING. NCIC records entered are at their
    modern low.
  * HOME INVASION — not counted anywhere as an offence. Established in detail
    in nc08; there is no lane to draw.
  * HALLUCINATIONS — one real series exists, in England, and it ends in 2014.
    The United States has no federal survey that asks the question at all.
  * HAUNTINGS — measured only as BELIEF. Gallup has asked Americans whether
    they believe in ghosts since 1990 and has essentially never asked whether
    they have seen one. Pew asked the experience question twice, thirteen
    years apart, and has since declared its own two readings incomparable
    because it moved from telephone to online.
  * UAP — the one category an official body counts, and its own reports say
    the rise is partly reduced stigma and partly the FAA beginning to forward
    reports weekly. It is a picture of a reporting office being built.

So the chart draws what exists, indexed to direction only, and the absences are
carried at equal weight in the summaries and the register. That is the honest
artefact here, and it is a stronger one than a rising line would have been.

MERGE, never clobber. Idempotent.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_T = ROOT / "public/data/crime/tables"
CRIME_C = ROOT / "public/data/crime/charts"

ACCESSED = "2026-08-22"

SOURCES = [
    {"source_id": "an_apms_trends", "publisher": "Schizophrenia Research (Shoham, Cooper, Lewis, Bebbington, McManus)",
     "title": "Temporal trends in psychotic symptoms: repeated cross-sectional surveys of the population in England 2000–14",
     "url": "https://openaccess.city.ac.uk/id/eprint/25570/8/APMS%20Psychotic%20Symptoms%20Temporal%20trends%206.8.20.pdf",
     "evidence_tier": "A"},
    {"source_id": "an_apms_2324", "publisher": "NHS England / Adult Psychiatric Morbidity Survey",
     "title": "Survey of Mental Health and Wellbeing, England 2023/24 — psychotic disorder chapter (the PSQ screen-positive rate is no longer reported as an outcome)",
     "url": "https://digital.nhs.uk/data-and-information/publications/statistical/adult-psychiatric-morbidity-survey/survey-of-mental-health-and-wellbeing-england-2023-24/psychotic-disorder",
     "evidence_tier": "A"},
    {"source_id": "an_psq", "publisher": "Bebbington & Nayani",
     "title": "Psychosis Screening Questionnaire — the instrument, unchanged across APMS waves",
     "url": "https://nccred.org.au/uploads/documents/Psychosis-screening-questionnaire.pdf",
     "evidence_tier": "A"},
    {"source_id": "an_chapman_2018", "publisher": "Chapman University Survey of American Fears",
     "title": "Paranormal America 2018 — 'Places can be haunted by spirits'",
     "url": "http://blogs.chapman.edu/wilkinson/2018/10/16/paranormal-america-2018/",
     "evidence_tier": "B"},
    {"source_id": "an_chapman_2021", "publisher": "Chapman University Survey of American Fears",
     "title": "Wave 7, fielded 5–15 January 2021 — the last paranormal battery published",
     "url": "https://blogs.chapman.edu/wilkinson/2021/10/14/government-corruption-fear-for-loved-ones-civil-unrest-top/",
     "evidence_tier": "B"},
    {"source_id": "an_gallup_2025", "publisher": "Gallup",
     "title": "Paranormal phenomena met with skepticism (fieldwork 1–18 May 2025) — 'largely unchanged' since 2001",
     "url": "https://news.gallup.com/poll/692738/paranormal-phenomena-met-skepticism.aspx",
     "evidence_tier": "B"},
    {"source_id": "an_gallup_2005", "publisher": "Gallup",
     "title": "Three in four Americans believe in the paranormal (1990, 2001, 2005 series)",
     "url": "https://news.gallup.com/poll/16915/three-four-americans-believe-paranormal.aspx",
     "evidence_tier": "B"},
    {"source_id": "an_pew_mode", "publisher": "Pew Research Center",
     "title": "Spiritual experiences (2023) — Pew states its telephone-era and online-era readings may not be comparable",
     "url": "https://www.pewresearch.org/religion/2023/12/07/spiritual-experiences/",
     "evidence_tier": "A"},
    {"source_id": "an_yougov_2025", "publisher": "YouGov",
     "title": "Most Americans say they have experienced at least one paranormal event (Oct 2025) — 60%, down from 67% in 2022",
     "url": "https://yougov.com/en-us/articles/53258-most-americans-say-they-have-experienced-at-least-one-paranormal-event",
     "evidence_tier": "B"},
    {"source_id": "an_aaro_fy25", "publisher": "All-domain Anomaly Resolution Office (AARO)",
     "title": "FY2025 Consolidated Annual Report on UAP",
     "url": "https://www.aaro.mil/Portals/136/PDFs/FY25%20UAP%20Annual%20Report/AARO_FY2025_Consolidated_Annual_Report_on_UAP.pdf",
     "evidence_tier": "A"},
    {"source_id": "an_aaro_fy24", "publisher": "All-domain Anomaly Resolution Office (AARO)",
     "title": "FY2024 Consolidated Annual Report on UAP — records the FAA now reporting weekly",
     "url": "https://media.defense.gov/2024/Nov/14/2003583603/-1/-1/0/FY24-CONSOLIDATED-ANNUAL-REPORT-ON-UAP-508.PDF",
     "evidence_tier": "A"},
    {"source_id": "an_odni_2022", "publisher": "Office of the Director of National Intelligence",
     "title": "2022 Annual Report on UAP — attributes the increase partly to 'reduced stigma surrounding UAP reporting'",
     "url": "https://archive.dni.gov/files/ODNI/documents/assessments/Unclassified-2022-Annual-Report-UAP.pdf",
     "evidence_tier": "A"},
    {"source_id": "an_nsduh_methods", "publisher": "SAMHSA / NCBI",
     "title": "NSDUH instrument comparison — no hallucination or voice-hearing items in the questions asked of all respondents",
     "url": "https://www.ncbi.nlm.nih.gov/books/NBK390286/",
     "evidence_tier": "A"},
    {"source_id": "an_sapien_2025", "publisher": "Sapien Labs, Global Mind Project",
     "title": "Global Mind Health in 2025 — an anonymous annual instrument whose 47 items include 'Hallucinations' and 'Sense of being detached from reality'",
     "url": "https://sapienlabs.org/wp-content/uploads/2026/02/Global-Mind-Health-in-2025-Report.pdf",
     "evidence_tier": "C"},
    {"source_id": "an_yrbs_trend", "publisher": "CDC, Youth Risk Behavior Survey",
     "title": "YRBS Data Summary & Trends Report 2013–2023 — anonymous, in-school, unchanged wording",
     "url": "https://www.cdc.gov/yrbs/dstr/pdf/YRBS-2023-Data-Summary-Trend-Report.pdf",
     "evidence_tier": "A"},
]

# ------------------------------------------------------------- the lanes ---
# England, Adult Psychiatric Morbidity Survey, % screening positive for at
# least one psychotic symptom cluster in the past year (PSQ, identical
# instrument across waves).
PSQ = {2000: 5.6, 2007: 5.9, 2014: 6.8}

# Chapman: "Places can be haunted by spirits" — agreement. BELIEF, not
# experience. The 2019 wave exists but published only subgroup figures, so it
# is a genuine gap rather than a smoothing opportunity.
HAUNTED = {2016: 46.6, 2017: 52.3, 2018: 57.7, 2021: 52.7}

# AARO / ODNI: reports RECEIVED, in period. The 2021 figure covers seventeen
# years and is excluded from the lane for that reason — see the caveats.
UAP = {2022: 247, 2023: 291, 2024: 757, 2025: 319}

# Gallup, % who believe ghosts exist. Four points across 35 years.
GHOSTS = {2001: 38, 2005: 32, 2025: 39}

ROWS = []


def row(ind, year, value, unit, sid, note="", tier="A", geo="US", publisher=""):
    ROWS.append({
        "indicator_id": ind, "geography": geo, "year": year, "value": value,
        "unit": unit, "tier": tier, "publisher": publisher, "source_id": sid,
        "workstream": "W2", "note": note,
    })


for y, v in PSQ.items():
    row("apms_psychotic_symptoms_pct", y, v,
        "percent of adults screening positive for a psychotic symptom in the past year",
        "an_apms_trends",
        "Adjusted odds ratio 2014 against 2000: 1.20 (95% CI 1.02–1.40, p=0.026). "
        "The same study found antipsychotic prescribing roughly doubled over the period "
        "and raises measurement and medicalisation as partial explanations."
        if y == 2014 else "",
        geo="England", publisher="Adult Psychiatric Morbidity Survey")
for y, v in HAUNTED.items():
    row("chapman_places_haunted_pct", y, v, "percent agreeing 'places can be haunted by spirits'",
        "an_chapman_2021" if y == 2021 else "an_chapman_2018",
        "Fielded 5–15 January 2021. No paranormal battery has been published since."
        if y == 2021 else "", tier="B", publisher="Chapman University Survey of American Fears")
for y, v in UAP.items():
    row("aaro_uap_reports_received", y, v, "UAP reports received by AARO in the reporting period",
        "an_aaro_fy25" if y == 2025 else ("an_aaro_fy24" if y == 2024 else "an_odni_2022"),
        "Includes 272 back-reports of events from 2021–2022; 485 were in-period."
        if y == 2024 else ("Includes 35 reports of events outside the period." if y == 2025 else ""),
        publisher="AARO / ODNI")
for y, v in GHOSTS.items():
    row("gallup_believe_ghosts_pct", y, v, "percent who believe ghosts exist",
        "an_gallup_2025" if y == 2025 else "an_gallup_2005",
        "Gallup's own summary: beliefs are 'largely unchanged' against 2001. The haunted-houses "
        "and ESP items were dropped from the 2025 battery." if y == 2025 else "",
        tier="B", publisher="Gallup")

LANE_CAVEATS = {
    "ncic_missing_person_records_entered": [
        "Counts RECORDS, not people: one person can generate more than one, and a record "
        "is cancelled when a case closes for any reason — cancellation does not mean found "
        "alive.",
        "Adults are not subject to the same mandatory-entry rules as juveniles, so adult "
        "cases are under-entered by an unknown margin.",
    ],
    "apms_psychotic_symptoms_pct": [
        "ENGLAND ONLY, ages 16–74. There is no equivalent United States series: no federal "
        "survey asks all respondents about hallucinations or voice-hearing at all.",
        "THE QUESTION STOPPED BEING PUBLISHED. The 2023/24 survey still uses the screening "
        "instrument but no longer reports the screen-positive rate as an outcome, so the "
        "series ends in 2014 and cannot be extended.",
        "Response rate fell from just under 70% in 2000 to 57% in 2007 and 2014. On a "
        "question about a stigmatised experience, that is a live confounder.",
        "The published figure is 'any psychotic symptom', which folds hallucinations in "
        "with paranoia and thought interference. No item-level breakdown is published, so "
        "hallucinations cannot be separated out.",
    ],
    "chapman_places_haunted_pct": [
        "THIS IS BELIEF, NOT EXPERIENCE. The item is agreement with the statement 'places "
        "can be haunted by spirits'. It measures what people think is possible, not what "
        "has happened to them.",
        "The 2019 wave exists but published only subgroup figures, so 2019 is a genuine "
        "gap rather than a smoothed line.",
        "Online panel. No paranormal results have been published since the January 2021 "
        "wave, though the survey itself continues.",
    ],
    "aaro_uap_reports_received": [
        "THIS IS AN INTAKE COUNT, NOT A RATE. The reporting periods are 18 months, 8 "
        "months, 13 months and 12 months — unequal, and not aligned to calendar years. The "
        "2021 figure of 144 covers SEVENTEEN years and is excluded from this lane for that "
        "reason.",
        "The counts mix in-period events with back-reports of older ones: 272 of the 757 in "
        "the FY2024 report were events from 2021–2022.",
        "AARO AND ODNI ATTRIBUTE THE RISE TO REPORTING, NOT TO EVENTS. ODNI records it as "
        "'partially due to reduced stigma surrounding UAP reporting'; AARO records that the "
        "FAA began forwarding reports weekly, 'a significant increase from the previous "
        "reporting period'. This lane is a picture of a reporting office being built.",
        "AARO also records a collection bias favouring the continental United States and US "
        "military operational areas, and diagnosed one of its own prior-year distributions "
        "as an artefact of a batch of FAA paperwork.",
    ],
}

LANES = [
    ("ncic_missing_person_records_entered", "Missing-person records", "NCIC records entered per year", "FBI NCIC", True),
    ("apms_psychotic_symptoms_pct", "Psychotic symptoms (England)", "adults screening positive in the past year", "APMS", True),
    ("chapman_places_haunted_pct", "Belief that places can be haunted", "percent agreeing, US adults", "Chapman University", False),
    ("aaro_uap_reports_received", "UAP reports received", "reports received by AARO per reporting period", "AARO / ODNI", False),
]

NOT_COUNTED = [
    {
        "nc_id": "nc11",
        "category": "Anomalous EXPERIENCE, as opposed to belief",
        "status": "Asked twice in thirty years, and the two readings have been declared incomparable",
        "detail": (
            "Polling organisations have asked Americans whether they BELIEVE in ghosts every "
            "few years since 1990. They have almost never asked whether they have SEEN one. "
            "Gallup's paranormal battery — the longest-running series of its kind — contains "
            "no personal-experience question at all, in thirty-five years. Pew is the one "
            "body that asked properly and repeatedly: the share of Americans reporting they "
            "had been in the presence of a ghost went from 9% in 1996 to 18% in 2009, and "
            "the share who had felt in touch with someone who had died from 18% to 29%. Pew "
            "has since closed that door itself. Its 2023 study moved from telephone to an "
            "online panel, and Pew states that because the earlier surveys were conducted by "
            "telephone 'it is not clear whether those earlier results can be directly "
            "compared with the new estimates'. The organisation best placed to say whether "
            "anomalous experience is becoming more common says it cannot. YouGov's two "
            "readings of a 13-item experience battery — 67% in October 2022, 60% in October "
            "2025 — are the only recent repeat, and two points are not a trend."
        ),
        "who_would_collect": (
            "Any of the major survey organisations, by adding an experience question to a "
            "belief battery they already run. Gallup has had the opportunity annually since "
            "1990."
        ),
        "tier": "A",
        "source_id": "an_pew_mode",
    },
    {
        "nc_id": "nc12",
        "category": "Hallucinations, in the United States",
        "status": "No federal survey asks the question",
        "detail": (
            "The instruments the National Survey on Drug Use and Health administers to every "
            "respondent are a psychological-distress scale, a functional-impairment scale, a "
            "depression module and suicidality items. None contains a hallucination or "
            "voice-hearing question. Psychosis appears only through clinical interviews in a "
            "validation subsample, which produces no published prevalence series. So the "
            "one real repeated measurement of psychotic experience in the English-speaking "
            "world is English: the Adult Psychiatric Morbidity Survey found 5.6% of adults "
            "screening positive in 2000, 5.9% in 2007 and 6.8% in 2014 — and then stopped "
            "reporting that figure as an outcome. The only large repeated instrument that "
            "scores hallucinations anonymously and annually is a private one, the Global "
            "Mind Project, whose respondents are recruited through Meta and Google "
            "advertising and whose only representativeness assessment was written by its "
            "own staff. It is recorded here as an existence proof, not as a population "
            "estimate."
        ),
        "who_would_collect": (
            "SAMHSA, by adding an item to NSDUH's self-administered section — the part "
            "respondents answer to a machine rather than to an interviewer, which is where "
            "a stigmatised question belongs."
        ),
        "tier": "A",
        "source_id": "an_nsduh_methods",
    },
]

DATA_QUALITY = [
    {
        "dq_id": "cq20", "geography": "US",
        "topic": "Removing the interviewer does not produce agreement",
        "issue": (
            "Three anonymous or self-administered instruments measured young Americans over "
            "the same years and moved in three directions. Adolescent major depressive "
            "episode in NSDUH, answered to a machine, fell from 20.8% (2021) to 15.4% "
            "(2024). Persistent sadness or hopelessness in the Youth Risk Behavior Survey, "
            "anonymous and in-school, sat at 40–42%. Frequent suicidal ideation among young "
            "people using Mental Health America's anonymous online screening rose from 48% "
            "to 51%."
        ),
        "effect": (
            "Anonymity is often treated as the fix for stigma on sensitive questions. These "
            "three instruments are all anonymous or self-administered and they disagree, so "
            "anonymity is not sufficient on its own — sampling, recruitment and question "
            "wording still dominate. Any single 'anonymous index' cited as the true picture "
            "should be read against this."
        ),
        "tier": "A", "source_id": "an_yrbs_trend",
    },
    {
        "dq_id": "cq21", "geography": "International",
        "topic": "A rise in reports is not a rise in events",
        "issue": (
            "The federal UAP office's report counts rose from 247 to 757 and then fell to "
            "319. Its own publications attribute the rise to reporting rather than to "
            "phenomena: ODNI records it as 'partially due to reduced stigma surrounding UAP "
            "reporting', and AARO records that the FAA began forwarding reports weekly, "
            "which it calls 'a significant increase from the previous reporting period'. "
            "The reporting periods are also 18, 8, 13 and 12 months long, and each count "
            "mixes in-period events with back-reports of older ones."
        ),
        "effect": (
            "This is the clearest case on the site of a curve that measures an institution "
            "rather than the world. It is drawn because it is the only official count of "
            "anomalous reports that exists — and it is labelled as intake, with the "
            "publisher's own explanation attached, rather than presented as a rate."
        ),
        "tier": "A", "source_id": "an_odni_2022",
    },
]

TRENDS = [
    {"topic": "anomalies_what_is_counted",
     "statement": (
         "Of the things people report when something is wrong, missing persons are counted "
         "and falling — NCIC records entered are at their modern low. Home invasion is not "
         "counted anywhere. Hallucinations are measured once a decade in England and not at "
         "all by any United States federal survey. Hauntings are measured as belief rather "
         "than experience: Gallup has asked Americans whether they believe in ghosts since "
         "1990 and has never asked whether they have seen one."
     ), "tier": "A", "source_id": "an_pew_mode"},
    {"topic": "anomalies_reporting_not_events",
     "statement": (
         "The only official count of anomalous reports that exists — the federal UAP "
         "office's — rose from 247 to 757 and then fell to 319, across reporting periods of "
         "18, 8, 13 and 12 months. The office attributes the rise to reduced stigma and to "
         "the FAA beginning to forward reports weekly. It measures a reporting system, not "
         "a phenomenon."
     ), "tier": "A", "source_id": "an_aaro_fy24"},
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
    pool = kept + ROWS
    save(CRIME_T / "crime_indicators.json", pool)

    series = []
    for ind_id, name, counts, publisher, emphasis in LANES:
        pts = sorted([r for r in pool if r["indicator_id"] == ind_id and r.get("value") is not None],
                     key=lambda r: r["year"])
        pts = [p for p in pts if 1999 <= p["year"] <= 2025]
        if len(pts) < 2:
            print(f"  ! {ind_id}: {len(pts)} points, skipped")
            continue
        base = pts[0]["value"]
        series.append({
            "name": name, "counts": counts, "publisher": publisher, "emphasis": emphasis,
            "base_year": pts[0]["year"], "base_value": base,
            "unit_raw": pts[0].get("unit", ""), "tier": pts[0].get("tier", "A"),
            "basis_short": f"{counts}; indexed to {pts[0]['year']} = 100",
            "points": [{"year": p["year"], "value": round(p["value"] / base * 100, 1),
                        "raw": p["value"], "tier": p.get("tier", "A")} for p in pts],
            "caveats": LANE_CAVEATS.get(ind_id, []),
        })

    chart = {
        "title": "Reports of the unexplained, indexed",
        "unit": "Each lane indexed to its own first year = 100 — direction only, never size",
        "themes": [
            {"statement": "Missing-person records are at their modern low, about a fifth below "
                          "2014. Whether that is fewer people going missing or fewer records "
                          "being entered cannot be separated.", "tier": "A"},
            {"statement": "Home invasion has no lane here, because no country counts it as an "
                          "offence. It is filed as burglary, and burglary has fallen almost "
                          "everywhere for twenty years.", "tier": "A"},
            {"statement": "In England, adults reporting a psychotic symptom in the past year "
                          "went from 5.6% to 6.8% between 2000 and 2014 — and then the survey "
                          "stopped publishing that figure. No United States federal survey asks "
                          "the question at all.", "tier": "A"},
            {"statement": "The haunting line is BELIEF, not experience. Gallup has asked "
                          "Americans whether they believe in ghosts since 1990 and has never "
                          "asked whether they have seen one; Pew asked the experience question "
                          "twice and then declared its own two readings incomparable after it "
                          "moved from telephone to online.", "tier": "A"},
            {"statement": "Reports to the federal UAP office rose sharply and then fell — and "
                          "the office attributes the rise to reduced stigma and to the FAA "
                          "beginning to forward reports weekly. It is a picture of a reporting "
                          "system being built, not of the sky changing.", "tier": "A"},
            {"statement": "Four lanes, four different things: records entered, symptoms "
                          "reported, beliefs held, reports received. They are drawn together "
                          "because each is what exists — not because any one of them "
                          "corroborates another. Nothing here establishes a relationship "
                          "between them.", "tier": "A"},
        ],
        "note": (
            "Four different things — records entered, symptoms reported, beliefs held, "
            "reports received — indexed to direction only. Click any lane for its raw "
            "figures and what it cannot show; every one carries a serious limitation, and "
            "the UAP lane carries its publisher's own statement that the rise is about "
            "reporting."
        ),
        "publisher": "FBI NCIC; Adult Psychiatric Morbidity Survey; Chapman University; AARO / ODNI",
        "tier": "A",
        "indexed": True,
        "series": series,
    }
    save(CRIME_C / "anomalies_indexed.json", chart)

    n_nc = merge(CRIME_T / "crime_not_counted.json", NOT_COUNTED, "nc_id")
    n_dq = merge(CRIME_T / "crime_data_quality.json", DATA_QUALITY, "dq_id")
    n_tr = merge(CRIME_T / "crime_trends.json", TRENDS, "topic", keep_order=True)

    print(f"sources    : +{added} (total {len(sources)})")
    print(f"indicators : +{len(ROWS)} anomaly rows (total {len(pool)})")
    print(f"chart      : anomalies_indexed.json — {len(series)} lanes")
    for s in series:
        last = s["points"][-1]
        print(f"    {s['name']:<34} {s['base_year']}={s['base_value']:>9} -> "
              f"{last['year']} index {last['value']:>6}  ({len(s['points'])} pts)")
    print(f"not counted: {n_nc} rows (nc11, nc12 added)")
    print(f"data qual. : {n_dq} rows (cq20, cq21 added)")
    print(f"trends     : {n_tr} rows")


if __name__ == "__main__":
    main()

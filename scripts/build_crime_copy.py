#!/usr/bin/env python3
"""
The plain-language layer for Data/Crime — one owner, one standard.

Sean, 2026-08-22: "the crime page leads with charts and provides a concise and
laymans terms summary for the data in each chart."

Before this script the summaries lived inside whichever builder happened to
produce each chart, and one chart — arrests — had no builder at all, so its copy
was patched by a helper bolted onto the incarceration script. The result drifted:
statements ran from 12 to 90 words, and the 90-word one was three separate
findings sharing a sentence.

THE STANDARD, enforced below by MAX_WORDS:

  * One idea per statement.
  * Under 35 words.
  * A sentence a reader could repeat to someone else without looking anything up.
  * Numbers stay — they are the point — but one or two per statement, not five.
  * A statement carrying three findings becomes three statements.

Nothing sourced is lost when a statement splits; detail that will not fit belongs
in the chart's detail panel, where it already lives.

This runs LAST in the pipeline, after every chart exists, and overwrites the
themes each builder wrote. Idempotent.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_C = ROOT / "public/data/crime/charts"
CRIME_T = ROOT / "public/data/crime/tables"

MAX_WORDS = 35

A, B = "A", "B"


def t(tier, statement):
    return {"statement": statement, "tier": tier}


THEMES = {
    # ------------------------------------------------ the opening chart ---
    "harm_lanes_indexed.json": [
        t(A, "Overdose deaths quadrupled since 1999 — the steepest rise of any lane — "
             "and have fallen since their 2022 peak."),
        # Sean, 2026-08-24: keep the lane, but say what it is. A drug-poisoning
        # death is a cause of death, not an offence, and without this line its
        # presence in a crime chart reads as crime by adjacency — the exact
        # inference the disclaimer spends a section warning readers away from.
        t(A, "But an overdose death is a health outcome, not an offence — nobody was "
             "charged. It is here as harm; Public Health carries the record."),
        t(A, "Homicide spiked 29.4% in 2020, then fell to the lowest rate ever recorded."),
        t(A, "Defamation-adjacent federal filings are at a 22-year high, rising sharply "
             "since 2023."),
        t(A, "Missing-person entries are at their modern low. Whether that is fewer cases "
             "or less entering cannot be separated."),
        t(A, "Break-ins have fallen further than any other lane — 53% from 2000 to 2019, "
             "and 26% more from 2020 to 2024 on the basis that replaced it."),
        t(A, "Part of that is fewer reports, not fewer break-ins: 40.7% of victimisations "
             "reached the police in 2024, against 58.8% in 2010."),
        t(A, "Two categories this site cares about have no lane at all — harassment, "
             "because nobody counts it, and home invasion, because it is not an offence "
             "anyone records."),
    ],
    # ------------------------------------------------------- homicide ----
    "homicide_two_measures.json": [
        t(A, "Two official bodies count US homicide and they never agree. The FBI counts "
             "what police record; the CDC counts what death certificates say."),
        t(A, "The gap between them is normal, not an error."),
        t(A, "Murder jumped 29.4% in 2020, the biggest one-year rise ever recorded. Both "
             "counts show it, independently."),
        t(A, "It has now fully reversed. In 2025 the murder rate hit 4.1 per 100,000 — "
             "tied for the lowest ever recorded, and lower than before the pandemic."),
    ],
    "homicide_international.json": [
        t(A, "The United States is several times deadlier than comparable countries."),
        t(A, "In 2023 it was 5.8 per 100,000, against the UK's 1.1, Germany's 0.9, South "
             "Korea's 0.5 and Japan's 0.2."),
        t(A, "The 2020 spike was an American event. The world line barely moved through "
             "the same years."),
        t(B, "Russia fell furthest, from about 30 per 100,000 to under 7. Its series stops "
             "in 2021, and researchers dispute how much of that fall is real."),
        t(A, "Breaks in a line are years the source does not publish. They are left as "
             "breaks rather than joined up."),
    ],
    # -------------------------------------------------------- break-ins --
    "burglary_international.json": [
        t(A, "Four of the five countries are below where they started in 2008. The "
             "Netherlands fell furthest — 79% below its 2009 peak."),
        t(A, "Italy is the exception: 44% above its 2020 trough and still climbing."),
        t(A, "Germany has also risen 44% since its 2021 low, though it remains half its "
             "2015 peak."),
        t(A, "Sweden records 3.4 times Germany's rate on the same code. That gap is mostly "
             "the code: Sweden counts cellars and attic storage, Germany does not."),
        t(A, "Across the EU, residential burglary is 38% below 2014 — but 12% above its "
             "2021 low."),
        t(A, "No line on this chart is a count of home invasions. No country here "
             "publishes one."),
        t(A, "There is no global line to draw. UNODC has withdrawn burglary as a "
             "retrievable indicator from its own portal."),
        t(A, "Its dashboards redirect and the legacy spreadsheet returns 404, checked 21 "
             "August 2026. These European figures survive only because Eurostat publishes "
             "the same collection."),
    ],
    # --------------------------------------------------------- arrests ---
    "arrests_over_time.json": [
        t(A, "Criminal arrests peaked in 1997 at 15.3 million. 2024, at 7.5 million, is "
             "51% below that."),
        t(A, "Yes, 15.3 million is real — but an arrest is an event, not a person. One "
             "person arrested three times counts three times."),
        t(A, "Most arrests never become imprisonment: 7.5 million criminal arrests a year "
             "sit alongside 7.9 million jail admissions."),
        t(A, "On any given day 657,500 people are in jail — 69% not yet convicted — and "
             "1.25 million are in prison."),
        t(A, "Is the system overcrowded? The federal government stopped counting in 2016."),
        t(A, "That year the US stood at 114% of its lowest reported prison capacity, with "
             "26 states over 100%. No edition since carries the table."),
        t(A, "Jails run the other way — 73% of rated capacity in 2023 — though 12% of "
             "individual jurisdictions were over their own."),
        t(A, "The strain the record does show is in immigration detention: above 70,000 "
             "held in January 2026, against 41,500 funded beds."),
        t(B, "Civil immigration arrests are the near-floor line, and that is the point. "
             "Even its FY2011 peak of 322,093 is about 2–3% of criminal arrest volume."),
        t(B, "It ends at FY2024 because no official 2025–26 total exists. The surge is "
             "documented only through FOIA'd records."),
        t(B, "Of 33 federal defendants charged with non-immigration crimes in Chicago's "
             "Operation Midway Blitz, 25 were cleared, against 2 guilty pleas."),
    ],
    # ---------------------------------------------------- incarceration --
    "incarceration_over_time.json": [
        t(A, "American imprisonment peaked in 2009 and fell for twelve years — 1,615,487 "
             "people down to 1,205,087, a quarter of the whole system."),
        t(A, "It is rising again: up 2.1% in 2022 and 2.0% in 2023, about 49,000 people "
             "over two years."),
        t(A, "The record then stops. BJS has published nothing for 2024 or 2025, and "
             "'Prisoners in 2024' is listed as forthcoming."),
        t(A, "This is the second chart here whose official series ends just before the "
             "years it is most often asked about. The arrests chart does the same."),
        t(A, "Seventy percent of people in American jails have not been convicted of "
             "anything."),
        t(A, "From 2013 to 2023 the convicted jail population fell 29% while the "
             "unconvicted rose 3%. The system changed who it holds more than it shrank."),
        t(A, "Most people under correctional control are not behind anything — probation "
             "and parole are 68% of the widest line."),
        t(A, "Its fall after 2021 is partly a change in what was counted, not in what "
             "happened."),
        t(A, "Immigration detention is a different system, and this chart shows it. ICE "
             "detainees inside the jail count numbered 7,000 in 2023, about 1%."),
    ],
    "detention_capacity.json": [
        t(A, "Detention has a shape: a V, then a spike. A 50,165 average in FY2019, down "
             "61% to 19,461 in FY2021, back to 37,721 by FY2024."),
        t(A, "Then the 2025–26 surge, which is visible only in single-day counts."),
        t(A, "Is it overcrowded? The funded ceiling is the answer. Congress funds 41,500 "
             "beds for FY2026 — 'thousands fewer than the current level', in the bill's "
             "own words."),
        t(A, "Single-day counts ran 65,000 to 73,000, because $45 billion arrived outside "
             "the annual bed line in July 2025."),
        t(B, "National utilisation hides local overcrowding. On 13 April 2025 the system "
             "sat at 76% of contracted beds, yet 45 of 181 facilities were over their own "
             "contract that night."),
        t(B, "Most people held have no criminal conviction — 70.6% on 11 July 2026 — and "
             "92% of FY2026's growth was people with none."),
        t(A, "The average daily population line stops at FY2024 because no later average "
             "has been published. That gap is drawn as a gap."),
    ],
    # -------------------------------------------------------- anomalies --
    "anomalies_indexed.json": [
        t(A, "Missing-person records are at their modern low, about a fifth below 2014."),
        t(A, "Whether that is fewer people going missing or fewer records being entered "
             "cannot be separated."),
        t(A, "Home invasion has no lane here, because no country counts it as an offence. "
             "It is filed as burglary, and burglary has fallen for twenty years."),
        t(A, "In England, adults reporting a psychotic symptom in the past year went from "
             "5.6% to 6.8% between 2000 and 2014. Then the survey stopped publishing it."),
        t(A, "No United States federal survey asks about hallucinations at all."),
        t(A, "The haunting line measures belief, not experience — what people think is "
             "possible, not what has happened to them."),
        t(A, "Gallup has asked Americans whether they believe in ghosts since 1990, and "
             "has never once asked whether they have seen one."),
        t(A, "Pew asked the experience question twice, then declared its own two readings "
             "incomparable after moving from telephone to online."),
        t(A, "Reports to the federal UAP office rose sharply, then fell."),
        t(A, "The office attributes the rise to reduced stigma and to the FAA starting to "
             "forward reports weekly — a reporting system being built, not the sky "
             "changing."),
        t(A, "Four lanes, four different things: records entered, symptoms reported, "
             "beliefs held, reports received."),
        t(A, "They are drawn together because each is what exists — not because any one "
             "corroborates another. Nothing here establishes a relationship."),
    ],
}

# --------------------------------------------------------------- verdict ---
# Rewritten because it was doing the harm chart's job. The old summary
# enumerated four lanes — overdoses, homicide, defamation, missing persons —
# which are exactly the first four rows of that chart's own summary block, a
# screen away. The reader met the same four findings twice before seeing a line
# drawn. This answers the QUESTION instead, and leaves the lanes to the chart.
VERDICT_SUMMARY = (
    "Split the question in two, because the record can answer one half and not the "
    "other.\n\n"
    "Has crime increased? Not as one number. The chart above shows six lanes moving in "
    "different directions at once — one quadrupled, one is at a record low, one is at a "
    "22-year high — and the two categories this site cares about most, harassment and "
    "home invasion, have no lane at all because nobody counts them. Even the official "
    "measures disagree with each other right now: the survey of victims reports more "
    "violence in 2024 than 2021 while police records report less.\n\n"
    "Is there a relationship between any of this and the procurement and legislation "
    "record elsewhere on this site? This dataset cannot establish one, and does not "
    "claim to. The master timeline runs both as parallel lanes so they can be read "
    "against each other — but two things happening in the same years is a "
    "co-occurrence, and neither record corroborates the other. Where the counting "
    "itself changed mid-window, as NIBRS did in 2021, the crime series does not even "
    "agree with itself."
)


def load(p):
    return json.loads(pathlib.Path(p).read_text())


def save(p, d):
    pathlib.Path(p).write_text(json.dumps(d, indent=2) + "\n")


def main():
    problems = []
    written = 0

    for name, themes in THEMES.items():
        path = CRIME_C / name
        if not path.exists():
            problems.append(f"{name}: chart missing")
            continue
        for i, th in enumerate(themes):
            n = len(th["statement"].split())
            if n > MAX_WORDS:
                problems.append(
                    f"{name} [{i}]: {n} words, ceiling is {MAX_WORDS}\n"
                    f"      {th['statement'][:90]}…"
                )
        chart = load(path)
        chart["themes"] = themes
        save(path, chart)
        written += 1

    vpath = CRIME_T / "crime_verdict.json"
    verdict = load(vpath)
    verdict["claim"] = "Is crime rising or falling?"
    verdict["summary"] = VERDICT_SUMMARY
    save(vpath, verdict)

    if problems:
        print("FAILED — the copy standard is one idea per statement, under "
              f"{MAX_WORDS} words:\n", file=sys.stderr)
        for p in problems:
            print("  " + p, file=sys.stderr)
        raise SystemExit(1)

    counts = {n: len(v) for n, v in THEMES.items()}
    total = sum(counts.values())
    longest = max(
        (len(th["statement"].split()), n)
        for n, v in THEMES.items() for th in v
    )
    print(f"charts   : {written} rewritten")
    print(f"summaries: {total} statements, longest {longest[0]}w in {longest[1]}")
    for n, c in sorted(counts.items()):
        print(f"    {n.replace('.json',''):<30} {c}")
    print("verdict  : reframed as 'Is crime rising or falling?' — no longer "
          "restates the harm chart's lanes")


if __name__ == "__main__":
    main()

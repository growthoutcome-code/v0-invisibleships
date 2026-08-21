#!/usr/bin/env python3
"""
Add the five Public Health concepts to lib/concepts.ts.

Every figure below was re-verified against the shipped tables on 2026-08-21
before being written (scripts run: see the session log). Each concept is
appended as its own commit so any one can be reverted alone — the July
rollback taught that lesson.

`--only <id>` writes a single concept, which is how the separate commits are
produced. Re-running with an id that is already present replaces it, so the
script is idempotent.
"""
import argparse
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "lib/concepts.ts"

CONCEPTS = {
# ---------------------------------------------------------------------------
"us-rose-against-the-trend": '''  {
    id: "us-rose-against-the-trend",
    origin: "ai",
    basis: "documented",
    title: "The world's suicide rate fell. The United States' rose.",
    body:
      "Between 2000 and 2021, on the one basis that allows countries to be compared at all, the world's suicide rate fell 27%. Most countries fell with it — Russia by 60%, China by 42%, Israel by 36%, Japan by 28%, India by 21%. Over the same years the United States rose 40%, in a steady climb rather than a spike. It is not alone in rising: South Korea rose further, and the UK, Australia and the West Bank & Gaza were effectively flat. But among large wealthy countries the American direction is the outlier, and the gap is not small — 67 percentage points between the US and the world it is usually compared to.",
    evidence: [
      "WHO age-standardised estimates, 2000–2021, world standard population: World −27.0%",
      "United States +39.9% · South Korea +82.8% · UK +12.2% · Australia +1.9%",
      "Russia −59.7% · China −42.2% · Israel −36.0% · Japan −27.7% · India −21.2%",
      "14 series on one comparable basis; national extensions to 2025 held separately",
    ],
    questions: [
      "Why the US direction diverges is not answered here. The claims register records who has attributed it to what, and those attributions contradict each other.",
      "South Korea rose more but peaked around 2011 and has fallen since. A single percentage across 21 years hides the shape of a curve.",
    ],
    references: [{ label: "The suicide comparison chart", href: "/data" }],
    referencesNote:
      "The chart carries the per-country method, caveats and source behind each line.",
  },''',
# ---------------------------------------------------------------------------
"low-number-may-mean-low-counting": '''  {
    id: "low-number-may-mean-low-counting",
    origin: "ai",
    basis: "documented",
    title: "The numbers under the numbers",
    body:
      "A country reporting few suicides may have few suicides, or may not be counting them. The West Bank & Gaza record 0.65 deaths per 100,000 — which would be the lowest rate on earth by a wide margin, and much more plausibly measures a fragmented registration system in a region where the death is heavily stigmatised. Russia's falling rate runs alongside a rising share of deaths filed as \\u201Cundetermined intent\\u201D. India's official figures are police reports; verbal-autopsy studies find substantially more. In at least 24 countries suicide or its attempt is a criminal matter, which suppresses both help-seeking and recording. WHO's own position is that most member states lack vital registration good enough for this purpose, and that roughly one suicide in six goes missing worldwide — one in three in lower-income countries. The register that documents this is not a footnote to the chart. It is the finding: a low number is sometimes a fact about a country, and sometimes a fact about its filing.",
    evidence: [
      "15 rows in the data-quality register, each naming a mechanism and a source",
      "Russia: rising 'undetermined intent' share masks suicides",
      "India: police-reported NCRB figures against verbal-autopsy and GBD estimates",
      "UK deliberately INCLUDES undetermined-intent deaths — the opposite convention",
      "≥24 countries criminalise suicide or attempts; ~1 in 6 missing globally",
    ],
    questions: [
      "The register cannot say how much of any single country's trend is real and how much is recording. It documents that both are present.",
    ],
    references: [{ label: "How much the numbers can be trusted", href: "/data" }],
    referencesNote: "The data-quality register lists every mechanism with its source.",
  },''',
# ---------------------------------------------------------------------------
"prescribing-is-not-prevalence": '''  {
    id: "prescribing-is-not-prevalence",
    origin: "ai",
    basis: "documented",
    title: "Prescribing is not a measure of illness",
    body:
      "It is tempting to read prescription volume as a thermometer for how ill a population is. The record does not support that, in either direction. In England, antidepressant items rose 50% in nine years while hypnotic and anxiolytic items FELL 16% over exactly the same period, from the same prescribers under the same system. In the United States, antipsychotic use among adults rose from 1.9% to 3.0%, while among children and adolescents it fell, 1.3% to 1.1%. And where a national registry lets diagnosis be counted directly, Denmark's new schizophrenia diagnoses went slightly down, 1.8 to 1.6 per 10,000, across eighteen years in which antipsychotic prescribing rose almost everywhere it was measured. Prescribing moves for its own reasons — guidance, capacity, recognition, duration of treatment, the licensing of new drugs, deliberate deprescribing campaigns. Sometimes it tracks illness. Here it demonstrably moves in opposite directions at once.",
    evidence: [
      "England FY2015/16 → FY2024/25: antidepressants 61.9M → 92.6M items (+50%)",
      "Same period, opposite direction: hypnotics/anxiolytics 15.9M → 13.4M (−16%)",
      "US 2006 → 2023: antipsychotic use, adults 1.9% → 3.0%; youth 1.3% → 1.1%",
      "Denmark 2000 → 2018: new schizophrenia diagnoses 1.8 → 1.6 per 10,000",
    ],
    questions: [
      "Diagnosed depression in US adults did rise over a shorter window — 13.5% to 17.8% currently diagnosed, 2017–2023, self-reported. Whether that is more illness, more recognition, or more willingness to say so is not settled by this data.",
    ],
    references: [{ label: "The prescribing and diagnosis series", href: "/data" }],
    referencesNote:
      "Every figure above is a row in the Public Health indicator table, with its source.",
  },''',
# ---------------------------------------------------------------------------
"the-fentanyl-reversal": '''  {
    id: "the-fentanyl-reversal",
    origin: "ai",
    basis: "documented",
    title: "The fentanyl reversal",
    body:
      "American overdose deaths went from 16,849 in 1999 to 107,941 in 2022 — more than six times as many in twenty-three years, with the steepest acceleration after illicit fentanyl entered the supply in 2013, and the single largest one-year rise in 2020. Then it turned: down 26.2% in 2024, the largest one-year fall on record, and lower again in 2025. Both directions belong in the record, and the reversal is the more unusual event — this is a curve that had only ever gone one way. But it runs down from a peak that did not exist a generation ago. Provisional 2025 is still roughly four times the 1999 count. A chart that began at the peak would show only the good news; a chart that stopped at the peak would show only the bad.",
    evidence: [
      "CDC/NCHS 1999–2024 final, 2025 provisional: 16,849 → 107,941 (2022 peak) → 69,973",
      "2020: +30.0% on 2019, the largest single-year rise in the series",
      "2024: −26.2%, the largest percentage fall across 2014–2024",
      "CDC attributes the decline to naloxone distribution, treatment access, supply shifts and renewed prevention — recorded as an attribution, not adopted as a finding",
    ],
    questions: [
      "The 2025 figure is provisional and will revise upward. Measured against CDC's provisional 2024 estimate the fall is almost 14%; against the final 2024 count, about 11.9%. Both are published; they compare different vintages of the same year.",
    ],
    references: [{ label: "The overdose series", href: "/data" }],
    referencesNote: "The chart draws the full 1999–2025 record, rise and fall together.",
  },''',
# ---------------------------------------------------------------------------
"co-occurrence-is-not-cause": '''  {
    id: "co-occurrence-is-not-cause",
    origin: "author",
    basis: "structural",
    title: "Next to each other is not because of each other",
    body:
      "This site puts a procurement record and a public-health record on one clock. That is a deliberate choice and a dangerous one, because a timeline is very good at implying something it cannot show. Two things happening in the same year is a co-occurrence. It is not evidence that one caused the other, and no amount of caption underneath undoes what a picture asserts. So the two datasets are kept structurally apart. They do not corroborate each other and the site says so wherever they appear together. The overlaps register states, for every row, what that row does NOT show. Vertical markers for contracts and statutes were proposed for the suicide chart and deliberately left off — the only overlay it carries is the COVID-19 timeline, because that is a global health event with a documented literature on mental health, and even that is a toggle. The discipline costs something. It makes the work less immediately persuasive. That is the trade being made on purpose.",
    evidence: [
      "12 rows in the overlaps register, each carrying an explicit non-causal note",
      "Public Health and Government Cloud datasets declared non-corroborating on both pages",
      "Suicide chart carries COVID markers only; procurement and legislation markers declined",
      "Master timeline runs Legislation, Deploy/enforcement, Health and Crime as PARALLEL lanes",
    ],
    questions: [
      "Nothing here argues the datasets are unrelated. It argues that this record cannot establish a relation, and that showing them together is not an argument that one exists.",
    ],
    references: [{ label: "The overlaps register", href: "/data" }],
    referencesNote:
      "Each row states the structural observation and, separately, what it does not establish.",
  },''',
}

ORDER = list(CONCEPTS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="write just this concept id")
    args = ap.parse_args()

    ids = [args.only] if args.only else ORDER
    src = TARGET.read_text()

    for cid in ids:
        if cid not in CONCEPTS:
            raise SystemExit(f"unknown concept: {cid}")
        block = CONCEPTS[cid]
        # replace if already present, otherwise append before the closing bracket
        pat = re.compile(r"  \{\n    id: \"" + re.escape(cid) + r"\",.*?\n  \},\n", re.S)
        if pat.search(src):
            src = pat.sub(block + "\n", src, count=1)
            action = "replaced"
        else:
            m = re.search(r"\n\];\s*$", src)
            if not m:
                raise SystemExit("could not find the CONCEPTS array terminator '];'")
            src = src[:m.start()] + "\n" + block + "\n];\n"
            action = "appended"
        print(f"  {action}: {cid}")

    TARGET.write_text(src)
    n = len(re.findall(r"^    id: ", src, re.M))
    print(f"lib/concepts.ts now holds {n} concepts")


if __name__ == "__main__":
    main()

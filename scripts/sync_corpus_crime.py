#!/usr/bin/env python3
"""
Add / refresh the `crime/` folder inside the downloadable corpus.

Same contract as sync_corpus_health.py: every count in the manifest and README
is recomputed from the live tables, so the corpus copy cannot drift from the
site. Run after any change under public/data/crime/.
"""
import csv
import io
import json
import pathlib
import shutil
import zipfile
from collections import Counter
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
TABLES = ROOT / "public/data/crime/tables"
CHARTS = ROOT / "public/data/crime/charts"
ZIP = ROOT / "public/invisible-ships-corpus.zip"
PREFIX = "crime/"

TABLE_FILES = [
    "crime_indicators.json",
    "crime_data_quality.json",
    "crime_trends.json",
    "crime_verdict.json",
    "crime_caveats.json",
    "crime_sources.json",
    "crime_not_counted.json",
    "crime_sweeps.json",
    "crime_milestones.json",
    "crime_transnational.json",
    "crime_intl_drug_deaths.json",
    "crime_intl_missing.json",
    "crime_accomplishments.json",
    "crime_intl_incarceration.json",
]

DESCRIPTIONS = {
    "crime_not_counted.json": "The uncounted categories — what has no national statistic, and who would have to collect it",
    "crime_sweeps.json": "Sweeping enforcement actions and the capacity question — what headline arrest counts actually count",
    "crime_milestones.json": "Dated events behind the master timeline's Crime lane (track G)",
    "crime_transnational.json": "Transnational repression — what it is (FBI definition and tactic list) and how it is measured, if at all",
    "crime_intl_drug_deaths.json": "Drug deaths internationally — five incompatible ways of counting; the definition column is the point",
    "crime_intl_missing.json": "Missing persons internationally — no shared unit exists; each country's figure in its own unit",
    "crime_intl_incarceration.json": "Incarceration internationally \u2014 a DATED table, never a chart: the source itself says the figures do not relate to the same date",
    "crime_accomplishments.json": "Law enforcement accomplishments — agency-attributed claims with corroboration, outcome vs activity marked",
    "crime_indicators.json": "Time-series rows: indicator, year, value, unit, tier, source_id, vintage note",
    "crime_data_quality.json": "Counting, coverage and definitional problems — the spine of this dataset",
    "crime_trends.json": "Sourced trend statements",
    "crime_verdict.json": "The headline question and its answer, with key figures",
    "crime_caveats.json": "Read before quoting any figure",
    "crime_sources.json": "source_id → URL, publisher, tier, access date",
}


def rowcount(p):
    d = json.loads(p.read_text())
    return len(d) if isinstance(d, list) else None


def homicide_csv(indicators):
    """Both official series side by side, wide — the shape the chart draws."""
    fbi = {r["year"]: r["value"] for r in indicators if r["indicator_id"] == "fbi_murder_rate"}
    cdc = {r["year"]: r["value"] for r in indicators if r["indicator_id"] == "cdc_homicide_rate_aa"}
    cnt = {r["year"]: r["value"] for r in indicators if r["indicator_id"] == "fbi_murder_count"}
    years = sorted(set(fbi) | set(cdc))
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["year", "fbi_murder_rate_per_100k", "fbi_murder_count",
                "cdc_homicide_rate_age_adjusted_per_100k"])
    for y in years:
        w.writerow([y, fbi.get(y, ""), cnt.get(y, ""), cdc.get(y, "")])
    return buf.getvalue(), len(years)


def check():
    """Rebuild into a temp file and compare the crime/ entries with the committed
    zip. Exits non-zero on drift. Nothing is written to public/.
    """
    import shutil as _shutil, tempfile as _tempfile
    if not ZIP.exists():
        print("FAIL: no corpus zip at " + str(ZIP))
        return 1
    with _tempfile.TemporaryDirectory() as tmp:
        keep = pathlib.Path(tmp) / "committed.zip"
        _shutil.copy2(ZIP, keep)
        before = {}
        with zipfile.ZipFile(keep) as z:
            for n in z.namelist():
                if n.startswith(PREFIX):
                    before[n] = z.read(n)
        main(quiet=True)
        after = {}
        with zipfile.ZipFile(ZIP) as z:
            for n in z.namelist():
                if n.startswith(PREFIX):
                    after[n] = z.read(n)
        _shutil.copy2(keep, ZIP)  # restore, so --check never mutates the tree

    missing = sorted(set(before) - set(after))
    added = sorted(set(after) - set(before))
    # the manifest carries a build date, so it differs on every rebuild by design
    changed = sorted(n for n in set(before) & set(after)
                     if before[n] != after[n] and not n.endswith("manifest.json"))
    if missing or added or changed:
        print("FAIL: the committed corpus is out of date. Run:  python3 scripts/sync_corpus_crime.py")
        for n in added:
            print("   only in a fresh build: " + n)
        for n in missing:
            print("   only in the committed zip: " + n)
        for n in changed:
            print("   contents differ: " + n)
        return 1
    print(f"corpus is current — {len(after)} crime/ entries match a fresh build")
    return 0


def main(quiet=False):
    if not ZIP.exists():
        raise SystemExit(f"corpus zip not found at {ZIP}")

    indicators = json.loads((TABLES / "crime_indicators.json").read_text())
    sources = json.loads((TABLES / "crime_sources.json").read_text())
    tiers = Counter(s.get("evidence_tier") for s in sources)
    tier_line = " · ".join(f"{tiers[t]} Tier {t}" for t in ("A", "B", "C") if tiers.get(t))
    counts = {f: rowcount(TABLES / f) for f in TABLE_FILES}

    chart_path = CHARTS / "homicide_two_measures.json"
    chart = json.loads(chart_path.read_text())
    series_desc = "; ".join(
        f"{s['name']} ({s['points'][0]['year']}-{s['points'][-1]['year']}, {len(s['points'])} pts, {s['basis_short']})"
        for s in chart["series"]
    )

    hom_csv, hom_years = homicide_csv(indicators)
    ind_ids = sorted({r["indicator_id"] for r in indicators})

    manifest = {
        "name": "Invisible Ships — US Crime",
        "generated": date.today().isoformat(),
        "scope": "United States only. No international comparison set.",
        "method_note": (
            "Built around a measurement problem rather than a number. US crime is counted "
            "by three systems that disagree — police-recorded (FBI UCR/NIBRS), "
            "victimisation survey (BJS NCVS) and death certificates (CDC/NCHS). All are "
            "correct; none is 'the' crime rate. The two homicide series are carried side "
            "by side and never reconciled. Causes are reported as attributed, never "
            "asserted. This dataset does not corroborate the Government Cloud dataset or "
            "the journal, and neither corroborates it."
        ),
        "tier_legend": {
            "A": "documented — official statistical agency or peer-reviewed source fetched and read",
            "B": "corroborated — reputable secondary corroboration, provisional or modelled official data",
            "C": "claimed — could not be verified against a fetched source",
        },
        "tables": {k: v for k, v in counts.items() if v is not None},
        "indicators": ind_ids,
        "charts": {
            "homicide_two_measures.json": series_desc,
            "homicide_us.csv": f"Both series wide, {hom_years} years, one row per year",
        },
    }

    tbl = "\n".join(
        f"| {f} | {counts[f] if counts[f] is not None else '—'} | {DESCRIPTIONS[f]} |"
        for f in TABLE_FILES
    )
    readme = f"""# US Crime — site-produced dataset

Compiled for the Data section of invisibleships.com. **Site-produced, not part of the
source-document manifest** — like `government-cloud/` and `public-health/`, this folder
is research output, not journal material, and it does not corroborate (and is not
corroborated by) anything else in this corpus.

Regenerated {date.today().isoformat()} by `scripts/sync_corpus_crime.py`, which recomputes
every count below from the live data files.

**Scope: the United States only.**

## Start here

`IS_CRIME_00_start-here.md` — what this research is, what it found, and questions
worth asking it. Then the briefs: one Markdown file per chart and per register,
each self-contained and safe to hand to an assistant on its own. Row data is in
`csv/`. The `.json` files hold the same content for code.


## The measurement problem

This dataset exists because "is US crime rising?" has more than one defensible answer.
Three systems count it and they disagree:

- **FBI UCR/NIBRS** — offences known to police. Fell sharply through 2025.
- **BJS NCVS** — crimes people report experiencing when surveyed, including those never
  reported to police. Higher in 2024 than 2021 and holding.
- **CDC/NCHS** — deaths certified as homicide, age-adjusted. Independent of policing.

About 48% of violent victimisations were reported to police in 2024, which is how the
police measure can fall while the survey measure does not. The gap between the measures
is the finding, not an error to resolve.

Two further traps are documented in `crime_data_quality.json`: the 2021 NIBRS transition
(participation fell to 65.7% population coverage, and the FBI's own language is that the
2021 trends are "not considered statistically significant"), and FBI vintage revisions
(the same year carries different values in different annual reports).

## Files

| File | Rows | Contents |
| --- | --- | --- |
{tbl}
| manifest.json | — | Table counts, tier legend, method note |
| charts/homicide_two_measures.json | {len(chart['series'])} series | {series_desc} |
| charts/homicide_us.csv | {hom_years} | Both series wide, one row per year |

Source register: {tier_line}.

## Reading the homicide chart

The CDC series is sampled at ten-year intervals before 2003 and annually after. Points
are marked on the chart so the sampling is visible — the line between two decadal points
connects them, it does not assert the years between. The FBI series is annual throughout
1960–2025.

Murder counts for 2022 and 2023 are absent rather than estimated: they could not be
verified against a fetched source. The rate series is complete.
"""

    tmp = ZIP.with_suffix(".zip.tmp")
    with zipfile.ZipFile(ZIP, "r") as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        carried = 0
        for item in src.infolist():
            if item.filename.startswith(PREFIX):
                continue
            dst.writestr(item, src.read(item.filename))
            carried += 1
        for f in TABLE_FILES:
            dst.writestr(PREFIX + f, (TABLES / f).read_text())
        dst.writestr(PREFIX + "manifest.json", json.dumps(manifest, indent=1) + "\n")
        dst.writestr(PREFIX + "README-crime.md", readme)
        dst.writestr(PREFIX + "charts/homicide_two_measures.json", chart_path.read_text())
        lanes_path = CHARTS / "harm_lanes_indexed.json"
        if lanes_path.exists():
            dst.writestr(PREFIX + "charts/harm_lanes_indexed.json", lanes_path.read_text())
        intl_path = CHARTS / "homicide_international.json"
        if intl_path.exists():
            dst.writestr(PREFIX + "charts/homicide_international.json", intl_path.read_text())
        ar_path = CHARTS / "arrests_over_time.json"
        if ar_path.exists():
            dst.writestr(PREFIX + "charts/arrests_over_time.json", ar_path.read_text())
        det_path = CHARTS / "detention_capacity.json"
        if det_path.exists():
            dst.writestr(PREFIX + "charts/detention_capacity.json", det_path.read_text())
        bg_path = CHARTS / "burglary_international.json"
        if bg_path.exists():
            dst.writestr(PREFIX + "charts/burglary_international.json", bg_path.read_text())
        inc_path = CHARTS / "incarceration_over_time.json"
        if inc_path.exists():
            dst.writestr(PREFIX + "charts/incarceration_over_time.json", inc_path.read_text())
        an_path = CHARTS / "anomalies_indexed.json"
        if an_path.exists():
            dst.writestr(PREFIX + "charts/anomalies_indexed.json", an_path.read_text())
        dst.writestr(PREFIX + "charts/homicide_us.csv", hom_csv)

        # ---- the Markdown the corpus exists for -----------------------------
        # The corpus README has always said each file should be "a self-contained
        # chunk ... unambiguous when shared individually with an AI assistant."
        # The journal, references and glossary follow that. Crime shipped 23 JSON
        # files and a README — parseable, but a model handed it reads the SHAPE of
        # the data while the findings stay buried as strings inside arrays.
        # build_corpus_md.py assembles them into prose from the same tables the
        # site renders, so they cannot drift from what is published.
        md_dir = ROOT / "public/data/crime/md"
        n_md = n_csv = 0
        for f in sorted(md_dir.glob("*.md")):
            dst.writestr(PREFIX + f.name, f.read_text())
            n_md += 1
        for f in sorted((md_dir / "csv").glob("*.csv")):
            dst.writestr(PREFIX + "csv/" + f.name, f.read_text())
            n_csv += 1

    shutil.move(str(tmp), str(ZIP))
    quiet or print(f"carried {carried} non-crime entries")
    n_charts = 1 + sum(  # homicide_us.csv, plus each optional chart doc present
        1 for f in ("homicide_two_measures", "harm_lanes_indexed",
                    "homicide_international", "arrests_over_time",
                    "detention_capacity", "burglary_international",
                    "incarceration_over_time", "anomalies_indexed")
        if (CHARTS / f"{f}.json").exists()
    )
    quiet or print(f"crime/: {len(TABLE_FILES)} tables + manifest + README + {n_charts} chart files")
    quiet or print(f"         {n_md} markdown briefs + {n_csv} csv (the AI-readable layer)")
    quiet or print(f"sources: {tier_line}")
    quiet or print(f"homicide csv: {hom_years} years")
    quiet or print(f"zip: {ZIP.stat().st_size:,} bytes")


if __name__ == "__main__":
    import sys as _sys
    raise SystemExit(check() if "--check" in _sys.argv else (main() or 0))

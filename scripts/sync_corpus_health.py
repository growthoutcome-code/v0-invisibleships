#!/usr/bin/env python3
"""
Rebuild the public-health folder inside the downloadable corpus from the live
tables in public/data/health/.

Why a script rather than hand-editing the zip: the corpus copy has drifted from
the site data twice now (the manifest still claimed "12 series" after the chart
went to 14). Anything derived — row counts, tier tallies, chart shape, the
README's file table — is recomputed here from the actual files, so it cannot be
wrong unless the source data is.

Run after any change under public/data/health/:
    python3 scripts/sync_corpus_health.py
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
TABLES = ROOT / "public/data/health/tables"
CHARTS = ROOT / "public/data/health/charts"
ZIP = ROOT / "public/invisible-ships-corpus.zip"
PREFIX = "public-health/"

TABLE_FILES = [
    "health_indicators.json",
    "health_milestones.json",
    "health_claims.json",
    "health_data_quality.json",
    "health_trends.json",
    "health_overlaps.json",
    "health_verdict.json",
    "health_caveats.json",
    "health_sources.json",
]

DESCRIPTIONS = {
    "health_indicators.json": "Time-series rows: indicator, geography, year, value, unit, tier",
    "health_milestones.json": "Dated events (timeline track F on the site)",
    "health_claims.json": "Causal attributions — who claims what, in which document",
    "health_data_quality.json": "Under-reporting / misclassification / registration gaps",
    "health_trends.json": "Sourced trend statements",
    "health_overlaps.json": "Structural/pattern overlaps with the Government Cloud record",
    "health_verdict.json": "The verdict on the ~30% claim, with key figures",
    "health_caveats.json": "Per-workstream caveats — read before quoting any figure",
    "health_sources.json": "Source register: URL, publisher, tier, access date",
}


def rowcount(path):
    d = json.loads(path.read_text())
    return len(d) if isinstance(d, list) else None


def overdose_csv(indicators):
    rows = sorted(
        (r for r in indicators
         if r.get("indicator_id", "").startswith("drug_overdose_deaths")
         and r.get("geography") == "US"),
        key=lambda r: r["year"],
    )
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["year", "deaths", "age_adjusted_rate_per_100k", "status", "source_id"])
    for r in rows:
        w.writerow([
            r["year"], r["value"], r.get("rate_per_100k") or "",
            "provisional" if r.get("provisional") else "final",
            r.get("source_id", ""),
        ])
    return buf.getvalue(), len(rows)


def main():
    if not ZIP.exists():
        raise SystemExit(f"corpus zip not found at {ZIP}")

    indicators = json.loads((TABLES / "health_indicators.json").read_text())
    sources = json.loads((TABLES / "health_sources.json").read_text())
    tiers = Counter(s.get("evidence_tier") for s in sources)
    tier_line = " · ".join(f"{tiers[t]} Tier {t}" for t in ("A", "B", "C") if tiers.get(t))

    counts = {f: rowcount(TABLES / f) for f in TABLE_FILES}

    # ---- chart description, computed from the chart file --------------------
    chart_path = CHARTS / "suicide_international.json"
    chart = json.loads(chart_path.read_text())
    series = chart.get("series", [])
    n_series = len(series)
    n_ext = sum(1 for s in series if s.get("extension"))
    years = sorted({p["year"] for s in series for p in s.get("points", [])})
    ext_years = [s["extension"]["points"][-1]["year"]
                 for s in series if s.get("extension") and s["extension"].get("points")]
    max_year = max(years + ext_years) if (years or ext_years) else None
    chart_desc = (
        f"{n_series} series x {len(years)} years on the WHO age-standardised basis "
        f"({years[0]}-{years[-1]}), plus national-statistics extensions for {n_ext} "
        f"countries running to {max_year} on each country's own method"
    )

    od_csv, od_rows = overdose_csv(indicators)
    od_years = sorted(r["year"] for r in indicators
                      if r.get("indicator_id", "").startswith("drug_overdose_deaths")
                      and r.get("geography") == "US")
    od_from, od_to = (od_years[0], od_years[-1]) if od_years else ("?", "?")

    manifest = {
        "name": "Invisible Ships — Public Health Signals",
        "generated": date.today().isoformat(),
        "method_note": (
            "All figures verified against fetched primary sources. Causes reported as "
            "attributed, never asserted. Overlaps with the Government Cloud dataset are "
            "structural/pattern observations only. This dataset does not corroborate the "
            "journal, and the Government Cloud dataset does not corroborate this one."
        ),
        "tier_legend": {
            "A": "documented — official statistical agency or peer-reviewed source fetched and read",
            "B": "corroborated — reputable secondary corroboration, provisional or modeled official data",
            "C": "claimed — could not be verified against a fetched source / proprietary forecast",
        },
        "safe_reporting": (
            "Rates and counts only; no method detail. Crisis resources: US 988 Suicide & "
            "Crisis Lifeline (call/text 988); international directory at https://findahelpline.com."
        ),
        "tables": {k: v for k, v in counts.items() if v is not None},
        "charts": {
            "suicide_international.json": chart_desc,
            "overdose_us.csv": (
                f"US drug overdose deaths {od_from}-{od_to}, {od_rows} rows: counts, "
                "age-adjusted rates, and final/provisional status per year"
            ),
        },
    }

    # ---- README -------------------------------------------------------------
    tbl = "\n".join(
        f"| {f} | {counts[f] if counts[f] is not None else '—'} | {DESCRIPTIONS[f]} |"
        for f in TABLE_FILES
    )
    readme = f"""# Public Health Signals — site-produced dataset

Compiled for the Data section of invisibleships.com. **Site-produced, not part of
the source-document manifest** — like `government-cloud/`, this folder is research
output, not journal material, and it does not corroborate (and is not corroborated
by) anything else in this corpus.

Regenerated {date.today().isoformat()} by `scripts/sync_corpus_health.py`, which
recomputes every count below from the live data files.

## What this is

Public health statistics assembled to examine a claim ("a ~30% increase in suicide
in the United States") and its surroundings: suicide mortality (US, OECD peers, and
an unrestricted international set including China, Russia and India), drug overdose
deaths across the full 1999–2025 record including the fentanyl era and its reversal,
physical and mental health trends, psychiatric diagnosis vs prescribing volumes, a
register of causal *attributions*, a data-quality register documenting
under-reporting, and a register of structural/pattern overlaps with the Government
Cloud dataset.

Every fact row carries a `source_id` resolving to `health_sources.json` (tier, URL,
publisher, access date).

## Files

| File | Rows | Contents |
| --- | --- | --- |
{tbl}
| manifest.json | — | Table counts, tier legend, method note |
| charts/suicide_international.json | {n_series} series | {chart_desc} |
| charts/suicide_international.csv | — | The same series as a wide CSV, one row per country |
| charts/overdose_us.csv | {od_rows} | US overdose deaths by year, with rate and final/provisional status |

Source register: {tier_line}.

## The suicide comparison chart

`charts/suicide_international.json` holds every line behind the site's suicide
visualization — {n_series} series including Israel and West Bank & Gaza, plus
per-country method, source, tier and caveats, and dated COVID-19 markers.

The {years[0]}–{years[-1]} segment is ONE comparable basis (WHO estimates
age-standardised to the world standard population, retrieved from the World Bank's
open API). Over that period the world rate fell 27% and most countries fell with it
— Russia −60%, China −42%, Japan −28%, India −21% — while the United States rose
40% in a steady climb. South Korea rose further but peaked around 2011.

The post-{years[-1]} extensions are **each country's own national statistics on its
own method** — different standard populations, and in three cases crude rather than
age-standardised rates. They are stored separately, marked per country, and drawn
dotted on the site precisely because they are not cross-country comparable. Do not
splice them into the WHO segment without rebasing.

## The overdose series

`charts/overdose_us.csv` runs {od_rows} years. The rise is the larger half of it:
16,849 deaths in 1999 to 107,941 in 2022, then a steep reversal to 79,384 (2024,
final) and a provisional 69,973 (2025).

Two vintages are mixed at the recent end and the distinction changes the headline:
CDC's May 2026 release compares provisional 2025 against a *provisional* 2024
estimate of 81,313 and reports "almost 14%". Against the *final* 2024 count of
79,384 the same 2025 figure is a fall of about 11.9%. Provisional counts revise
upward. `health_data_quality.json` carries this as row `hq015`.

## Safe reporting

{manifest['safe_reporting']}
"""

    # ---- rewrite the zip ----------------------------------------------------
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
        dst.writestr(PREFIX + "README-public-health.md", readme)
        dst.writestr(PREFIX + "charts/suicide_international.json", chart_path.read_text())
        csv_path = CHARTS / "suicide_international.csv"
        if csv_path.exists():
            dst.writestr(PREFIX + "charts/suicide_international.csv", csv_path.read_text())
        else:
            # the CSV lives only in the corpus; carry the previous copy forward
            with zipfile.ZipFile(ZIP, "r") as s2:
                name = PREFIX + "charts/suicide_international.csv"
                if name in s2.namelist():
                    dst.writestr(name, s2.read(name))
        dst.writestr(PREFIX + "charts/overdose_us.csv", od_csv)

    shutil.move(str(tmp), str(ZIP))
    print(f"carried {carried} non-health entries")
    print(f"public-health/: {len(TABLE_FILES)} tables + manifest + README + 3 chart files")
    print(f"sources: {tier_line}")
    print(f"chart: {chart_desc}")
    print(f"overdose csv: {od_rows} rows")
    print(f"zip: {ZIP.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()

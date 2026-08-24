#!/usr/bin/env python3
"""Turn the Data section's tables into incremental Markdown for the corpus.

Why this exists
---------------
The corpus README has stated the standard since the beginning:

    "Each file is a self-contained chunk that opens with a YAML metadata header
     and holds one coherent unit of content ... named so they remain unambiguous
     when shared individually with an AI assistant."

The journal follows it — 448 files. The reference documents follow it — 242
sections. Glossary, 18. **The Data sections never did.** Crime shipped 23 JSON
files and one README; Public Health shipped 11 JSON and one README. Government
Cloud is the only one with prose, and only because seven briefs were written by
hand.

That matters because the corpus is the sharing mechanism for this project. People
download it, upload it to an assistant, and ask it questions. Handed a folder of
JSON schemas, a model reads the SHAPE of the data — arrays, keys, types — and the
findings stay buried as string values inside them. Handed prose with a header, it
reads the argument, the evidence tier, and the source.

Nothing here is invented. Every sentence below is assembled from what the site
already publishes: the verdict, the plain-language statements under each chart,
the registers, the caveats, the tiered sources. Generating rather than writing is
deliberate — a hand-written brief drifts the moment a figure changes, and that is
exactly how a stale verdict ended up in the download on 23 August.

Output: one Markdown file per coherent unit, plus CSVs for the row data (models
read CSV far better than JSON, and a 565-row table has no business being prose).

Run:  python3 scripts/build_corpus_md.py
Wired into scripts/sync_corpus_crime.py, so the freshness guard covers it.
"""

from __future__ import annotations

import csv
import json
import pathlib
import re
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
CRIME_T = ROOT / "public/data/crime/tables"
CRIME_C = ROOT / "public/data/crime/charts"
OUT = ROOT / "public/data/crime/md"

AUTHOR = "Sean C. Harris"
COPYRIGHT = "© 2026 Sean C. Harris. All Rights Reserved."

# Every generated file carries this, so a reader who opens ONE file still meets
# the terms. The corpus is shared file-by-file; a disclaimer that lives only in
# the root README does not travel with the chunk.
STANDING = (
    "*Independent research compiled from public records for informational purposes "
    "only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, "
    "**B** corroborated, **C** claimed — B and C may not be quoted as established fact. "
    "Causes are reported as attributed, never asserted. This dataset does not "
    "corroborate, and is not corroborated by, any other dataset in this corpus. "
    "See `meta/IS_META_disclaimer.md`.*"
)


def load(p: pathlib.Path):
    return json.loads(p.read_text()) if p.exists() else None


def slug(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:60]


def words(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def header(doc_id: str, title: str, doc_type: str, body: str, extra: dict | None = None) -> str:
    """The YAML block, matching the convention the journal and glossary already use."""
    lines = [
        "---",
        f"id: {doc_id}",
        f"title: {title}",
        "collection: data",
        f"doc_type: {doc_type}",
        "section: crime",
        "geography: United States (unless a row says otherwise)",
        "generated_by: scripts/build_corpus_md.py",
    ]
    for k, v in (extra or {}).items():
        lines.append(f"{k}: {v}")
    lines += [
        f"word_count: {words(body)}",
        f"author: {AUTHOR}",
        f"copyright: {COPYRIGHT}",
        "---",
        "",
    ]
    return "\n".join(lines) + body.strip() + "\n"


def write(name: str, text: str) -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(text)
    return len(text)


def tier_chip(t: str | None) -> str:
    return f"[{t}]" if t else "[—]"


def src_of(sid, sources) -> str:
    if not sid:
        return ""
    s = next((x for x in sources if x.get("source_id") == sid), None)
    if not s:
        return f" — source `{sid}`"
    bits = [x for x in [s.get("publisher"), s.get("title")] if x]
    out = f" — {' · '.join(bits)}" if bits else ""
    if s.get("url"):
        out += f" <{s['url']}>"
    return out


# --------------------------------------------------------------------- charts
def chart_brief(path: pathlib.Path, sources) -> tuple[str, str]:
    c = load(path)
    if not c:
        return "", ""
    title = c.get("title", path.stem)
    body = [f"# {title}", "", STANDING, ""]

    meta = []
    if c.get("unit"):
        meta.append(f"**Unit.** {c['unit']}")
    if c.get("publisher"):
        meta.append(f"**Publisher.** {c['publisher']}")
    if c.get("tier"):
        meta.append(f"**Evidence tier.** {c['tier']}")
    if meta:
        body += [" · ".join(meta), ""]

    themes = c.get("themes") or []
    if themes:
        body += ["## What this chart shows", ""]
        for t in themes:
            body.append(f"- {tier_chip(t.get('tier'))} {t['statement']}")
        body.append("")

    series = c.get("series") or []
    if series:
        body += ["## The series", ""]
        for s in series:
            pts = s.get("points") or []
            if not pts:
                continue
            ys = [p["year"] for p in pts]
            vs = [p["value"] for p in pts]
            hi = max(pts, key=lambda p: p["value"])
            lo = min(pts, key=lambda p: p["value"])
            line = (
                f"### {s.get('name', 'series')}\n"
                f"{s.get('publisher', 'publisher not stated')} · tier {s.get('tier', '—')} · "
                f"{len(pts)} points, {min(ys)}–{max(ys)}\n\n"
                f"- First: {vs[0]:,.4g} ({ys[0]}) · Last: {vs[-1]:,.4g} ({ys[-1]})\n"
                f"- Highest: {hi['value']:,.4g} ({hi['year']}) · Lowest: {lo['value']:,.4g} ({lo['year']})"
            )
            if s.get("basis_short"):
                line += f"\n- Basis: {s['basis_short']}"
            for cav in (s.get("caveats") or [])[:4]:
                line += f"\n- Caveat: {cav}"
            body += [line, ""]

    if c.get("note"):
        body += ["## Note on reading this", "", c["note"], ""]
    if c.get("accuracy_note"):
        body += [c["accuracy_note"], ""]
    if c.get("window_note"):
        body += [c["window_note"], ""]

    ans = c.get("answer")
    if ans:
        body += [f"## {ans.get('question', 'The answer')}", "",
                 ans.get("body", ""), "", ans.get("consequence", ""), ""]

    text = "\n".join(body)
    name = f"IS_CRIME_chart_{slug(path.stem)}.md"
    return name, header(
        f"IS-CRIME-CHART-{slug(path.stem).upper()}", f"Crime — {title}",
        "chart-brief", text,
        {"chart_file": f"crime/charts/{path.name}", "series_count": len(series)},
    )


# ------------------------------------------------------------------ registers
def register(name, doc_id, title, intro, rows, render, sources, doc_type="register") -> tuple[str, str]:
    body = [f"# {title}", "", STANDING, "", intro, "", f"**{len(rows)} entries.**", ""]
    for r in rows:
        body.append(render(r, sources))
        body.append("")
    return name, header(doc_id, f"Crime — {title}", doc_type, "\n".join(body),
                        {"entry_count": len(rows)})


def r_not_counted(r, s):
    return (f"### {r['category']}\n"
            f"{tier_chip(r.get('tier'))} **{r.get('status', '')}**{src_of(r.get('source_id'), s)}\n\n"
            f"{r.get('detail', '')}\n\n"
            f"*Who would have to count it:* {r.get('who_would_collect', 'not stated')}")


def r_dq(r, s):
    return (f"### {r.get('topic', r['dq_id'])}\n"
            f"{tier_chip(r.get('tier'))} {r.get('geography', '')}{src_of(r.get('source_id'), s)}\n\n"
            f"{r.get('issue', '')}\n\n*Effect:* {r.get('effect', '')}")


def r_trend(r, s):
    return f"- {tier_chip(r.get('tier'))} **{r.get('topic', '')}** — {r['statement']}{src_of(r.get('source_id'), s)}"


def r_sweep(r, s):
    return (f"### {r.get('operation', '')} ({r.get('date', '')})\n"
            f"{tier_chip(r.get('tier'))} {r.get('agency', '')}{src_of(r.get('source_id'), s)}\n\n"
            f"{r.get('headline', '')}\n\n"
            f"*What the number actually counts:* {r.get('what_the_number_is', '')}\n\n"
            f"*For scale:* {r.get('for_scale', '')}")


def r_caveat(r, s):
    return f"- {tier_chip(r.get('tier'))} {r['caveat']}"


def r_milestone(r, s):
    return (f"- **{r.get('occurred_on', '')}** {tier_chip(r.get('tier'))} "
            f"{r.get('title', '')} — {r.get('description', '')}{src_of(r.get('source_id'), s)}")


def main() -> None:
    sources = load(CRIME_T / "crime_sources.json") or []
    verdict = load(CRIME_T / "crime_verdict.json") or {}
    written = []

    # ---- 1. start here -----------------------------------------------------
    tiers = Counter(s.get("evidence_tier") for s in sources)
    charts = sorted(CRIME_C.glob("*.json"))
    start = f"""# Crime — start here

{STANDING}

## What this is

The Data/Crime research from invisibleships.com, as Markdown you can hand to an
assistant. **Site-produced research output — not journal material.** It does not
corroborate, and is not corroborated by, the journal or any other dataset here.

**Scope: the United States**, except where a chart or row names another country.
Window: 1999–2025.

## What is in this folder

| File pattern | What it holds |
|---|---|
| `IS_CRIME_chart_*.md` | One brief per chart: what it shows, every series, caveats |
| `IS_CRIME_register_*.md` | The registers — what nobody counts, data quality, trends, sweeps |
| `IS_CRIME_sources.md` | All {len(sources)} sources with tier, publisher and link |
| `csv/*.csv` | Row data — indicators, sources, registers |
| `charts/*.json`, `*.json` | The same data programmatically, for code |

{len(charts)} charts · {len(sources)} sources (Tier A {tiers.get('A', 0)} · B {tiers.get('B', 0)} · C {tiers.get('C', 0)})

## What this research found

**{verdict.get('claim', '')}**

{verdict.get('summary', '')}

## Questions worth asking it

- Did crime rise in the United States between 1999 and 2025, and by which measure?
- Where do the two official measures — police records and the victimisation
  survey — disagree, and why?
- What kinds of harm have no national statistic at all, and who would have to
  collect them?
- Which official series stop before the years being asked about, and what does
  that prevent anyone concluding?
- Where does this research say a number cannot support a conclusion?

## How to read the evidence tiers

**A — documented.** A primary source states it: an agency table, a court record,
a statistical release. **B — corroborated.** Reported by a credible secondary
source but not confirmed in a primary record. **C — claimed.** Asserted by an
interested party; recorded because the claim itself is a fact, not because the
content is established.

A rise in *reports* is not a rise in *events*. Where a publisher attributes its
own increase to changed reporting, that attribution travels with the figure.
"""
    written.append(("IS_CRIME_00_start-here.md",
                    header("IS-CRIME-00-START-HERE", "Crime — start here",
                           "section-overview", start,
                           {"chart_count": len(charts), "source_count": len(sources)})))

    # ---- 2. the verdict ----------------------------------------------------
    if verdict:
        v = [f"# {verdict.get('claim', 'The finding')}", "", STANDING, "",
             verdict.get("summary", ""), "", "## The figures this rests on", ""]
        for f in verdict.get("key_figures", []):
            v.append(f"- {tier_chip(f.get('tier'))} {f['figure']}{src_of(f.get('source_id'), sources)}")
        written.append(("IS_CRIME_01_finding.md",
                        header("IS-CRIME-01-FINDING", "Crime — the finding",
                               "finding", "\n".join(v),
                               {"figure_count": len(verdict.get("key_figures", []))})))

    # ---- 3. one brief per chart -------------------------------------------
    for p in charts:
        n, t = chart_brief(p, sources)
        if n:
            written.append((n, t))

    # ---- 4. registers ------------------------------------------------------
    regs = [
        ("IS_CRIME_register_not-counted.md", "IS-CRIME-REG-NOT-COUNTED",
         "What nobody counts",
         "The kinds of harm this research is most concerned with are the ones with no "
         "national statistic. That is not a gap in the research — it is the finding.",
         load(CRIME_T / "crime_not_counted.json") or [], r_not_counted),
        ("IS_CRIME_register_data-quality.md", "IS-CRIME-REG-DATA-QUALITY",
         "How much the numbers can be trusted",
         "Where the counting is the problem, the counting is the finding. Every entry "
         "names an issue with a measure and what it does to any conclusion drawn from it.",
         load(CRIME_T / "crime_data_quality.json") or [], r_dq),
        ("IS_CRIME_register_trends.md", "IS-CRIME-REG-TRENDS",
         "What the series show",
         "One statement per series, each resolving to a source.",
         load(CRIME_T / "crime_trends.json") or [], r_trend),
        ("IS_CRIME_register_sweeps.md", "IS-CRIME-REG-SWEEPS",
         "Enforcement in sweeps",
         "Arrest counts announced as headline figures. An arrest is an enforcement "
         "action, not an adjudicated fact — each entry records what the number counts.",
         load(CRIME_T / "crime_sweeps.json") or [], r_sweep),
        ("IS_CRIME_register_caveats.md", "IS-CRIME-REG-CAVEATS",
         "Read before quoting any figure",
         "Constraints that apply to everything in this folder.",
         load(CRIME_T / "crime_caveats.json") or [], r_caveat),
        ("IS_CRIME_register_milestones.md", "IS-CRIME-REG-MILESTONES",
         "Dated milestones",
         "The crime track of the site's master timeline. Dates are when something was "
         "published, enacted or reported — co-occurrence with anything else is not relation.",
         load(CRIME_T / "crime_milestones.json") or [], r_milestone),
    ]
    for name, did, title, intro, rows, render in regs:
        if rows:
            written.append(register(name, did, title, intro, rows, render, sources))

    # ---- 5. the dated non-charts ------------------------------------------
    for key, fname in [("crime_intl_drug_deaths", "drug-deaths"),
                       ("crime_intl_incarceration", "incarceration"),
                       ("crime_intl_missing", "missing-persons")]:
        d = load(CRIME_T / f"{key}.json")
        if not d:
            continue
        b = [f"# {d.get('title', fname)}", "", STANDING, "",
             "**This is a dated table, not a chart, and that is deliberate.**", "",
             d.get("why_no_chart", ""), ""]
        for r in d.get("rows", []):
            val = r.get("value")
            shown = f"{val:,}" if isinstance(val, (int, float)) else "not counted comparably"
            b.append(f"- {tier_chip(r.get('tier'))} **{r.get('country', '')}** — {shown} "
                     f"({r.get('year', 'n/d')}) {r.get('unit', '')}. "
                     f"{r.get('definition') or r.get('note') or ''}{src_of(r.get('source_id'), sources)}")
        written.append((f"IS_CRIME_international_{fname}.md",
                        header(f"IS-CRIME-INTL-{fname.upper()}",
                               f"Crime — {d.get('title', fname)}",
                               "dated-table", "\n".join(b),
                               {"row_count": len(d.get('rows', []))})))

    # ---- 6. transnational + accomplishments (bespoke shapes) --------------
    tr = load(CRIME_T / "crime_transnational.json")
    if tr:
        w = tr.get("what_it_is", {})
        b = [f"# Transnational repression", "", STANDING, "",
             f"{tier_chip(w.get('tier'))} \"{w.get('definition', '')}\" — {w.get('definition_source', '')}", "",
             w.get("named_states", ""), "", "## The FBI's own tactic list", ""]
        for t in w.get("tactics", []):
            b.append(f"- {t}")
        b += ["", w.get("tactics_note", ""), "", "## How it is measured — if at all", ""]
        for m in tr.get("how_it_is_measured", []):
            b.append(f"### {m.get('who', '')}\n{tier_chip(m.get('tier'))} {m.get('status', '')}"
                     f"{src_of(m.get('source_id'), sources)}\n\n{m.get('what', '')}\n")
        b += ["## The gap", "", tr.get("the_gap", ""), "", tr.get("discipline_note", "")]
        written.append(("IS_CRIME_register_transnational.md",
                        header("IS-CRIME-REG-TRANSNATIONAL", "Crime — transnational repression",
                               "register", "\n".join(b))))

    acc = load(CRIME_T / "crime_accomplishments.json")
    if acc:
        b = [f"# {acc.get('title', 'Law-enforcement accomplishments')}", "", STANDING, "",
             acc.get("intro", ""), ""]
        for r in acc.get("rows", []):
            b.append(f"### {r.get('what', '')}\n{tier_chip(r.get('tier'))} {r.get('kind', '')}"
                     f"{src_of(r.get('source_id'), sources)}\n\n{r.get('claim', '')}\n\n"
                     f"*Corroboration:* {r.get('corroboration', '')}\n")
        b += ["", acc.get("discipline", "")]
        written.append(("IS_CRIME_register_accomplishments.md",
                        header("IS-CRIME-REG-ACCOMPLISHMENTS",
                               f"Crime — {acc.get('title', 'accomplishments')}",
                               "register", "\n".join(b),
                               {"entry_count": len(acc.get("rows", []))})))

    # ---- 7. sources --------------------------------------------------------
    b = ["# Crime — sources", "", STANDING, "",
         f"**{len(sources)} sources.** Tier A {tiers.get('A', 0)} · B {tiers.get('B', 0)} · "
         f"C {tiers.get('C', 0)}. Every figure in this folder resolves to one of these.", "",
         "| Tier | Publisher | Title | Accessed | Link | Archived |",
         "|---|---|---|---|---|---|"]
    for s in sorted(sources, key=lambda x: (x.get("evidence_tier") or "Z", x.get("publisher") or "")):
        arch = f"[snapshot]({s['archived_url']})" if (s.get("archived_url") or "").strip() else "—"
        title = (s.get("title") or "").replace("|", "/")[:90]
        pub = (s.get("publisher") or "").replace("|", "/")[:44]
        b.append(f"| {s.get('evidence_tier', '—')} | {pub} | {title} | "
                 f"{s.get('accessed', '')} | <{s.get('url', '')}> | {arch} |")
    written.append(("IS_CRIME_sources.md",
                    header("IS-CRIME-SOURCES", "Crime — sources", "source-list",
                           "\n".join(b), {"source_count": len(sources)})))

    # ---- write markdown ----------------------------------------------------
    if OUT.exists():
        for old in OUT.glob("*.md"):
            old.unlink()
    total = 0
    for name, text in written:
        total += write(name, text)

    # ---- CSVs: row data belongs in a table, not in prose -------------------
    csv_dir = OUT / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    for old in csv_dir.glob("*.csv"):
        old.unlink()
    csv_files = 0
    for stem in ["crime_indicators", "crime_sources", "crime_data_quality",
                 "crime_not_counted", "crime_milestones", "crime_trends"]:
        rows = load(CRIME_T / f"{stem}.json")
        if not isinstance(rows, list) or not rows:
            continue
        cols = sorted({k for r in rows for k in r.keys()})
        with (csv_dir / f"{stem.replace('crime_', '')}.csv").open("w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        csv_files += 1

    print(f"markdown : {len(written)} files, {total:,} bytes -> {OUT.relative_to(ROOT)}")
    print(f"csv      : {csv_files} files")
    longest = max(written, key=lambda x: len(x[1]))
    print(f"largest  : {longest[0]} ({len(longest[1]):,} bytes)")


if __name__ == "__main__":
    main()

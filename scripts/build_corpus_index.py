#!/usr/bin/env python3
"""The corpus index — and the completeness guarantee.

Why this exists
---------------
The corpus lost content quietly, twice, because nothing checked. Sixteen
concepts were exported on 17 August and the commit was reverted the same day;
nobody noticed for a week. Twenty site-authored glossary terms never had an
export path at all. The Crime section shipped 23 JSON files and one README while
the journal shipped 448 Markdown chunks.

None of that was a mistake anybody made twice. It happened because the corpus is
assembled by scripts that each know about their own folder, and content arriving
by any other route has no owner and no test.

This script is the owner of last resort. It does two things:

  1. Writes START-HERE.md — a real index of everything in the download, and
     instructions for using it with an assistant. The existing README describes
     the original 711-file document series and never mentions crime.

  2. --check enumerates every body of content in the REPOSITORY and asserts each
     one has a counterpart in the ZIP, with matching counts. If a concept is
     added and not exported, this fails and names it. If an exporter is deleted
     by a revert, this fails. The corpus stops depending on anyone remembering.

Run:  python3 scripts/build_corpus_index.py
      python3 scripts/build_corpus_index.py --check
"""
import json
import pathlib
import re
import shutil
import sys
import zipfile
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
ZIP = ROOT / "public/invisible-ships-corpus.zip"


# --------------------------------------------------------------- expectations
def count_ts_array(path: pathlib.Path, name: str) -> int:
    """Count top-level entries in a plain-data TypeScript array literal."""
    if not path.exists():
        return 0
    s = path.read_text()
    i = s.find(f"{name}")
    if i < 0:
        return 0
    eq = s.find("=", i)
    open_i = s.find("[", eq)
    depth, q, esc = 0, None, False
    end = -1
    for j in range(open_i, len(s)):
        c = s[j]
        if q:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == q:
                q = None
            continue
        if c in "\"'`":
            q = c
            continue
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                end = j
                break
    lit = s[open_i:end]
    # top-level entries open with `{` at depth 1
    depth, q, esc, n = 0, None, False, 0
    for c in lit:
        if q:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == q:
                q = None
            continue
        if c in "\"'`":
            q = c
            continue
        if c in "[{":
            depth += 1
            if c == "{" and depth == 2:
                n += 1
        elif c in "]}":
            depth -= 1
    return n


def expectations() -> list:
    """(label, how many the repo has, zip prefix, zip suffix) for every body of
    content. Anything added to the site must be added here too — and if it is
    not, the number simply will not match and --check says so."""
    md = lambda p: len(list((ROOT / p).glob("*.md"))) if (ROOT / p).exists() else 0
    return [
        ("Concepts", count_ts_array(ROOT / "lib/concepts.ts", "CONCEPTS"),
         "concepts/", ".md", 1),          # +1 for the start-here index
        ("Site glossary", count_ts_array(ROOT / "lib/site-content.ts", "EXTRA_GLOSSARY"),
         "glossary-site/", ".md", 1),     # +1 for the README
        ("Crime briefs", md("public/data/crime/md"), "crime/", ".md", 1),
        ("Public Health briefs", md("public/data/health/md"), "public-health/", ".md", 1),
        ("Concept files on disk", md("public/data/concepts/md"), "concepts/", ".md", 0),
        # Raw research inputs. Not rendered on the site, and included precisely
        # for that reason: the corpus carries the evidence base, not only what
        # the UI chose to draw from it.
        ("Research inputs", _research_count(), "research/", "", 1),
    ]


def _research_count() -> int:
    r = ROOT / "research"
    if not r.exists():
        return 0
    n = sum(1 for f in r.rglob("*")
            if f.is_file() and not f.name.startswith(".")
            and "wayback-ledger" not in f.name)
    d = ROOT / "docs"
    if d.exists():
        n += len(list(d.glob("*.md")))
    return n


def audit() -> tuple:
    z = zipfile.ZipFile(ZIP)
    names = z.namelist()
    rows, problems = [], []
    for label, want, prefix, suffix, allowance in expectations():
        got = len([n for n in names if n.startswith(prefix) and n.endswith(suffix)])
        # `allowance` counts the non-content files that share the prefix — the
        # start-here index, a README. The corpus must hold every item PLUS those.
        # Comparing against `want` alone let a lost concept pass unnoticed the
        # first time this guard was tested, which is the whole failure it exists
        # to catch, so the allowance is part of the assertion and not decoration.
        need = want + allowance if want else 0
        ok = got >= need
        rows.append((label, need, got, ok))
        if want and got < need:
            problems.append(
                f"{label}: repository holds {want} (+{allowance} index/readme = {need} "
                f"expected), corpus has {got} — {need - got} missing from {prefix}"
            )
        if want == 0 and label in ("Concepts", "Site glossary"):
            problems.append(f"{label}: could not read the source — exporter may be broken")
    return rows, problems, names


# ------------------------------------------------------------------- the index
def build_index(names: list) -> str:
    def n_of(prefix, suffix=".md"):
        return len([x for x in names if x.startswith(prefix) and x.endswith(suffix)])

    total = len([x for x in names if not x.endswith("/")])
    return f"""# Invisible Ships — start here

*Generated {date.today().isoformat()} · {total} files*

## What this is

The complete research archive behind **invisibleships.com**, as Markdown you can
hand to an AI assistant. Every file is self-contained: it opens with a metadata
header and holds one coherent unit — a journal day, one recording's transcript,
one chart's findings, one concept — so a single file still identifies itself when
pasted into a chat on its own.

**Nobody can upload 800 files at once.** Do not try. Pick the folder that answers
your question; each is sized to fit.

## Where to start, by question

| If you want to… | Upload | Files |
|---|---|---|
| Understand the whole archive fast | `concepts/` | {n_of('concepts/')} |
| Investigate the crime findings | `crime/*.md` | {n_of('crime/')} |
| Investigate the health findings | `public-health/*.md` | {n_of('public-health/')} |
| Investigate government cloud adoption | `government-cloud/briefs/` | {n_of('government-cloud/', '.md')} |
| Read the primary record | `journal/` (large — go by part) | {n_of('journal/')} |
| Look up terminology | `glossary/` + `glossary-site/` | {n_of('glossary/') + n_of('glossary-site/')} |
| Check the terms and disclaimer | `meta/` | {n_of('meta/')} |
| Do your own analysis on the numbers | any `csv/` folder | {n_of('', '.csv')} |
| Rebuild or check the findings yourself | `research/` | {n_of('research/', '')} |

## The folders

- **`concepts/`** — the archive's arguments, each labelled with its BASIS
  (documented / structural / pattern) and ORIGIN (ai / author). *A reader who
  rejects every `pattern` entry can still rely on every `documented` one.*
- **`journal/`** — the primary record: dated entries and verbatim transcripts.
- **`references/`** — the analysis and reference documents, chunked by section.
- **`crime/`, `public-health/`, `government-cloud/`** — site-produced research.
  Briefs in Markdown, row data in `csv/`, and the same content as `.json` for
  code. **These three datasets do not corroborate each other, or the journal.**
- **`glossary/`** — terms from the source document series.
  **`glossary-site/`** — terms written for the site to explain the work.
- **`documents/`** — what the source series contains and where it lives.
- **`research/`** — the raw researched rows and sources the charts were built
  from, before any brief was written. Not rendered anywhere on the site. Here so
  the findings can be rebuilt and checked rather than taken on trust.
- **`meta/`** — copyright, disclaimer, author statement, category vocabulary.

## Reading the evidence tiers

Every figure in the research folders carries one:

**A — documented.** A primary source states it: an agency table, a court record,
a statistical release. **B — corroborated.** Reported by a credible secondary
source, not confirmed in a primary record. **C — claimed.** Asserted by an
interested party; recorded because the claim itself is a fact, not because its
content is established.

**B and C may not be quoted as established fact.**

## Rules this archive holds itself to

- Causes are reported as **attributed**, never asserted. Where a body states a
  cause, that body is named and dated.
- **Co-occurrence is not relation.** Two things in the same year is a
  co-occurrence, and this record cannot establish more than that.
- **A rise in reports is not a rise in events.**
- **Absences carry the same weight as lines.** What nobody counts is a finding,
  not a gap.
- A series that stops has not shown the thing stopped.

## Terms

© 2026 Sean C. Harris. All Rights Reserved. Distribute the complete original;
do not republish parts. Independent research from public records, for
informational purposes only — not legal, medical, or investment advice. Full
terms in `meta/IS_META_copyright.md` and `meta/IS_META_disclaimer.md`.
"""


# ------------------------------------------------------- the summary the UI reads
# The export dialog described the archive in a hand-written sentence, and that
# sentence went stale: it named Government Cloud and Public Health months after
# Crime, Concepts and the research inputs had joined the download. A visitor
# reading it under-counted what they were getting.
#
# Prose that describes generated content has to be generated too. The LABELS and
# BLURBS below are editorial and stay hand-written; every NUMBER beside them is
# read out of the zip that actually ships. --check re-derives the file and fails
# if it drifts, so the modal cannot lie again without the suite saying so.
SUMMARY_TS = ROOT / "lib/corpus-summary.ts"

FOLDERS = [
    ("journal", "Journal", "The primary record — dated entries and verbatim transcripts."),
    ("references", "References", "The analysis and reference documents, chunked by section."),
    ("crime", "Crime", "Nine findings, their row data, and every source behind them."),
    ("public-health", "Public Health", "Suicide, overdose and the indicators around them."),
    ("government-cloud", "Government Cloud", "Awards, deployments, litigation and capital flows."),
    ("concepts", "Concepts", "The archive's arguments, each labelled documented / structural / pattern."),
    ("glossary", "Glossary", "Terms from the source series, plus terms written for the site."),
    ("research", "Research inputs", "The raw rows the charts were built from. Not rendered anywhere on the site."),
    ("meta", "Terms", "Copyright, disclaimer, author statement, category vocabulary."),
]

WORD_RE = re.compile(r"\b[\w'-]+\b")


def build_summary(names: list) -> str:
    z = zipfile.ZipFile(ZIP)
    files = [i for i in z.infolist() if not i.filename.endswith("/")]
    md = [i for i in files if i.filename.endswith(".md")]

    counts = {}
    for i in md:
        counts[i.filename] = len(WORD_RE.findall(z.read(i.filename).decode("utf-8", "replace")))
    per_file = sorted(counts.values())
    total_words = sum(per_file)
    median = per_file[len(per_file) // 2] if per_file else 0

    def n(prefix, suffix):
        return len([x for x in names if x.startswith(prefix + "/") and x.endswith(suffix)])

    rows = []
    for key, label, blurb in FOLDERS:
        # glossary/ is two folders to the builder and one idea to the reader
        pre = [key] + (["glossary-site"] if key == "glossary" else [])
        m = sum(n(p, ".md") for p in pre)
        data = sum(n(p, ".csv") + n(p, ".json") for p in pre)
        if not m and not data:
            continue
        rows.append((key, label, blurb, m, data))

    body = ",\n".join(
        f'  {{ key: "{k}", label: "{lab}", blurb: "{b}", markdown: {m}, data: {d} }}'
        for k, lab, b, m, d in rows
    )
    return (
        "// GENERATED by scripts/build_corpus_index.py — do not edit by hand.\n"
        "//\n"
        "// Every number here is read out of public/invisible-ships-corpus.zip, the\n"
        "// file the download actually serves. The test suite re-derives this and\n"
        "// fails if it drifts, so what the export dialog claims and what a visitor\n"
        "// receives cannot come apart.\n"
        "export const CORPUS_SUMMARY = {\n"
        f'  generated: "{date.today().isoformat()}",\n'
        f"  files: {len(files)},\n"
        f"  markdown: {len(md)},\n"
        f'  csv: {len([i for i in files if i.filename.endswith(".csv")])},\n'
        f"  words: {total_words},\n"
        f"  medianWords: {median},\n"
        f"  largestWords: {per_file[-1] if per_file else 0},\n"
        f"  zipBytes: {ZIP.stat().st_size},\n"
        "  folders: [\n" + body + ",\n  ],\n"
        "} as const;\n"
    )


def main(quiet=False) -> int:
    rows, problems, names = audit()
    index = build_index(names)

    tmp = ZIP.with_suffix(".tmp.zip")
    with zipfile.ZipFile(ZIP, "r") as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            if item.filename == "START-HERE.md":
                continue
            dst.writestr(item, src.read(item.filename))
        dst.writestr("START-HERE.md", index)
    shutil.move(str(tmp), str(ZIP))

    # after the move, so the summary counts the index file it just wrote
    names = zipfile.ZipFile(ZIP).namelist()
    summary = build_summary(names)
    SUMMARY_TS.write_text(summary)

    if not quiet:
        print("corpus coverage")
        for label, want, got, ok in rows:
            print(f"  {'ok ' if ok else 'GAP'} {label:24s} repo {want:4d}  corpus {got:4d}")
        print(f"START-HERE.md written · zip {ZIP.stat().st_size:,} bytes")
        print(f"lib/corpus-summary.ts written · what the export dialog shows")
    return 1 if problems else 0


def check() -> int:
    rows, problems, names = audit()
    if "START-HERE.md" not in names:
        problems.append("START-HERE.md is missing from the corpus")
    # The export dialog quotes these numbers to the visitor. If the generated
    # summary no longer matches the zip, the dialog is describing an archive
    # that is not the one being served.
    if not SUMMARY_TS.exists():
        problems.append("lib/corpus-summary.ts is missing — the export dialog has no counts")
    else:
        want = build_summary(names)
        got = SUMMARY_TS.read_text()
        strip = lambda s: "\n".join(
            l for l in s.splitlines() if not l.strip().startswith("generated:")
        )
        if strip(want) != strip(got):
            problems.append(
                "lib/corpus-summary.ts is stale — the export dialog would describe "
                "an archive that is not the one in the zip"
            )
    for label, want, got, ok in rows:
        print(f"  {'ok ' if ok else 'GAP'} {label:24s} repo {want:4d}  corpus {got:4d}")
    if problems:
        print("\nFAIL: the corpus does not carry everything the repository holds.")
        for p in problems:
            print("   " + p)
        print("\nRun the exporters, then the syncs:")
        print("   python3 scripts/build_corpus_md.py")
        print("   node scripts/export_concepts_md.mjs")
        print("   node scripts/export_site_content_md.mjs")
        print("   python3 scripts/sync_corpus_crime.py && python3 scripts/sync_corpus_health.py")
        print("   python3 scripts/sync_corpus_site.py && python3 scripts/build_corpus_index.py")
        return 1
    print("\ncorpus is complete — every body of content in the repo reaches the download")
    return 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else main())

#!/usr/bin/env python3
"""Assert the download is the same archive the site is.

Why this exists
---------------
On 27 August 2026 an audit compared every file the site serves at runtime
against the zip a reader downloads, and found four gaps:

  1. government-cloud/json/charts/timeline.json held 311 milestones in the
     download against 336 on the site. Same schema, strict subset. The crime and
     health tracks had been injected weeks earlier and never reached a reader.
  2. `theme` and `audience` — two of the four axes every concept carries —
     never reached the exported frontmatter, so the download could not be sorted
     the way the site sorts it.
  3. FINDINGS, NOT_ESTABLISHED, RESEARCH_INTRO and SOURCE_YEARS — the whole
     summary layer, including the archive's own statement of its limits and its
     citation index — appeared nowhere in the zip. Zero occurrences.
  4. The standing disclaimer on all 35 exported concepts told readers they could
     reject every `pattern` entry. `pattern` had been empty for days.

Every guard in this repository passed while all four shipped, because they count
FILES and WORDS:

  * a stale file is still a file                    (gap 1)
  * a missing frontmatter field is not a file       (gap 2)
  * content never exported was never in a baseline
    to be lost                                      (gap 3)
  * wrong words and right words count the same      (gap 4)

Nothing asserted that the download MATCHES the site. That was the hole. This
script is that assertion, and it is deliberately dumb: it compares bytes.

What it checks
--------------
  1. Every file under public/data/** has a counterpart in the zip, at the path
     the mapping below says, holding identical bytes.
  2. Every axis declared on a Concept in lib/concepts.ts reaches the exported
     frontmatter of every concept file in the zip.
  3. Every summary-layer constant in lib/concepts.ts is represented in the zip.
  4. No exported concept carries a disclaimer that names a basis tier which has
     no entries — the exact way gap 4 went stale and stayed stale.

Anything under public/data/ that the mapping does not cover is a FAILURE, not a
skip. A new folder appearing there with no route into the download is the
condition that produced three of the four gaps above; it should be loud.

Run:  python3 scripts/check_download_matches_site.py
      python3 scripts/check_download_matches_site.py --check   (same thing)
"""
import collections
import json
import pathlib
import re
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "public/data"
ZIP = ROOT / "public/invisible-ships-corpus.zip"
CONCEPTS_TS = ROOT / "lib/concepts.ts"

# site directory (relative to public/data) -> prefix inside the zip.
# Order matters: the longest matching prefix wins, so crime/md/csv is found
# before crime/md.
MAP = [
    ("concepts/md",        "concepts/"),
    ("concepts",           "concepts/"),
    ("charts",             "government-cloud/json/charts/"),
    ("tables",             "government-cloud/json/tables/"),
    ("crime/md/csv",       "crime/csv/"),
    ("crime/md",           "crime/"),
    ("crime/charts",       "crime/charts/"),
    ("crime/tables",       "crime/"),
    ("health/md/csv",      "public-health/csv/"),
    ("health/md",          "public-health/"),
    ("health/charts",      "public-health/charts/"),
    ("health/tables",      "public-health/"),
    ("site/terms",         "meta/"),
    ("site/glossary",      "glossary-site/"),
    ("site/documents",     "documents/"),
    (".",                  "government-cloud/json/"),   # manifest.json
]

# Site files that deliberately have no byte-identical twin, each with the reason
# and where the same content DOES live. A file may only be exempt if its content
# reaches the download by another route — never because matching it is awkward.
EXEMPT = {
    "government-cloud/briefs.json":
        "the same eight briefs ship as Markdown under government-cloud/briefs/, "
        "stamped with headers and an attributed copyright by sync_corpus_govcloud.py",
}

WORD = re.compile(r"\b[\w'-]+\b")


def site_files():
    for f in sorted(SITE.rglob("*")):
        if f.is_file() and not f.name.startswith("."):
            yield f


def zip_path_for(rel: pathlib.Path) -> str | None:
    parent = rel.parent.as_posix()
    for src, prefix in MAP:
        if parent == src:
            return prefix + rel.name
    return None


def basis_tiers():
    """{tier: count} across the concepts, read from lib/concepts.ts."""
    src = CONCEPTS_TS.read_text()
    tiers = {}
    for m in re.finditer(r'^\s*basis:\s*"(\w+)"', src, re.M):
        tiers[m.group(1)] = tiers.get(m.group(1), 0) + 1
    # every tier the type declares, including any with no entries
    dec = re.search(r"export type Basis\s*=([^;]+);", src)
    if dec:
        for t in re.findall(r'"(\w+)"', dec.group(1)):
            tiers.setdefault(t, 0)
    return tiers


def declared_axes():
    """The axis fields every Concept carries, read from the type declaration."""
    src = CONCEPTS_TS.read_text()
    m = re.search(r"export type Concept = \{(.+?)\n\};", src, re.S)
    if not m:
        raise SystemExit("could not find the Concept type in lib/concepts.ts")
    body = m.group(1)
    return [a for a in ("basis", "origin", "theme", "audience")
            if re.search(rf"^\s*{a}\??:", body, re.M)]


def main() -> int:
    if not ZIP.exists():
        print("FAIL: no corpus zip at " + str(ZIP))
        return 1

    with zipfile.ZipFile(ZIP) as z:
        entries = [n for n in z.namelist() if not n.endswith("/")]
        have = {n: z.read(n) for n in entries}

    problems, unmapped, checked, exempted = [], [], 0, 0

    # ---- 0. no path appears twice ---------------------------------------
    # zipfile permits duplicate names and only WARNS. On 28 August the terms
    # file was added to sync_corpus_site.py's build() without being added to its
    # PREFIXES, so the stale copy was carried forward and a fresh one appended:
    # the archive shipped two meta/IS_META_terms.md, stale one first, and which
    # a reader's unzip tool picked was its own business. Every check below
    # matches by name and was satisfied by either copy, so none of them saw it.
    seen = collections.Counter(entries)
    for name, n in sorted(seen.items()):
        if n > 1:
            problems.append(
                f"{name} appears {n} times in the download — a sync script is "
                "writing a path it does not also drop from the carried-forward zip"
            )

    # ---- 1. every site file, byte for byte -----------------------------
    for f in site_files():
        rel = f.relative_to(SITE)
        if rel.as_posix() in EXEMPT:
            exempted += 1
            continue
        target = zip_path_for(rel)
        if target is None:
            unmapped.append(rel.as_posix())
            continue
        if target not in have:
            problems.append(f"{rel} is served by the site and missing from the download")
            continue
        body = f.read_bytes()
        if have[target] != body:
            problems.append(
                f"{rel} differs from the download's {target} "
                f"(site {len(body):,} bytes, download {len(have[target]):,})"
            )
        checked += 1

    # ---- 2. every axis reaches the exported frontmatter -----------------
    axes = declared_axes()
    concept_md = {n: b.decode("utf8", "replace") for n, b in have.items()
                  if n.startswith("concepts/IS_CON_") and n.endswith(".md")
                  and "IS_CON_00_" not in n}
    if not concept_md:
        problems.append("the download carries no concept files at all")
    for name, text in sorted(concept_md.items()):
        head = text.split("---", 2)[1] if text.startswith("---") else ""
        for axis in axes:
            if not re.search(rf"^{axis}:", head, re.M):
                problems.append(f"{name} frontmatter has no `{axis}` — the site sorts on it and the download cannot")

    # ---- 3. the summary layer is present --------------------------------
    for const, where in [
        ("FINDINGS", "concepts/IS_CON_00_findings.md"),
        ("NOT_ESTABLISHED", "concepts/IS_CON_00_not-established.md"),
        ("SOURCE_YEARS", "concepts/source-years.csv"),
    ]:
        if where not in have:
            problems.append(
                f"{const} is read on the site and {where} is not in the download — "
                "run: node scripts/export_concepts_md.mjs && python3 scripts/sync_corpus_site.py"
            )
    src = CONCEPTS_TS.read_text()
    n_findings = len(re.findall(r'\{\s*stat:\s*"', src))
    if "concepts/IS_CON_00_findings.md" in have:
        got = have["concepts/IS_CON_00_findings.md"].decode("utf8", "replace").count("\n## ")
        # the findings file carries one h2 per finding plus the closing section
        if got - 1 != n_findings:
            problems.append(
                f"lib/concepts.ts has {n_findings} findings, the download's summary has {got - 1}"
            )
    if "concepts/source-years.csv" in have:
        rows = have["concepts/source-years.csv"].decode("utf8", "replace").strip().splitlines()
        n_src = len(re.findall(r"\{\s*year:\s*\d{4}", src))
        if len(rows) - 1 != n_src:
            problems.append(
                f"lib/concepts.ts has {n_src} dated sources, source-years.csv has {len(rows) - 1}"
            )

    # ---- 4. no disclaimer leaning on an empty tier ----------------------
    tiers = basis_tiers()
    empty = {t for t, n in tiers.items() if n == 0}
    for name, text in sorted(concept_md.items()):
        for t in empty:
            if re.search(rf"reject(?:s|ing)? every `{t}`", text):
                problems.append(
                    f"{name} tells the reader they may reject every `{t}` entry, and there are none — "
                    "the disclaimer is describing a taxonomy the archive no longer uses"
                )

    # ---- report ---------------------------------------------------------
    if unmapped:
        print("FAIL: content is served by the site with no route into the download.")
        print("      Add it to MAP in this script, or to EXEMPT with the reason and")
        print("      where the same content does reach a reader.")
        for u in unmapped:
            print("   " + u)
    if problems:
        print("FAIL: the download is not the archive the site is.")
        for p in problems:
            print("   " + p)
    if unmapped or problems:
        print()
        print("   Rebuild:  node scripts/export_concepts_md.mjs")
        print("             python3 scripts/sync_corpus_site.py")
        print("             python3 scripts/sync_corpus_govcloud.py")
        print("             python3 scripts/sync_corpus_crime.py")
        print("             python3 scripts/sync_corpus_health.py")
        print("             python3 scripts/build_corpus_index.py")
        return 1

    live = " · ".join(f"{t} {n}" for t, n in sorted(tiers.items(), key=lambda x: -x[1]))
    print(f"download matches the site — {checked} files byte for byte, "
          f"{len(concept_md)} concepts carrying {len(axes)} axes ({', '.join(axes)}), "
          f"summary layer present")
    print(f"                            basis tiers live: {live}"
          + (f" · {exempted} exempt" if exempted else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())

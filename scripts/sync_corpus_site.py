#!/usr/bin/env python3
"""Put the site-authored content into the downloadable corpus.

Owns everything that does NOT live under public/data/<section>/ — the content
that had no owner and therefore never reached the download:

    concepts/          16 concepts + an index    (from lib/concepts.ts)
    glossary-site/     ~20 site-authored terms   (from lib/site-content.ts)
    documents/         the source-document register
    research/          the RAW researched inputs — the rows and sources the
                       builders read from. Sean, 2026-08-24: "regardless of if
                       our UI includes information, I want the downloadable
                       corpus to include all data and resources that we've paid
                       for." The site renders a selection; this is the whole
                       input, so a reader can rebuild the findings rather than
                       take the rendered version on trust.

They were never there. The site has rendered sixteen concepts since August; the
corpus carried none of them, because no script owned them. They were exported
once (commit 7f21bdc, 17 August), that commit was reverted the same day, and
nothing has noticed for a week.

That is the failure this script exists to end: content that arrives by any route
other than `public/data/**` has had no owner, so it never reaches the download
and no test complains. Concepts now have an owner.

Run `node scripts/export_concepts_md.mjs` first — it regenerates the Markdown
from lib/concepts.ts. This only packs what that produced.

    python3 scripts/sync_corpus_concepts.py
    python3 scripts/sync_corpus_concepts.py --check
"""
import json
import pathlib
import shutil
import sys
import tempfile
import zipfile
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
MD = ROOT / "public/data/concepts/md"
GLO = ROOT / "public/data/site/glossary"
DOC = ROOT / "public/data/site/documents"
RESEARCH = ROOT / "research"
DOCS_DIR = ROOT / "docs"
ZIP = ROOT / "public/invisible-ships-corpus.zip"
PREFIXES = ("concepts/", "glossary-site/", "documents/", "research/")
PREFIX = "concepts/"


def build(dst: zipfile.ZipFile) -> int:
    files = sorted(MD.glob("*.md"))
    if not files:
        raise SystemExit(
            "no concept markdown at " + str(MD) +
            " — run: node scripts/export_concepts_md.mjs"
        )
    for f in files:
        dst.writestr(PREFIX + f.name, f.read_text())

    manifest = {
        "name": "Invisible Ships — Core Concepts",
        "generated": date.today().isoformat(),
        "count": len(files) - 1,          # the start-here file is not a concept
        "source": "lib/concepts.ts, exported by scripts/export_concepts_md.mjs",
        "basis_legend": {
            "documented": "a source, ruling or official record supports it directly",
            "structural": "it follows from what the dataset does or does not contain",
            "pattern": "an observation drawn from experience, offered as an observation",
        },
        "origin_legend": {
            "ai": "derived by AI analysis of the dataset",
            "author": "the author's own observation, from experience",
        },
        "reading_rule": (
            "A reader who rejects every `pattern` entry can still rely on every "
            "`documented` one. The two are never blended inside a single concept."
        ),
    }
    dst.writestr(PREFIX + "manifest.json", json.dumps(manifest, indent=1) + "\n")

    # site-authored glossary — the ~19 terms the corpus was short
    n_glo = 0
    for f in sorted(GLO.glob("*.md")):
        dst.writestr("glossary-site/" + f.name, f.read_text())
        n_glo += 1
    if n_glo:
        dst.writestr("glossary-site/README.md",
                     "# Site-authored glossary\n\n"
                     f"{n_glo} terms written for invisibleships.com to explain the work.\n"
                     "They are NOT extracted from the source document series and carry no\n"
                     "source-document id. Terms drawn from the primary record are in\n"
                     "`glossary/` and do carry one. Both sets appear on the site together.\n")

    # the source-document register
    n_doc = 0
    for f in sorted(DOC.glob("*.md")):
        dst.writestr("documents/" + f.name, f.read_text())
        n_doc += 1

    # ---- raw research inputs -------------------------------------------
    # Not rendered anywhere on the site. Included because it is the evidence
    # base the charts were built from, and a reader who wants to check the work
    # rather than believe it needs the inputs, not just the outputs.
    n_res = 0
    for f in sorted(RESEARCH.rglob("*")):
        if not f.is_file():
            continue
        if f.name.startswith(".") or f.suffix in (".pyc",):
            continue
        # the sweep ledger is working state, not research
        if "wayback-ledger" in f.name:
            continue
        # research/government-cloud/ is SOURCE for sync_corpus_govcloud.py, which
        # stamps each brief with a header and an attributed copyright and ships
        # it under government-cloud/. Copying the raw file here as well would put
        # an unstamped second copy in the download and give one file two owners —
        # the exact condition that let those briefs travel unattributed.
        if "government-cloud" in f.parts:
            continue
        dst.writestr("research/" + str(f.relative_to(RESEARCH)), f.read_text())
        n_res += 1
    for f in sorted(DOCS_DIR.glob("*.md")) if DOCS_DIR.exists() else []:
        dst.writestr("research/notes/" + f.name, f.read_text())
        n_res += 1
    if n_res:
        dst.writestr("research/README-research.md",
                     "# Raw research inputs\n\n"
                     "The researched rows and sources the site's builders read from, before\n"
                     "any chart or brief was made. The site renders a selection of this; the\n"
                     "whole input is here so the findings can be rebuilt and checked rather\n"
                     "than taken on trust.\n\n"
                     "These are working files. They carry the same terms as everything else\n"
                     "in this corpus — see `meta/IS_META_disclaimer.md`. Evidence tiers apply:\n"
                     "a row present here is not, by itself, a verified fact.\n")

    return len(files), n_glo, n_doc, n_res


def main(quiet: bool = False) -> None:
    if not ZIP.exists():
        raise SystemExit(f"corpus zip not found at {ZIP}")
    tmp = ZIP.with_suffix(".tmp.zip")
    with zipfile.ZipFile(ZIP, "r") as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        carried = 0
        for item in src.infolist():
            if item.filename.startswith(PREFIXES):
                continue
            dst.writestr(item, src.read(item.filename))
            carried += 1
        n, n_glo, n_doc, n_res = build(dst)
    shutil.move(str(tmp), str(ZIP))
    quiet or print(f"carried {carried} unrelated entries")
    quiet or print(f"concepts/: {n} markdown + manifest")
    quiet or print(f"glossary-site/: {n_glo} terms · documents/: {n_doc} register")
    quiet or print(f"research/: {n_res} raw input files")
    quiet or print(f"zip: {ZIP.stat().st_size:,} bytes")


def check() -> int:
    """Fail if the committed zip's concepts/ differs from a fresh build."""
    with tempfile.TemporaryDirectory() as tmpd:
        keep = pathlib.Path(tmpd) / "committed.zip"
        shutil.copy2(ZIP, keep)
        with zipfile.ZipFile(keep) as z:
            before = {n: z.read(n) for n in z.namelist() if n.startswith(PREFIXES)}
        main(quiet=True)
        with zipfile.ZipFile(ZIP) as z:
            after = {n: z.read(n) for n in z.namelist() if n.startswith(PREFIXES)}
        shutil.copy2(keep, ZIP)

    missing = sorted(set(before) - set(after))
    added = sorted(set(after) - set(before))
    changed = sorted(n for n in set(before) & set(after)
                     if before[n] != after[n] and not n.endswith("manifest.json"))
    if missing or added or changed:
        print("FAIL: site content in the corpus is out of date. Run:")
        print("  node scripts/export_concepts_md.mjs")
        print("  node scripts/export_site_content_md.mjs")
        print("  python3 scripts/sync_corpus_site.py")
        for n in added:
            print("   only in a fresh build: " + n)
        for n in missing:
            print("   only in the committed zip: " + n)
        for n in changed:
            print("   contents differ: " + n)
        return 1
    print(f"site content is current — {len(after)} entries match a fresh build")
    return 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else (main() or 0))

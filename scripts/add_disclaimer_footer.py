#!/usr/bin/env python3
"""Put the standing disclaimer on every markdown file the archive ships.

Why this exists
---------------
On 19 September an audit of the download found 840 markdown files, of which
**715 mentioned no disclaimer at all** — including 419 journal transcripts and
238 reference documents. A reader who opens one file out of the corpus, which is
exactly what a corpus is for, got a verbatim transcript with names in it and
nothing saying it is external communication the author disavows, accuses nobody,
and is unverified.

Nobody had noticed because `journal/` and `references/` exist ONLY inside the
zip. No script in this repository owns them and no source file generates them;
every sync carries them forward untouched, so they had never passed through an
exporter that could have added anything.

What it does
------------
Appends `DISCLAIMER_FILE_FOOTER` (from lib/disclaimer.ts, via
scripts/generated/disclaimer.json) to every markdown file, in two places:

  1. `public/data/**/*.md` — the files the site renders and the sync scripts
     copy into the zip. Doing it here keeps site and download byte-identical,
     which is what check_download_matches_site.py asserts.
  2. markdown inside the zip with no counterpart under public/data — the
     journal, the references, the glossary extracts, the source-document
     register.

It also adds `disclaimer: meta/IS_META_terms.md` to any YAML frontmatter that
lacks it, so a tool parsing the corpus sees the pointer without reading prose.

The content above the footer is never touched. The block is fenced by a rule and
a heading so a reader can see where the extracted document ends and the
archive's notice begins — the same rule the superseded banners follow: an
extract that has been rewritten is no longer an extract.

IDEMPOTENT. An existing footer is replaced rather than stacked, so this can run
after every content change, and a wording change in lib/disclaimer.ts propagates
by re-running it.

    node scripts/export_disclaimer.mjs      # first — refreshes the JSON
    python3 scripts/add_disclaimer_footer.py
    python3 scripts/add_disclaimer_footer.py --check
"""
import json
import pathlib
import re
import shutil
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
ZIP = ROOT / "public/invisible-ships-corpus.zip"
DATA = ROOT / "public/data"
# Repo directories that sync_corpus_site.py packs into the zip verbatim. They sit
# outside public/data, which is exactly the condition that let content reach the
# download with no owner in the first place, so they are covered here too.
ALSO = (ROOT / "research", ROOT / "docs")
GEN = ROOT / "scripts/generated/disclaimer.json"

# These three ARE the disclaimer, or are its superseded ancestors carrying a
# banner that points at it. Appending a short form under a full one reads as a
# mistake.
SKIP = {"meta/IS_META_terms.md", "meta/IS_META_disclaimer.md", "meta/IS_META_copyright.md"}

FOOTER = json.loads(GEN.read_text())["footer"]
TITLE = json.loads(GEN.read_text())["title"]
FM_LINE = "disclaimer: meta/IS_META_terms.md"

# Any previous footer, whatever its wording, so a change in lib/disclaimer.ts
# replaces rather than duplicates.
OLD = re.compile(r"\n*---\n\n## " + re.escape(TITLE) + r"\n.*\Z", re.S)


def apply(text: str) -> str:
    """Return the file with exactly one current footer and a frontmatter pointer."""
    body = OLD.sub("", text).rstrip("\n")

    # Frontmatter pointer, when the file has frontmatter at all.
    if body.startswith("---\n"):
        end = body.find("\n---", 4)
        if end != -1:
            head, rest = body[: end + 1], body[end + 1 :]
            if FM_LINE not in head:
                body = head + FM_LINE + "\n" + rest

    return body + "\n\n" + FOOTER + "\n"


def data_files() -> list[pathlib.Path]:
    files = list(DATA.rglob("*.md"))
    for extra in ALSO:
        if extra.exists():
            files += list(extra.rglob("*.md"))
    return sorted(files)


def main(check: bool = False) -> int:
    if not GEN.exists():
        print("FAIL: run `node scripts/export_disclaimer.mjs` first")
        return 1

    stale: list[str] = []

    # 1. the source files under public/data
    changed = 0
    for p in data_files():
        rel = str(p.relative_to(ROOT))
        if p.name in {n.split("/")[-1] for n in SKIP}:
            continue
        before = p.read_text(encoding="utf-8")
        after = apply(before)
        if before != after:
            stale.append(rel)
            if not check:
                p.write_text(after, encoding="utf-8")
                changed += 1

    # 2. markdown that lives only in the zip
    src = zipfile.ZipFile(ZIP)
    members = [n for n in src.namelist() if n.endswith(".md") and n not in SKIP]
    patched: dict[str, bytes] = {}
    for n in members:
        before = src.read(n).decode("utf-8")
        after = apply(before)
        if before != after:
            stale.append(f"zip:{n}")
            patched[n] = after.encode("utf-8")

    if check:
        src.close()
        if stale:
            print(f"FAIL: {len(stale)} files are missing the standing disclaimer or carry a stale one")
            for n in stale[:10]:
                print("   " + n)
            if len(stale) > 10:
                print(f"   ... and {len(stale) - 10} more")
            print("Run: node scripts/export_disclaimer.mjs && python3 scripts/add_disclaimer_footer.py")
            return 1
        print(f"disclaimer coverage: {len(members)} zip files + {len(data_files())} source files current")
        return 0

    if patched:
        tmp = ZIP.with_suffix(".zip.tmp")
        out = zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED)
        for info in src.infolist():
            out.writestr(info, patched.get(info.filename, src.read(info.filename)))
        out.close()
        src.close()
        shutil.move(str(tmp), str(ZIP))
    else:
        src.close()

    print(f"source files updated : {changed}")
    print(f"zip files updated    : {len(patched)}")
    print(f"zip now              : {ZIP.stat().st_size:,} bytes")
    print("Re-run: python3 scripts/sync_corpus_site.py && python3 scripts/build_corpus_index.py")
    return 0


if __name__ == "__main__":
    sys.exit(main(check="--check" in sys.argv))

#!/usr/bin/env python3
"""Add / refresh the `government-cloud/` briefs inside the downloadable corpus.

Why this exists
---------------
Every other body of work in the corpus has an owner: crime has
sync_corpus_crime.py, health has sync_corpus_health.py, concepts and the
site-authored glossary got theirs on 24 August. Government Cloud never had one.
Its eight briefs were dropped into the zip once and carried forward untouched by
whichever sync happened to run — which is exactly the "content arriving by
another route has no owner and no test" failure that build_corpus_index.py was
written to catch, and it slipped through because that guard counts whether files
ARRIVE, not whether they are well formed once they do.

The consequence, found by auditing the shipped zip on 25 August: the eight
briefs — roughly 8,000 words, the most commercially sensitive prose in the
archive — carried no metadata header, and their only copyright was a bare
"© 2026." with no name attached. An unattributed copyright protects nobody. Every
other file in the download says "© 2026 Sean C. Harris. All Rights Reserved."

What this does
--------------
  * Reads the briefs from research/government-cloud/briefs/ — IN the repository.
    The originals live in "Government Cloud Research/02-outputs/" outside it,
    and a build that reaches outside the repo works on exactly one machine. That
    lesson already cost a pipeline failure once, when four crime builders read
    their rows from /tmp.

  * Stamps the YAML header every corpus file carries, plus `method:` naming how
    the research was produced. Sean's Concepts already declare `origin: ai` vs
    `origin: author`; the briefs are AI-assisted research he commissioned and
    directed, and saying so is consistent with that. A reader can weigh the work
    knowing how it was made, which is the whole basis of this archive's claim to
    be trusted.

  * Rewrites the inline "© 2026." in the brief's own disclaimer to name the
    author. The header is stripped the moment someone pastes the prose into a
    chat window; the line inside the text is the only claim that survives that.

Run:  python3 scripts/sync_corpus_govcloud.py
      python3 scripts/sync_corpus_govcloud.py --check
"""
import pathlib
import re
import shutil
import sys
import tempfile
import zipfile
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "research/government-cloud"
ZIP = ROOT / "public/invisible-ships-corpus.zip"
# Two shapes: the seven-plus-one prompt briefs, and the top-level consolidated
# call-to-action. Both are Government Cloud prose and both were orphans.
GROUPS = [("briefs/", "government-cloud/briefs/", "brief"),
          ("", "government-cloud/", "overview")]

AUTHOR = "Sean C. Harris"
COPYRIGHT = "© 2026 Sean C. Harris. All Rights Reserved."
METHOD = "AI-assisted research, author-directed"

# The bare notice as it stands in the source prose, and what it becomes. Written
# as a regex over the year so a future re-run of the research does not silently
# stop matching and ship an unattributed file again.
BARE = re.compile(r"©\s*(20\d\d)\.(?!\s*All Rights Reserved)")
NAMED = r"© \1 " + AUTHOR + ". All Rights Reserved."

WORD_RE = re.compile(r"\b[\w'-]+\b")
DATE_RE = re.compile(r"research date (20\d\d-\d\d-\d\d)")


def slug(name: str) -> str:
    return name.replace(".md", "").replace("_", "-")


def title_of(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def stamp(path: pathlib.Path, kind: str = "brief") -> tuple:
    """Return (filename, stamped bytes). The prose is edited in exactly one
    way — the copyright notice gains a name. Nothing else about the research
    text is touched, so the shipped brief still diffs cleanly against the
    author's working copy in 02-outputs."""
    raw = path.read_text()
    if raw.lstrip().startswith("---"):
        raise SystemExit(
            f"{path.name} already carries a YAML header. This script owns the "
            f"header; a hand-written one means two owners and a silent conflict."
        )
    body, n = BARE.subn(NAMED, raw)
    if n == 0 and COPYRIGHT not in body:
        # No notice at all — MASTER-call-to-action.md shipped for weeks with
        # none. Append one rather than refusing: a file that reaches the
        # download must say whose it is, and the alternative to adding the line
        # is shipping without it.
        body = body.rstrip() + (
            "\n\n---\n\n*" + COPYRIGHT + " Independent research compiled from "
            "public records for informational purposes only — not legal, "
            "procurement, or investment advice.*\n"
        )
    m = DATE_RE.search(body)
    title = title_of(body, path.stem)
    header = "\n".join([
        "---",
        f"id: IS-GOV-{slug(path.name).upper()}",
        f"title: {title}",
        "collection: government-cloud",
        f"doc_type: {kind}",
        f"research_date: {m.group(1) if m else 'not stated in the brief'}",
        f"method: {METHOD}",
        "generated_by: scripts/sync_corpus_govcloud.py",
        f"word_count: {len(WORD_RE.findall(body))}",
        f"author: {AUTHOR}",
        f"copyright: {COPYRIGHT}",
        "---",
        "",
    ])
    return path.name, (header + body.strip() + "\n").encode()


def build() -> dict:
    """{zip path: stamped bytes} for everything this script owns."""
    if not SRC.exists():
        raise SystemExit(f"no Government Cloud sources at {SRC}")
    out = {}
    for sub, prefix, kind in GROUPS:
        d = SRC / sub if sub else SRC
        for f in sorted(d.glob("*.md")):
            name, data = stamp(f, kind)
            out[prefix + name] = data
    if not out:
        raise SystemExit(f"no markdown found under {SRC}")
    return out


def write(quiet=False) -> int:
    stamped = build()
    owned = set(stamped)
    tmp = ZIP.with_suffix(".tmp.zip")
    carried = 0
    with zipfile.ZipFile(ZIP, "r") as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            if item.filename in owned:
                continue          # replaced below — MERGE, never clobber
            dst.writestr(item, src.read(item.filename))
            carried += 1
        for name, data in stamped.items():
            dst.writestr(name, data)
    shutil.move(str(tmp), str(ZIP))
    if not quiet:
        n_brief = len([n for n in stamped if "/briefs/" in n])
        print(f"carried {carried} other entries")
        print(f"government-cloud/: {n_brief} briefs + {len(stamped) - n_brief} overview, "
              f"each stamped with a header and an attributed copyright")
        print(f"zip: {ZIP.stat().st_size:,} bytes")
    return 0


def check() -> int:
    if not ZIP.exists():
        print("FAIL: no corpus zip at " + str(ZIP))
        return 1
    stamped = build()
    problems = []
    with zipfile.ZipFile(ZIP) as z:
        names = z.namelist()
        have = {n: z.read(n) for n in names
                if n.endswith(".md") and n.startswith("government-cloud/")
                and not n.endswith("README-data.md")}
    for name, data in stamped.items():
        if name not in have:
            problems.append(f"{name} is missing from the corpus")
        elif have[name] != data:
            problems.append(f"{name} in the corpus differs from a fresh stamp")
    for name in have:
        if name not in stamped:
            problems.append(f"{name} is in the corpus but has no source under research/government-cloud/")
    if problems:
        print("FAIL: the Government Cloud files are out of date. Run:  python3 scripts/sync_corpus_govcloud.py")
        for p in problems:
            print("   " + p)
        return 1
    print(f"government-cloud briefs are current — {len(have)} stamped and attributed")
    return 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else write())

#!/usr/bin/env python3
"""Prove that a restructure deleted nothing.

Why this exists
---------------
Sean, 2026-08-26, on merging Data and Concepts: "do not delete one word, not
one character." A promise like that is worth nothing unless something fails
when it is broken. This is that something.

It records, for every body of content in the repo, a word count and a hash of
the normalised text. Additions are fine and expected — this is a working
archive. What it refuses is a DECREASE: if any tracked file loses words, or
disappears, `--check` fails and names it.

That asymmetry is the whole design. A guard that failed on any change at all
would be re-baselined out of habit within a day and would then be protecting
nothing. This one only ever fires on loss.

    python3 scripts/check_content_inventory.py            # write the baseline
    python3 scripts/check_content_inventory.py --check    # fail on any loss
    python3 scripts/check_content_inventory.py --update   # re-baseline, deliberately

Run --check AFTER the export and sync steps, since most tracked files are
generated from lib/*.ts by those scripts. Run it before and after any structural
change to the site. The baseline is committed, so the diff is reviewable.
"""
import sys, json, hashlib, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / "scripts" / "content-inventory.json"

# Every body of content, named. A new collection must be added here or it is
# not protected — the same rule the corpus completeness guard uses.
TRACKED = [
    ("concepts-source",   ["lib/concepts.ts"]),
    ("site-content",      ["lib/site-content.ts"]),
    ("concepts-md",       ["public/data/concepts/md/*.md"]),
    ("site-glossary",     ["public/data/site/glossary/*.md"]),
    ("site-documents",    ["public/data/site/documents/*.md"]),
    ("crime",             ["public/data/crime/**/*.md", "public/data/crime/**/*.csv"]),
    ("health",            ["public/data/health/**/*.md", "public/data/health/**/*.csv"]),
    ("government-cloud",  ["research/government-cloud/briefs/*.md"]),
    ("research-inputs",   ["research/**/*.json"]),
]

WORD = re.compile(r"\b[\w'-]+\b")

def measure(p: Path):
    t = p.read_text(encoding="utf-8", errors="replace")
    norm = " ".join(t.split())
    return {"words": len(WORD.findall(t)),
            "sha": hashlib.sha256(norm.encode()).hexdigest()[:16]}

def snapshot():
    out = {}
    for name, globs in TRACKED:
        coll = {}
        for g in globs:
            for p in sorted(ROOT.glob(g)):
                if p.is_file():
                    coll[str(p.relative_to(ROOT))] = measure(p)
        out[name] = coll
    return out

def total(coll): return sum(f["words"] for f in coll.values())

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--write"
    now = snapshot()

    if mode in ("--write", "--update"):
        if BASELINE.exists() and mode == "--update":
            old = json.loads(BASELINE.read_text())
            for name, coll in now.items():
                d = total(coll) - total(old.get(name, {}))
                if d: print(f"  {name:<20} {d:+,} words")
        BASELINE.write_text(json.dumps(now, indent=1, sort_keys=True) + "\n")
        g = sum(total(c) for c in now.values())
        n = sum(len(c) for c in now.values())
        print(f"content inventory written — {n:,} files, {g:,} words across {len(now)} collections")
        return 0

    if not BASELINE.exists():
        print("FAIL: no baseline. Run without --check first."); return 1

    old = json.loads(BASELINE.read_text())
    losses = []
    for name, coll in old.items():
        cur = now.get(name, {})
        for path, was in coll.items():
            is_ = cur.get(path)
            if is_ is None:
                losses.append(f"{name}: FILE GONE  {path}  (-{was['words']:,} words)")
            elif is_["words"] < was["words"]:
                losses.append(f"{name}: SHRANK     {path}  {was['words']:,} -> {is_['words']:,}")

    if losses:
        print("FAIL: content was lost.\n")
        for l in losses: print("  " + l)
        print(f"\n{len(losses)} loss(es). If a removal was intended, re-baseline with --update "
              "so the deletion is a reviewable line in the commit rather than a silent one.")
        return 1

    gained = sum(total(c) for c in now.values()) - sum(total(c) for c in old.values())
    print(f"content inventory: nothing lost — {sum(len(c) for c in now.values()):,} files, "
          f"{gained:+,} words since the baseline")
    return 0

if __name__ == "__main__":
    sys.exit(main())

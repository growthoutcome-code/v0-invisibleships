#!/usr/bin/env python3
"""Surface the Government Cloud research briefs on the site.

Why this exists
---------------
Eight briefs — 8,163 words, the longest prose in this archive — have shipped
inside the corpus download since August and have never been rendered on the
site. Nothing lost them; nothing ever routed to them. A reader could only find
them by downloading a 3MB zip and opening a folder.

What it does NOT do is write summaries. Every brief already opens with its own
standfirst — the bold line carrying its counts — and its own H2 sections. This
extracts those. A summary this script invented would be the one part of the
Government Cloud section with no source behind it.

    python3 scripts/build_govcloud_briefs.py
    python3 scripts/build_govcloud_briefs.py --check
"""
import sys, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "research" / "government-cloud" / "briefs"
OUT = ROOT / "public" / "data" / "government-cloud" / "briefs.json"

WORD = re.compile(r"\b[\w'-]+\b")
# "Prompt 2: Procurement, Contracts & Competitive Position" -> the part that reads
SHORT = re.compile(r"^Government Cloud\s*[—-]\s*Prompt\s*\d+[a-z]?\s*:\s*", re.I)

def parse(p: Path):
    raw = p.read_text(encoding="utf-8")
    body = re.sub(r"^---\n.*?\n---\n", "", raw, flags=re.S)  # drop any frontmatter
    lines = body.split("\n")

    title = next((l[2:].strip() for l in lines if l.startswith("# ")), p.stem)
    short = SHORT.sub("", title).strip() or title

    # The standfirst is the brief's own bold lede, the line carrying its counts.
    stand = ""
    for i, l in enumerate(lines):
        if l.startswith("# "):
            for l2 in lines[i + 1 : i + 8]:
                if l2.strip().startswith("**"):
                    stand = l2.strip()
                    j = i + 1 + lines[i + 1 :].index(l2)
                    while not stand.rstrip().endswith("**") and j + 1 < len(lines):
                        j += 1
                        stand += " " + lines[j].strip()
                    break
            break
    stand = stand.strip("* ").replace("**", "").strip()

    sections = [l[3:].strip() for l in lines if l.startswith("## ")]
    return {
        "id": p.stem.replace("-brief", ""),
        "file": p.name,
        "title": title,
        "short": short,
        "standfirst": stand,
        "sections": sections,
        "words": len(WORD.findall(body)),
        "body": body.strip(),
    }

def build():
    briefs = [parse(p) for p in sorted(SRC.glob("*.md"))]
    return {
        "generated_by": "scripts/build_govcloud_briefs.py",
        "note": ("Extracted verbatim from the briefs in research/government-cloud/briefs. "
                 "Standfirsts and section lists are the briefs' own; nothing here is summarised."),
        "count": len(briefs),
        "words": sum(b["words"] for b in briefs),
        "briefs": briefs,
    }

def main():
    data = build()
    if "--check" in sys.argv:
        if not OUT.exists():
            print("FAIL: briefs.json missing — run scripts/build_govcloud_briefs.py"); return 1
        cur = json.loads(OUT.read_text())
        if cur.get("briefs") != data["briefs"]:
            print("FAIL: briefs.json is stale — run scripts/build_govcloud_briefs.py"); return 1
        print(f"government cloud briefs: current — {data['count']} briefs, {data['words']:,} words")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1) + "\n")
    print(f"briefs.json written — {data['count']} briefs, {data['words']:,} words -> {OUT.relative_to(ROOT)}")
    for b in data["briefs"]:
        print(f"  {b['words']:>5,}w  {len(b['sections'])} sections  {b['short'][:58]}")
    return 0

if __name__ == "__main__":
    sys.exit(main())

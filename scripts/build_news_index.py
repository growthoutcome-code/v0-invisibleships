#!/usr/bin/env python3
"""Build public/data/news/index.json from the News item files.

Each item is one Markdown file in public/data/news/md/: a front-matter header
(title, publisher, source type, link, date, categories, stage) and the summary
as the body. The News page needs every item's header to draw its charts and
filters, but not the summaries, so this writes the headers alone into one small
index the page loads at once. A summary is read from its own file only when the
item is opened.

The files are the record. The index is derived from them and never edited.
--check rebuilds it in memory and fails if the file on disk differs, or if any
item carries a value outside the agreed categories (project/features/news.md,
decision 0015).

Run:  python3 scripts/build_news_index.py
      python3 scripts/build_news_index.py --check
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MD = ROOT / "public/data/news/md"
OUT = ROOT / "public/data/news/index.json"

SOURCE_TYPES = {"Official", "News", "Trade press", "Research"}
INDUSTRIES = {
    "Neurotechnology",
    "Biotechnology & health",
    "Artificial intelligence",
    "Government cloud & surveillance technology",
}
EVENTS = {
    "Espionage & foreign agents",
    "Technology theft & export control",
    "Transnational repression",
    "Murder for hire & violent plots",
    "Protests",
    "Global conflict",
    "Courts & litigation",
    "Regulation & law",
    "Contracts & deployments",
    "Research & breakthroughs",
    "Public health",
    "Reports & statistics",
}
STAGES = {"", "charged", "arrested", "arrested/charged", "pleaded guilty", "admitted",
          "convicted", "sentenced", "settled"}
SEP = " · "


def parse(path: pathlib.Path) -> dict:
    text = path.read_text()
    if not text.startswith("---\n"):
        raise ValueError(f"{path.name}: no front matter")
    end = text.find("\n---\n", 4)
    head = text[4:end]
    body = text[end + 5:]
    fm = {}
    for line in head.splitlines():
        k, _, v = line.partition(":")
        fm[k.strip()] = v.strip()
    # A summary exists when the body holds anything beyond the title, the source
    # line and the placeholder (the standing footer is not part of the summary).
    body = re.sub(r"\n*---\n\n## .*\Z", "", body, flags=re.S)
    prose = [p for p in body.split("\n\n")[2:] if p.strip() and p.strip() != "Summary not yet written."]
    split = lambda v: [x for x in (v or "").split(SEP) if x]
    return {
        "slug": fm["slug"],
        "file": path.name,
        "title": fm["title"],
        "date": fm.get("date", ""),
        "precision": fm.get("date_precision", ""),
        "publisher": fm.get("publisher", ""),
        "sourceType": fm.get("source_type", ""),
        "office": fm.get("issuing_office", ""),
        "url": fm.get("url", ""),
        "archivedUrl": fm.get("archived_url", ""),
        "industry": split(fm.get("industry")),
        "event": fm.get("event", ""),
        "country": fm.get("country", ""),
        "stage": fm.get("stage", ""),
        "related": split(fm.get("related")),
        "hasSummary": bool(prose),
    }


def build() -> tuple[list, list]:
    items, errors = [], []
    for p in sorted(MD.glob("*.md")):
        try:
            it = parse(p)
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
            continue
        if it["sourceType"] not in SOURCE_TYPES:
            errors.append(f"{p.name}: source_type {it['sourceType']!r}")
        if it["event"] not in EVENTS:
            errors.append(f"{p.name}: event {it['event']!r}")
        for x in it["industry"]:
            if x not in INDUSTRIES:
                errors.append(f"{p.name}: industry {x!r}")
        if it["stage"] not in STAGES:
            errors.append(f"{p.name}: stage {it['stage']!r}")
        if it["date"] and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", it["date"]):
            errors.append(f"{p.name}: date {it['date']!r}")
        if not it["url"].startswith("http"):
            errors.append(f"{p.name}: url {it['url']!r}")
        items.append(it)
    items.sort(key=lambda i: (i["date"] or "0000", i["slug"]), reverse=True)
    slugs = [i["slug"] for i in items]
    if len(slugs) != len(set(slugs)):
        errors.append("duplicate slugs")
    return items, errors


def main(check: bool) -> int:
    items, errors = build()
    if errors:
        print("FAIL: news items outside the agreed fields:")
        for e in errors[:20]:
            print("  -", e)
        return 1
    text = json.dumps(items, ensure_ascii=False, indent=0) + "\n"
    if check:
        if not OUT.exists() or OUT.read_text() != text:
            print("FAIL: public/data/news/index.json is stale — run `npm run corpus`")
            return 1
        print(f"news index matches its {len(items)} item files")
        return 0
    OUT.write_text(text)
    print(f"news index: {len(items)} items, {sum(i['hasSummary'] for i in items)} with summaries")
    return 0


if __name__ == "__main__":
    sys.exit(main("--check" in sys.argv))

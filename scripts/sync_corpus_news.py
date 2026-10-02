#!/usr/bin/env python3
"""Rebuild the news/ folder inside the downloadable corpus.

The item files under public/data/news/md/ are copied byte for byte, with the
index and a README generated from them, so the download carries exactly what the
News page shows (check_download_matches_site.py compares the bytes).

Run after any change under public/data/news/ (npm run corpus does):
    python3 scripts/sync_corpus_news.py
"""
import collections
import json
import pathlib
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
MD = ROOT / "public/data/news/md"
INDEX = ROOT / "public/data/news/index.json"
ZIP = ROOT / "public/invisible-ships-corpus.zip"
PREFIX = "news/"


def readme(items: list) -> str:
    by_type = collections.Counter(i["sourceType"] for i in items)
    by_event = collections.Counter(i["event"] for i in items)
    dated = sorted(i["date"] for i in items if i["date"])
    rows = "\n".join(f"| {k} | {v} |" for k, v in by_event.most_common())
    types = ", ".join(f"{v} {k.lower()}" for k, v in by_type.most_common())
    done = sum(i["hasSummary"] for i in items)
    return f"""# News — README

*Outside reporting and official releases, collected by invisibleships.com. Each
file is one item: a header with its publisher, date, link and categories, and a
summary written for this archive. The article itself belongs to its publisher
and is not reproduced; follow the link. Charges described in official releases
are allegations unless the item's `stage` says a person pleaded guilty, was
convicted or was sentenced. See `meta/IS_META_terms.md`.*

## What is here

- {len(items)} items, {dated[0] if dated else "—"} to {dated[-1] if dated else "—"}: {types}.
- {done} of {len(items)} carry a summary so far; the rest say so.
- `index.json` holds every item's header in one file, for counting and filtering.

## By kind of event

| Kind of event | Items |
|---|---|
{rows}

## Fields

`source_type` is Official, News, Trade press or Research. `industry` and
`related` may hold several values separated by " · ". `date_precision` is `month`
where the source gave only a month; those dates read as the first of the month.
`country` is the foreign state an official release itself names.
"""


def main():
    items = json.loads(INDEX.read_text())
    tmp = ZIP.with_suffix(".zip.tmp")
    with zipfile.ZipFile(ZIP, "r") as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        carried = 0
        for item in src.infolist():
            if item.filename.startswith(PREFIX):
                continue
            dst.writestr(item, src.read(item.filename))
            carried += 1
        n = 0
        for f in sorted(MD.glob("*.md")):
            dst.writestr(PREFIX + f.name, f.read_text())
            n += 1
        dst.writestr(PREFIX + "index.json", INDEX.read_text())
        dst.writestr(PREFIX + "README-news.md", readme(items))
    shutil.move(str(tmp), str(ZIP))
    print(f"carried {carried} other entries; news/: {n} items + index + README")


if __name__ == "__main__":
    main()

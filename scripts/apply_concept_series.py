#!/usr/bin/env python3
"""Concept series as relationships (Sean, 4 Oct 2026: "please make sure Supabase
and all our … schema or relationships is updated").

A series is defined once, in public/data/concepts/series.json (since 6 Oct
2026; before that in lib/concepts.ts). A concept may be in several series. This script carries it into the relationship data the site already
uses, the same way journal themes and glossary topics are stored. No new table
or column:

  categories      one row per series: slug "series-<key>", kind "series"
  doc_categories  one row per member concept
  links           reading order between consecutive members:
                  kind "series_next" (part n -> n+1) and "series_prev" (n+1 -> n)

Three copies:
  site data   public/corpus/rels.json (written here)
  download    each concept file's `series:` front-matter line and "Series:"
              line, written by scripts/export_concepts_md.mjs (checked here)
  Supabase    printed as SQL (--sql), run separately

Idempotent: re-running replaces every series row with what lib/concepts.ts says.

    python3 scripts/apply_concept_series.py            # apply to rels.json
    python3 scripts/apply_concept_series.py --check    # fail if out of step
    python3 scripts/apply_concept_series.py --sql      # print the Supabase statements
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECK, SQL = "--check" in sys.argv, "--sql" in sys.argv

# The one definition (Sean, 6 Oct 2026): public/data/concepts/series.json, in
# page order, each series in reading order. A concept may be in several.
data = json.load(open(os.path.join(ROOT, "public/data/concepts/series.json"), encoding="utf-8"))
SERIES = {}
for row in data["series"]:
    assert row["key"] not in SERIES, f"series key {row['key']} appears twice"
    assert len(set(row["concepts"])) == len(row["concepts"]), f"series {row['key']} lists a concept twice"
    SERIES[row["key"]] = {"title": row["name"], "ids": row["concepts"]}

# every concept a series names must exist
src = open(os.path.join(ROOT, "lib/concepts.ts"), encoding="utf-8").read()
known = set(re.findall(r'\n  \{\n    id: "([a-z0-9-]+)"', src[src.index("export const CONCEPTS"):]))
for key, s_ in SERIES.items():
    for cid in s_["ids"]:
        assert cid in known, f"series {key} lists {cid}, which is not a concept in lib/concepts.ts"

doc = lambda cid: f"IS-CON-{cid.upper()}"
cats = [{"slug": f"series-{k}", "kind": "series", "label": s["title"]} for k, s in SERIES.items()]
dcs = [{"document_id": doc(c), "category_slug": f"series-{k}"} for k, s in SERIES.items() for c in s["ids"]]
links = []
for k, s in SERIES.items():
    for a, b in zip(s["ids"], s["ids"][1:]):
        links.append({"from_id": doc(a), "to_id": doc(b), "kind": "series_next"})
        links.append({"from_id": doc(b), "to_id": doc(a), "kind": "series_prev"})
seen = set()
links = [l for l in links if not ((l["from_id"], l["to_id"], l["kind"]) in seen or seen.add((l["from_id"], l["to_id"], l["kind"])))]

if SQL:
    esc = lambda t: t.replace("'", "''")
    print("begin;")
    print("delete from document_links where kind in ('series_next', 'series_prev');")
    print("delete from document_categories where category_slug in (select slug from categories where kind = 'series');")
    print("delete from categories where kind = 'series';")
    if cats:
        print("insert into categories (slug, kind, label) values\n" + ",\n".join(f"  ('{c['slug']}', 'series', '{esc(c['label'])}')" for c in cats) + ";")
    if dcs:
        print("insert into document_categories (document_id, category_slug) values\n" + ",\n".join(f"  ('{d['document_id']}', '{d['category_slug']}')" for d in dcs) + ";")
    if links:
        print("insert into document_links (from_id, to_id, kind) values\n" + ",\n".join(f"  ('{l['from_id']}', '{l['to_id']}', '{l['kind']}')" for l in links) + ";")
    print("commit;")
    sys.exit(0)

rp = os.path.join(ROOT, "public/corpus/rels.json")
rels = json.load(open(rp, encoding="utf-8"))
def place(rows, mine, is_mine, before):
    """Drop our rows, then put the expected ones back just before the first
    row `before` matches (the glossary topics, which apply_glossary_topics.py
    keeps last), or at the end. Other scripts' rows keep their order."""
    rest = [r for r in rows if not is_mine(r)]
    i = next((k for k, r in enumerate(rest) if before(r)), len(rest))
    return rest[:i] + mine + rest[i:]

new_cats = place(rels["categories"], cats, lambda c: c.get("kind") == "series",
                 lambda c: c.get("kind") == "glossary_topic")
gt = {c["slug"] for c in rels["categories"] if c.get("kind") == "glossary_topic"}
new_dcs = place(rels["doc_categories"], dcs, lambda x: x["category_slug"].startswith("series-"),
                lambda x: x["category_slug"] in gt)
new_links = place(rels["links"], links, lambda l: l["kind"] in ("series_next", "series_prev"), lambda l: False)
# in step = our rows are exactly the expected ones (position is the other scripts' business)
ours = lambda rows, f: [r for r in rows if f(r)]
in_step = (ours(rels["categories"], lambda c: c.get("kind") == "series") == cats
           and ours(rels["doc_categories"], lambda x: x["category_slug"].startswith("series-")) == dcs
           and ours(rels["links"], lambda l: l["kind"] in ("series_next", "series_prev")) == links)
changed = not in_step or new_cats != rels["categories"]

# the download side is written by the concept exporter; check it carries the series
md_dir = os.path.join(ROOT, "public/data/concepts/md")
def fm_series(cid):
    t = open(os.path.join(md_dir, f"IS_CON_{cid}.md"), encoding="utf-8").read()
    m = re.search(r"^series: \[(.*)\]$", t, re.M)
    return [x.strip() for x in m.group(1).split(",")] if m else []
missing = [cid for k, s in SERIES.items() for cid in s["ids"] if k not in fm_series(cid)]

if CHECK:
    errs = []
    if not in_step: errs.append("public/corpus/rels.json series rows are out of step (run: python3 scripts/apply_concept_series.py)")
    if missing: errs.append(f"concept file(s) without their series line: {missing} (run: npm run corpus)")
    if errs:
        print("FAIL: concept series"); [print("  -", e) for e in errs]; sys.exit(1)
    print(f"concept series current — {len(SERIES)} series, {len(dcs)} concepts, {len(links)} links, in site data and download")
    sys.exit(0)

if missing:
    sys.exit(f"apply_concept_series: concept file(s) without their series line: {missing}. Run the concept export first.")
if changed:
    rels["categories"], rels["doc_categories"], rels["links"] = new_cats, new_dcs, new_links
    with open(rp, "w", encoding="utf-8") as f:
        json.dump(rels, f, ensure_ascii=False, separators=(",", ":"))
print(f"concept series: {len(SERIES)} series, {len(dcs)} concepts, {len(links)} links ({'written' if changed else 'already current'})")

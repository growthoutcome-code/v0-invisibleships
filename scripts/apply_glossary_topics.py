#!/usr/bin/env python3
"""Glossary topics (Sean, 30 Sep 2026: "What you've suggested is amazing. Let's get
that filter built out for the glossary").

Seven general topics, up to two per term, stored the same way as journal themes:
category rows of kind `glossary_topic`, linked to each term's document id. No new
table or column. Applied to all three copies:

  site data   public/corpus/rels.json  categories + doc_categories
  download    glossary/*.md `categories:` line (zip-only files), manifest.json, manifest.csv.
              glossary-site/*.md is written by scripts/export_site_content_md.mjs from the
              same table, so `npm run corpus` keeps it; this script only checks it.
  Supabase    printed as SQL (--sql), run separately

Idempotent: re-running replaces every glossary_topic tag with the table below.

    python3 scripts/apply_glossary_topics.py            # apply site data + download
    python3 scripts/apply_glossary_topics.py --check    # fail if either is out of step
    python3 scripts/apply_glossary_topics.py --sql      # print the Supabase statements

Rules: project/glossary-topics.md.
"""
import csv, io, json, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECK, SQL = "--check" in sys.argv, "--sql" in sys.argv

# One source: lib/glossary-topics.json (topic order = chip order in the panel).
_G = json.load(open(os.path.join(ROOT, "lib/glossary-topics.json"), encoding="utf-8"))
TOPICS, TAGS = _G["topics"], _G["tags"]
assert all(1 <= len(v) <= 2 and set(v) <= set(TOPICS) for v in TAGS.values())

if SQL:
    esc = lambda s: s.replace("'", "''")
    print("begin;")
    print("insert into categories (slug, kind, label) values")
    print(",\n".join(f"  ('{s}', 'glossary_topic', '{esc(l)}')" for s, l in TOPICS.items()))
    print("on conflict (slug) do update set kind = excluded.kind, label = excluded.label;")
    print("delete from document_categories where category_slug in (select slug from categories where kind = 'glossary_topic');")
    print("insert into document_categories (document_id, category_slug) values")
    print(",\n".join(f"  ('{d}', '{s}')" for d, ts in TAGS.items() for s in ts) + ";")
    print("commit;")
    sys.exit(0)

out = {"rels_rows": 0, "zip_files": 0, "manifest": 0}

# ---------- site data ----------
rf = os.path.join(ROOT, "public/corpus/rels.json")
rels = json.load(open(rf, encoding="utf-8"))
cats = [c for c in rels["categories"] if c.get("kind") != "glossary_topic"]
cats += [{"slug": s, "kind": "glossary_topic", "label": l} for s, l in TOPICS.items()]
dc = [x for x in rels["doc_categories"] if x["category_slug"] not in TOPICS]
dc += [{"document_id": d, "category_slug": s} for d, ts in TAGS.items() for s in ts]
rels_changed = cats != rels["categories"] or dc != rels["doc_categories"]
if rels_changed:
    out["rels_rows"] = sum(len(v) for v in TAGS.values())
    rels["categories"], rels["doc_categories"] = cats, dc
    if not CHECK:
        open(rf, "w", encoding="utf-8").write(json.dumps(rels, ensure_ascii=False, separators=(",", ":")))

# ---------- download ----------
zp = os.path.join(ROOT, "public/invisible-ships-corpus.zip")
z = zipfile.ZipFile(zp)
changes, seen, site_stale = {}, set(), False
for n in z.namelist():
    if not (re.match(r"^glossary(-site)?/IS_GLO_.*\.md$", n)):
        continue
    site = n.startswith("glossary-site/")
    t = z.read(n).decode("utf-8")
    m = re.search(r"^id: (.+)$", t, re.M)
    if not m:
        continue
    i = m.group(1).strip()
    assert i in TAGS, f"glossary file with no topics: {n} ({i})"
    seen.add(i)
    def fix(mm, ts=TAGS[i]):
        items = [x.strip() for x in mm.group(1).split(",") if x.strip() and x.strip() not in TOPICS]
        return "categories: [" + ", ".join(items + ts) + "]"
    t2 = re.sub(r"^categories: \[(.*)\]$", fix, t, count=1, flags=re.M)
    if t2 != t:
        if site:   # owned by the exporter: report, never patch the zip copy
            print(f"  {n}: categories out of step — run npm run corpus")
            site_stale = True
        else:
            changes[n] = t2
missing = set(TAGS) - seen
assert not missing, f"tagged ids with no file in the download: {sorted(missing)}"
out["zip_files"] = len(changes)

raw = z.read("manifest.json").decode("utf-8")
man = json.loads(raw)
for x in man:
    if x.get("id") in TAGS:
        x["categories"] = [c for c in (x.get("categories") or []) if c not in TOPICS] + TAGS[x["id"]]
new_man = json.dumps(man, ensure_ascii=False, indent=1 if raw.startswith("[\n {") else None) + ("\n" if raw.endswith("\n") else "")
if json.loads(new_man) == json.loads(raw):
    new_man = raw
rawc = z.read("manifest.csv").decode("utf-8")
nl = "\r\n" if "\r\n" in rawc else "\n"
rows = list(csv.reader(io.StringIO(rawc)))
H = rows[0]
ii, ci = H.index("id"), H.index("categories")
for r in rows[1:]:
    if len(r) > ci and r[ii] in TAGS:
        r[ci] = "; ".join([c.strip() for c in r[ci].split(";") if c.strip() and c.strip() not in TOPICS] + TAGS[r[ii]])
buf = io.StringIO()
csv.writer(buf, lineterminator=nl).writerows(rows)
for name, new_t, old in (("manifest.json", new_man, raw), ("manifest.csv", buf.getvalue(), rawc)):
    if new_t != old:
        changes[name] = new_t
        out["manifest"] += 1

if changes and not CHECK:
    tmp = zp + ".tmp"
    with zipfile.ZipFile(tmp, "w") as w:
        for info in z.infolist():
            data = changes[info.filename].encode("utf-8") if info.filename in changes else z.read(info)
            w.writestr(info, data, compress_type=info.compress_type)
    z.close()
    shutil.move(tmp, zp)

stale = rels_changed or bool(changes) or site_stale
if CHECK:
    if stale:
        print("glossary topics out of step:", out)
        sys.exit(1)
    print(f"glossary topics current — {len(TAGS)} terms, {len(TOPICS)} topics, in site data and download")
else:
    print("DONE" if stale else "already current", out)

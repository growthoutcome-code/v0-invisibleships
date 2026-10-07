#!/usr/bin/env python3
"""Nanotechnology journal theme (Sean, 7 Oct 2026): writes the tags listed in
scripts/data/theme_nanotechnology.json into the site data (rels.json) and the
download (journal/ categories line, manifest.json, manifest.csv). Idempotent.
--check fails if either copy has drifted from the list. Supabase: --sql prints
the rows to add, run by hand after the push.
"""
import sys, json, re, zipfile, shutil, csv, io, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = json.load(open(ROOT / "scripts/data/theme_nanotechnology.json", encoding="utf-8"))
SLUG, LABEL = SRC["theme"], "Nanotechnology"
IDS = [t["id"] for t in SRC["tags"]]
check, sql = "--check" in sys.argv, "--sql" in sys.argv
if sql:
    print(f"insert into categories (slug, kind, label) values ('{SLUG}', 'theme', '{LABEL}') on conflict (slug) do nothing;")
    vals = ", ".join(f"('{i}', '{SLUG}')" for i in IDS)
    print(f"insert into document_categories (document_id, category_slug) values {vals} on conflict do nothing;")
    sys.exit(0)
problems = []
rf = ROOT / "public/corpus/rels.json"; rels = json.load(open(rf, encoding="utf-8"))
if not any(c["slug"] == SLUG for c in rels["categories"]):
    problems.append("rels.json: theme category missing"); rels["categories"].append({"slug": SLUG, "kind": "theme", "label": LABEL})
have = {(x["document_id"], x["category_slug"]) for x in rels["doc_categories"]}
known = {x["document_id"] for x in rels["doc_categories"]}
for i in IDS:
    if i not in known: sys.exit(f"unknown document id {i}")
    if (i, SLUG) not in have:
        problems.append(f"rels.json: {i} untagged"); rels["doc_categories"].append({"document_id": i, "category_slug": SLUG})
if problems and not check:
    open(rf, "w", encoding="utf-8").write(json.dumps(rels, ensure_ascii=False, separators=(",", ":")))
zp = ROOT / "public/invisible-ships-corpus.zip"; z = zipfile.ZipFile(zp); changes = {}
for n in z.namelist():
    if not (n.startswith("journal/") and n.endswith(".md")): continue
    t = z.read(n).decode("utf-8"); m = re.search(r"^id: (.+)$", t, re.M)
    if not m or m.group(1).strip() not in IDS: continue
    def fix(mm):
        items = [x.strip() for x in mm.group(1).split(",") if x.strip()]
        return "categories: [" + ", ".join(items + ([] if SLUG in items else [SLUG])) + "]"
    t2 = re.sub(r"^categories: \[(.*)\]$", fix, t, count=1, flags=re.M)
    if t2 != t: changes[n] = t2; problems.append(f"download: {n} untagged")
raw = z.read("manifest.json").decode("utf-8"); man = json.loads(raw)
for x in man:
    if x["id"] in IDS and SLUG not in (x.get("categories") or []):
        x["categories"] = (x.get("categories") or []) + [SLUG]
new_man = json.dumps(man, indent=1 if raw.startswith("[\n {") else None) + ("\n" if raw.endswith("\n") else "")
rawc = z.read("manifest.csv").decode("utf-8"); nl = "\r\n" if "\r\n" in rawc else "\n"
rows = list(csv.reader(io.StringIO(rawc))); H = rows[0]; ii, ci = H.index("id"), H.index("categories")
for r in rows[1:]:
    if len(r) > ci and r[ii] in IDS:
        cs = [c.strip() for c in r[ci].split(";") if c.strip()]
        if SLUG not in cs: r[ci] = "; ".join(cs + [SLUG])
buf = io.StringIO(); csv.writer(buf, lineterminator=nl).writerows(rows)
for name, new_t, old in (("manifest.json", new_man, raw), ("manifest.csv", buf.getvalue(), rawc)):
    if new_t != old: changes[name] = new_t; problems.append(f"download: {name} untagged")
if changes and not check:
    tmp = str(zp) + ".tmp"
    with zipfile.ZipFile(tmp, "w") as w:
        for info in z.infolist():
            w.writestr(info, changes[info.filename].encode("utf-8") if info.filename in changes else z.read(info), compress_type=info.compress_type)
    z.close(); shutil.move(tmp, zp)
if check:
    if problems:
        print("FAIL: nanotechnology theme drifted:"); [print("  -", p) for p in problems[:20]]; sys.exit(1)
    print(f"nanotechnology theme: {len(IDS)} journal documents tagged in site data and download")
else:
    print(f"nanotechnology theme applied: {len(problems)} changes, {len(IDS)} documents")

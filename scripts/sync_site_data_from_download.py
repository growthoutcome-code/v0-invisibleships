#!/usr/bin/env python3
"""Keep the site's bundled corpus data in agreement with the downloadable corpus
(public/invisible-ships-corpus.zip). Rules: project/data-rules.md.

First run 29 Sep 2026, a one-time repair:

What differed on that run, and nothing else (verified 29 Sep):
  - 274 journal documents link audio by Drive IDs that died in the Dec 2025
    re-upload; the download carries the live IDs (16 Aug audio map).
  - 23 Aug 2025 R12 has no audio file anywhere; the download marks it
    "(recording unavailable)".
  - Two superseded extracts (IS-META-COPYRIGHT, IS-META-DISCLAIMER) carry a
    SUPERSEDED banner in the download.
27 Feb 2025 was held until Sean chose (29 Sep): version B, the Questions &
Comments block kept; it was then added to the download and Supabase.

For every document that exists in both: body_markdown <- the download's body
(front matter and standing disclaimer footer removed); audio_drive_id and
audio_url <- the download's header. rels.json audio[] follows the documents.
Writes with the files' existing serialisation, so a diff shows only real changes.

    python3 scripts/sync_site_data_from_download.py            # apply
    python3 scripts/sync_site_data_from_download.py --check    # fail if they differ (npm run check)
"""
import json, glob, re, sys, zipfile, os

SKIP = set()  # documents held for a decision; 27 Feb 2025 released 29 Sep (Sean: version B)
FOOT_H = "\n## Critical Disclaimer on Transcripts and Accusations\n"
FOOT_END = ("The full Critical Disclaimer, copyright and terms are in "
            "meta/IS_META_terms.md, and at https://www.invisibleships.com/disclaimer.")

def unq(v):
    v = v.strip()
    return v[1:-1] if len(v) >= 2 and v[0] == v[-1] == '"' else v

def parse(t):
    fm, body = {}, t
    m = re.match(r"---\n([\s\S]*?)\n---\n", t)
    if m:
        for ln in m.group(1).split("\n"):
            mm = re.match(r"([A-Za-z_]+):\s?(.*)", ln)
            if mm: fm[mm.group(1)] = unq(mm.group(2))
        body = t[m.end():]
    s = body.rstrip()
    if s.endswith(FOOT_END):
        i = s.rfind(FOOT_H)
        if i >= 0:
            head = s[:i].rstrip()
            if head.endswith("\n---"): head = head[:-4]
            body = head
    return fm, body.strip()

args = [a for a in sys.argv[1:] if not a.startswith("--")]
repo = args[0] if args else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
check = "--check" in sys.argv
z = zipfile.ZipFile(os.path.join(repo, "public/invisible-ships-corpus.zip"))
dl = {}
for n in z.namelist():
    if n.endswith(".md"):
        fm, b = parse(z.read(n).decode("utf-8"))
        if fm.get("id"): dl[fm["id"]] = (fm, b)

changed = {"body": 0, "audio": 0, "rels": 0}; files = []
for f in sorted(glob.glob(os.path.join(repo, "public/corpus/documents_*.json"))):
    raw = open(f, encoding="utf-8").read(); docs = json.loads(raw); touched = False
    for d in docs:
        if d["id"] in SKIP or d["id"] not in dl: continue
        fm, b = dl[d["id"]]
        if (d.get("body_markdown") or "").strip() != b and d.get("body_markdown") is not None:
            d["body_markdown"] = b; changed["body"] += 1; touched = True
        if "audio_drive_id" in fm:
            nid = fm["audio_drive_id"] or None; nurl = fm.get("audio_url") or None
            if d.get("audio_drive_id") != nid or d.get("audio_url") != nurl:
                d["audio_drive_id"], d["audio_url"] = nid, nurl; changed["audio"] += 1; touched = True
    if touched:
        files.append(f)
        if not check: open(f, "w", encoding="utf-8").write(json.dumps(docs, ensure_ascii=False))

rf = os.path.join(repo, "public/corpus/rels.json")
rels = json.loads(open(rf, encoding="utf-8").read())
for a in rels.get("audio", []):
    fm = dl.get(a.get("document_id"), ({}, ""))[0]
    if "audio_drive_id" in fm:
        nid = fm["audio_drive_id"] or None; nurl = fm.get("audio_url") or None
        if a.get("drive_id") != nid or a.get("url") != nurl:
            a["drive_id"], a["url"] = nid, nurl; changed["rels"] += 1
if changed["rels"]:
    files.append(rf)
    if not check: open(rf, "w", encoding="utf-8").write(json.dumps(rels, ensure_ascii=False, separators=(",", ":")))

# Removed journal pages must redirect somewhere real (lib/journal-redirects.json).
red_problems = []
rp = os.path.join(repo, "lib/journal-redirects.json")
if os.path.exists(rp):
    live = set()
    for f in glob.glob(os.path.join(repo, "public/corpus/documents_*.json")):
        live |= {d["id"].lower() for d in json.load(open(f, encoding="utf-8"))}
    for r in json.load(open(rp, encoding="utf-8"))["redirects"]:
        src = r["from"].rsplit("/", 1)[-1]; dst = r["to"]
        if src in live: red_problems.append(f"{r['from']} redirects away from a page that exists")
        if dst != "/journal" and dst.rsplit("/", 1)[-1] not in live: red_problems.append(f"{r['from']} -> {dst}, which does not exist")

if check:
    if red_problems:
        print("journal redirects are wrong:"); [print("  " + p) for p in red_problems]; sys.exit(1)
    if any(changed.values()):
        print("site data differs from the download:", changed, "in", [os.path.basename(f) for f in files])
        print("  run: python3 scripts/sync_site_data_from_download.py   (rules: project/data-rules.md)")
        sys.exit(1)
    held = f"; {len(SKIP)} held for a decision" if SKIP else ""
    print(f"site data matches the download (journal bodies and audio links{held})")
else:
    print("CHANGED", changed, "in", len(files), "files")

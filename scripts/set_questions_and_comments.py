#!/usr/bin/env python3
"""
Attach a Questions & Comments block to a journal document.

WHY THIS SCRIPT EXISTS. public/corpus/documents_*.json is the site's entire
data source and, until now, NOTHING PRODUCED IT. ingest.py writes to Supabase,
not to these files, so every journal edit had to be done by hand in two places
with nothing checking they agreed. That is the failure shape this project keeps
hitting: content arriving by a route no script owns.

So this script owns the route. It writes the SAME block to both:

  1. public/corpus/documents_NN.json          — what the website renders
  2. <md corpus>/<doc.path>                    — the markdown source of record

and refuses to write either unless it can write both. word_count is recomputed
from the new body so the corpus stays internally consistent.

IDEMPOTENT AND NON-DESTRUCTIVE. A document that already carries a Questions &
Comments block is refused, loudly, unless --replace is passed. Matching uses the
widened pattern — "Questions & Comments" AND "Questions and Comments" — because
an earlier audit missed a real block by only matching the ampersand and reported
a data-loss bug that did not exist.

Usage:
  python3 scripts/set_questions_and_comments.py IS-J01-20250227-ENTRY \
      scripts/blocks/IS-J01-20250227-ENTRY.md [--replace] [--dry-run]

After running: node scripts/export_terms_md.mjs is NOT needed, but
  python3 scripts/sync_corpus_site.py
  python3 scripts/check_download_matches_site.py
are, so the download and the site stay byte-identical.
"""
import json, os, re, sys, pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent
CORPUS = REPO / "public" / "corpus"
MD_ROOT = REPO.parent / "Transcripts MD v02 - Corpus and Project" / "invisible-ships-corpus"

QC = re.compile(r"Questions\s*(?:&|and)\s*Comments", re.I)


def load_chunks():
    man = json.loads((CORPUS / "_manifest.json").read_text())
    out = []
    for i in range(man["doc_chunks"]):
        p = CORPUS / f"documents_{i:02d}.json"
        out.append((p, json.loads(p.read_text())))
    return out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    replace = "--replace" in sys.argv
    dry = "--dry-run" in sys.argv
    if len(args) != 2:
        print(__doc__)
        return 2
    doc_id, block_path = args[0], pathlib.Path(args[1])

    block = block_path.read_text(encoding="utf-8").rstrip() + "\n"
    if not QC.search(block):
        print(f"refusing: {block_path} contains no Questions & Comments heading")
        return 1

    chunks = load_chunks()
    target = None
    for path, docs in chunks:
        for doc in docs:
            if doc.get("id") == doc_id:
                target = (path, docs, doc)
                break
        if target:
            break
    if not target:
        print(f"refusing: no document with id {doc_id} in the corpus")
        return 1
    path, docs, doc = target

    body = doc.get("body_markdown") or ""
    if QC.search(body) and not replace:
        print(f"refusing: {doc_id} already carries a Questions & Comments block.")
        print("Pass --replace only if you intend to overwrite the author's existing text.")
        return 1

    # The markdown source must exist BEFORE the JSON is touched, so a failure
    # can never leave the site ahead of the source.
    md_path = MD_ROOT / doc["path"]
    if not md_path.exists():
        print(f"refusing: markdown source not found at {md_path}")
        return 1
    md = md_path.read_text(encoding="utf-8")

    if replace and QC.search(body):
        cut = QC.search(body).start()
        line = body.rfind("\n", 0, cut) + 1
        body = body[:line].rstrip() + "\n"
    new_body = body.rstrip() + "\n\n" + block.rstrip()

    if QC.search(md) and not replace:
        print(f"refusing: markdown source already carries a block")
        return 1
    if replace and QC.search(md):
        cut = QC.search(md).start()
        line = md.rfind("\n", 0, cut) + 1
        md = md[:line].rstrip() + "\n"
    new_md = md.rstrip() + "\n\n" + block.rstrip() + "\n"

    words = len(re.findall(r"\S+", re.sub(r"[#*_`>\-]", " ", new_body)))

    print(f"{doc_id}")
    print(f"  body      {len(body):>7} -> {len(new_body):>7} chars")
    print(f"  word_count{doc.get('word_count'):>7} -> {words:>7}")
    print(f"  markdown  {md_path.relative_to(MD_ROOT.parent.parent)}")
    if dry:
        print("  DRY RUN — nothing written")
        return 0

    doc["body_markdown"] = new_body
    doc["word_count"] = words
    # Default separators + ensure_ascii=False round-trips these chunks BYTE FOR
    # BYTE — verified against documents_00.json. Any other formatting rewrites
    # the whole file and buries a one-document change in a 400-document diff.
    path.write_text(json.dumps(docs, ensure_ascii=False), encoding="utf-8")
    md_path.write_text(new_md, encoding="utf-8")
    print(f"  wrote {path.name} and the markdown source")
    print("  now run: python3 scripts/sync_corpus_site.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

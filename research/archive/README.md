# research/archive

The Wayback sweep's working state.

`wayback-ledger.json` — one entry per cited URL: the snapshot it resolved to,
the capture timestamp, and how it was obtained (`existing`, `saved`, or
`predates`). Written after every URL, so an interrupted run resumes without
re-requesting anything it already has.

The ledger is the reason the sweep is safe to stop and restart. Delete it and
the next run re-checks all 890 URLs from scratch — which is harmless, just slow.

Run it with:

    python3 scripts/wayback_sweep.py --check      # coverage, archives nothing
    python3 scripts/wayback_sweep.py --dry-run    # the work list
    python3 scripts/wayback_sweep.py              # the sweep

Faster with an archive.org account — generate S3 keys at
https://archive.org/account/s3.php and export IA_ACCESS_KEY / IA_SECRET_KEY
before running. The script reads them from the environment and never stores them.

---

## Critical Disclaimer on Transcripts and Accusations

Transcripts and statements recorded in this archive are external communications and do NOT represent the author's beliefs, views, or intent. Nothing here accuses, blames, or alleges malfeasance by any named person, company, or government body, and all of this information requires independent verification.

The full Critical Disclaimer, copyright and terms are in meta/IS_META_terms.md, and at https://www.invisibleships.com/disclaimer.

#!/usr/bin/env bash
#
# The Data/Crime pipeline, in the one order that produces correct output.
#
# Why this file exists
# --------------------
# On 2026-08-23 the deployed corpus shipped stale: it carried the pre-rewrite
# verdict and six-theme summaries while the site served seven. Nothing was
# broken — the ORDER was. build_crime_copy.py rewrites every plain-language
# block, and the corpus had been synced before it ran. The freshness guard
# passed because it too was run upstream of the thing that changes the files.
#
# So: the order is no longer something either of us remembers. It is here, the
# sync is the last step and not optional, and the check runs after the sync.
#
# Usage:  bash scripts/build_crime_all.sh
# Then:   npm run build && node scripts/test-data-roundtrip.mjs
#
set -euo pipefail
cd "$(dirname "$0")/.."

run () {
  printf '\n\033[1m▸ %s\033[0m\n' "$1"
  python3 "scripts/$1" > /tmp/crime-pipeline.log 2>&1 || {
    echo "FAILED — last 30 lines:"; tail -30 /tmp/crime-pipeline.log; exit 1; }
  tail -3 /tmp/crime-pipeline.log
}

# ---- data builders -------------------------------------------------------
# Order matters: tables first (it owns the shared source and indicator files
# and merges rather than clobbers), then the chart builders, then copy.
run build_crime_tables.py           # research/crime/crime_rows.json + crime_srcs.json
run build_crime_lanes.py            # research/crime/harass_rows.json
run build_crime_intl.py             # research/crime/intl/*.json
run build_crime_tr.py
run build_crime_milestones.py
run build_crime_burglary.py
run build_crime_incarceration.py
run build_crime_anomalies.py

# ---- the copy layer ------------------------------------------------------
# LAST of the content steps. Owns every plain-language statement on the page
# and enforces the word ceiling at build time. Anything that runs after this
# and touches chart JSON will silently undo it.
run build_crime_copy.py

# ---- downstream ----------------------------------------------------------
run inject_crime_track.py
run build_govcloud_report.py

# ---- the AI-readable layer ----------------------------------------------
# Must run AFTER build_crime_copy.py (it reads the plain-language statements)
# and BEFORE sync_corpus_crime.py (which packs the files it writes).
run build_corpus_md.py

# ---- everything the site holds that is NOT a data section ----------------
# Concepts and the site-authored glossary live in TypeScript, so no data-section
# script owns them — and for a week nothing did, which is why the download
# carried none of the 16 concepts. They have an owner now.
printf '\n\033[1m▸ concepts + site glossary\033[0m\n'
node scripts/export_concepts_md.mjs
node scripts/export_site_content_md.mjs

# ---- the corpus, and only then the guard ---------------------------------
# Not optional, and not before build_crime_copy.py. This is the step whose
# absence shipped a stale download.
run sync_corpus_crime.py

run sync_corpus_health.py
run sync_corpus_site.py
run build_corpus_index.py

printf '\n\033[1m▸ freshness + completeness checks\033[0m\n'
python3 scripts/sync_corpus_crime.py --check
python3 scripts/sync_corpus_site.py --check
python3 scripts/build_corpus_index.py --check

printf '\n\033[1;32mPipeline complete.\033[0m Next: npm run build && node scripts/test-data-roundtrip.mjs\n'

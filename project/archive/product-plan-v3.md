# Invisible Ships — Project Plan (v3)

*2026-08-24. Replaces `product-plan-v2.md` (2026-07-31), which still described the
access gate as forthcoming and predates the entire Data section.*

---

## 1. Where the site actually is

| Area | State |
|---|---|
| Access gate | **Live.** 3 steps, age attestation, session-scoped. |
| Journal | **Live.** 435 entries, month index, sort menu, full-width feed. |
| Glossary | **Live.** 36 terms, slugs, side nav. |
| Concepts | **Live.** 16 entries with origin + basis labels. |
| Disclaimer | **Live.** Modal + `/disclaimer` route, one shared component. |
| Data → Government Cloud | **Live.** Timeline, heatmap, registers, 660 sources. |
| Data → Public Health | **Live.** Suicide international, overdose, registers, 104 sources. |
| Data → Crime | **Live.** Nine sections, 9 charts, 565 rows, 197 sources. |
| Downloadable corpus | **Live.** 2.97 MB zip, freshness-guarded. |
| Site-integrity monitor | **Live.** Separate repo, alarm-tested. |
| AI chat ("Ask the Corpus") | **Parked.** Built, blocked on embeddings. |
| Supabase as source of truth | **Phase 1, unfinished.** Site still serves static. |

The Data section is now the largest thing on the site and the most rigorous. It
did not exist in v2 of this plan.

---

## 2. Tonight — Sean's task

**Wayback archive sweep.** 878 of 890 cited URLs still need a snapshot recorded.

```bash
cd ~/Documents/Claude/Invisible\ Ships/v0-invisibleships

# keys, into this shell only (nothing echoes as you paste — that is expected)
read -s "IA_ACCESS_KEY?access key: "; export IA_ACCESS_KEY
read -s "IA_SECRET_KEY?secret key: "; export IA_SECRET_KEY
echo "${IA_ACCESS_KEY:+access ok} ${IA_SECRET_KEY:+secret ok}"   # expect: access ok secret ok

# fire and forget — survives closing the window
nohup python3 scripts/wayback_sweep.py > /tmp/sweep.log 2>&1 &

# check on it whenever
tail -5 /tmp/sweep.log
python3 scripts/wayback_sweep.py --check
```

**If the header says `anonymous` instead of `S3 keys found`, the exports did not
land — that is the difference between ~1 hour and ~3.5.**

Afterwards, whenever convenient:

```bash
bash scripts/build_crime_all.sh && npm run build && node scripts/test-data-roundtrip.mjs
git add -A && git commit -m "Archive sweep: snapshots recorded" && git push
```

**What it does:** asks the Internet Archive whether each cited page has a snapshot
from after we read it; requests one where it doesn't; writes the result into the
source tables so every source row gains a second, quieter link.

**What it's worth:** insurance against citation rot. Three sources vanished from
their own publishers while the crime section was being written. It produces no
new finding — it protects findings already made.

**Interruptible.** The ledger is written after every URL; re-running continues
where it stopped. Coverage will not reach 100%: some publishers block the
crawler, and those rows correctly show no archive link.

---

## 3. The next decision — what gets built next

Four candidates. **This is the open question.**

### A. The next Data section
Crime is now the template: chart-led, nine sections, plain-language summaries,
guarded by the suite. Whatever subject comes next inherits all of it. *Highest
visible output; largest token spend.*

### B. Supabase Phase 1 — finish the repoint
Two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
plus a parity check on a preview branch. The read layer is already written and
falls back to static automatically. *Small, unblocks the exporter and eventually
the AI chat. Has been one step from done since 13 August.*

### C. Unlock the AI chat
Blocked only on Gemini embeddings — 1,306 chunks, free tier caps at ~35/min.
Billing is reportedly funded. *This was called "the flagship, most important" in
v2 and has been parked for three weeks.*

### D. Legal review of `/disclaimer`
Raised four times across sessions, never answered. The disclaimer is the document
every evidence tier, every "attributed not asserted" phrasing, and every chart
convention leans on. It grew a "How to read the charts" section on 22 August.
*Not a build task — an outside professional reading it once.*

**My recommendation: D, then B.** D because the entire editorial architecture
rests on a document nobody qualified has read, and that exposure grows with every
section added. B because it is genuinely small and has been almost-done for
eleven days.

---

## 4. The thing that is quietly costing the most

**The patch workflow.** The git proxy refuses `growthoutcome-code/v0-invisibleships`,
so nothing Claude commits can be pushed. Every change becomes: generate a patch →
write it to disk → Sean applies it → build → push. When a patch is generated
against a stale view of `origin/main` it fails, and the recovery is a `git am
--abort` cycle.

On 24 August alone that cost four failed applications and six abort cycles for
two commits of actual work.

**The fix is one setting:** add `v0-invisibleships` (and `invisibleships-monitor`)
to the session's authorized git sources. The monitor doc has been asking for this
since 5 August. It would remove the entire patch dance and most of the terminal
time.

*Until then, the rule on Claude's side: fetch origin, rebase, then generate — one
commit per patch, never a batch.*

---

## 5. Open threads, everything

| # | Thread | Owner | State |
|---|---|---|---|
| 1 | Wayback sweep run | Sean | tonight |
| 2 | Authorize repos for direct push | Sean | one setting, high leverage |
| 3 | Legal review of `/disclaimer` | Sean | asked 4×, unanswered |
| 4 | Supabase Phase 1 env vars + parity | Sean + Claude | one step from done |
| 5 | AI chat embeddings | Claude | blocked on Gemini billing |
| 6 | Monitor baseline re-approval | Sean | flags drift until pushed |
| 7 | Supabase audit migration | Claude | approved, not applied |
| 8 | Anonymous submissions intake | design | recommended separate project |
| 9 | Sapien Labs citation | Sean | Tier C — keep or cut |
| 10 | CSA Victoria YE-2026 spreadsheet | Claude | Excel-only, unreachable |
| 11 | YRBS 2025 | watch | cleared, unpublished, overdue |
| 12 | Social sharing / OG cards | roadmap | from v2, never built |
| 13 | Merch (Printful) | roadmap | from v2, never built |

---

## 6. Standing rules — carried forward

- **Charts first.** Every Data section opens with a chart; the plain-language
  summary sits underneath it. Now structurally enforced on Crime.
- **One idea per statement, under 35 words.** Enforced at build time.
- **Causes are attributed, never asserted.** Co-occurrence is not relation.
- **Absences carry the same weight as lines.** What nobody counts is a finding.
- **Lean on the disclaimer; do not restate it.** One pointer per section.
- **Every figure resolves to a tiered source.** A · documented, B · corroborated,
  C · claimed.
- **Datasets do not corroborate each other.** Crime does not evidence Gov Cloud,
  and the reverse.

---

## 7. What v2 got right and is still pending

Social sharing (OG cards, share links not excerpts, to match the copyright) and
merch were both in v2's roadmap and neither was built. Neither is urgent, but
both should stay visible rather than quietly disappearing — sharing in
particular, since the archive's problem is that nobody outside has engaged with
it, and there is currently no share affordance anywhere on the site.

That is worth saying plainly: **the site has no way for a reader to pass it on.**
For a project whose central frustration is a lack of outside acknowledgment, that
may be the highest-leverage unbuilt thing on this list.

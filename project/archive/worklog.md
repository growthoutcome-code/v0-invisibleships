# Invisible Ships — Worklog & Running Task List

*Companion to `official-plan.md`. The plan says where we're going; this says
where we are and what's already done. Read the first two sections to resume
work after any gap. Updated 2026-08-25.*

*This file is mirrored in the claude.ai Project so it travels between sessions.
This copy on disk is the one that survives being offline.*

---

## Where things stand right now

**`origin/main` = `ca772af`. FOUR COMMITS SIT UNPUSHED on the local `main`:**
`0658362`, `88060e9`, `9818c7f` and the retitle — concepts 18 and 19 plus the
"We're keeping you to ourselves" retitle. Nothing is live until:

```bash
cd ~/Documents/Claude/Invisible\ Ships/v0-invisibleships && npm run build && git push
```

That is the FIRST thing to do tomorrow. Working tree clean otherwise.
Test suite: 10 rounds, PASS.

**The corpus is complete, accurate and attributed.** 903 files, 802 Markdown,
~926,000 words, 3.2 MB. Every research body reaches the download; the export
dialog describes it correctly from generated counts; every content file carries
a metadata header and names its author.

**Nothing is mid-flight.** No half-applied patch, no branch waiting to merge, no
build step half-run. If you sit down cold, you start on the next thing rather
than finishing the last thing.

### The one command that tells you the truth

```bash
cd ~/Documents/Claude/Invisible\ Ships/v0-invisibleships
git log --oneline -1 && git status --short
npx next start -p 3100 & sleep 5
node scripts/test-data-roundtrip.mjs        # expect: RESULT: PASS
kill %1
```

If that ends `RESULT: PASS` with a clean tree, nothing is broken and nothing is
half-done, whatever you may have forgotten.

---

## Open loops

### Waiting on Sean — none are blocking, all have been open a while

| Item | Effort | Why it matters |
|---|---|---|
| ~~Authorize the repos for direct push~~ | **Not possible** | **Closed 2026-08-25.** There is no such setting — no UI, no command, no session panel. The proxy's own error names a fix that does not exist (Claude Code issues #76248, #84581). Nothing was ever waiting on you. See "The patch workflow" below. |
| **Legal review of `/disclaimer`** | One email + fee | Everything on the site rests on it; reviewed by nobody qualified. Raised six times, never answered. The only item with outside risk attached. |
| **Supabase env vars** | Minutes | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. One step from done since 13 Aug. |
| **Gemini billing (~$1)** | Minutes | The AI chat is built and indexed. This is the only thing blocking it. |
| **Wayback sweep** | Runs unattended | 878 of 890 cited URLs. Needs archive.org S3 keys. Link-rot insurance, not a dependency — skippable indefinitely. |
| **Disconnect `Downloads` from the session** | Seconds | Guarantees all work lands in the project folder rather than relying on my habit. |

### Next build — decided, not started

**Concepts presentation.** 16 exist in a flat list at `/concepts`, filterable by
basis and origin. That works at 16, walls at 40, and is unreadable at 80. Two
questions still unanswered, and they change the design:

1. How many are coming, and do they already exist written down somewhere?
2. Are they one kind of thing or two? The current 16 mix **arguments about the
   world** ("Fined in Europe, hired in America") with **warnings about reading
   the data** ("Co-occurrence is not cause"). The first wants browsing and
   sharing; the second wants to sit beside the chart it applies to.

### The patch workflow — settled, not a workaround

The cloud session cannot push to the repo and there is no setting that changes
that. Verified 25 Aug by attempting a real push and by searching the docs: the
"authorized repository set" the proxy refers to has no configuration path.

So patches are the workflow. They stopped being painful once two things changed:
every patch is now verified by resetting a clean clone to the exact commit on
`origin` and applying it there before sending, and they land in `05-delivery/`
rather than Downloads. Four consecutive patches applied first try.

**The real alternative, if the cycle ever grates:** run Claude Code locally on
the Mac. No proxy, no patches — it commits and pushes with your own credentials.
Tradeoff: it runs on your machine rather than continuing while the laptop sleeps.
Worth trying on a quiet evening, not mid-task.

### Deferred, named so they aren't forgotten

Next data section (reach before depth) · Merch · Anonymous submissions intake ·
Sapien Labs Tier C citation · CSA Victoria YE-2026 (Excel-only) · YRBS 2025
(cleared, unpublished) · Monitor baseline re-approval · Supabase audit migration.

---

## What shipped

Newest first. Grouped by thread, because the commit log interleaves five of them.

### The downloadable corpus — 24–25 August

The through-line: the corpus was silently losing content, and nothing checked.

- **Concepts restored.** 16 concepts were exported on 17 Aug and the commit was
  reverted the same day. The site kept them; the download lost them. Nobody
  noticed for a week.
- **Site-authored glossary added.** ~20 terms written for the site had no export
  path at all — the corpus shipped 18 of ~37 terms.
- **Data sections became Markdown.** Crime and Public Health had shipped as JSON
  schemas. Now: briefs, registers, chart findings and CSVs a person can hand to
  an assistant.
- **Research inputs included.** The raw rows the charts were built from.
- **`START-HERE.md`.** A real index — which folder answers which question.
- **Completeness guard.** Enumerates every body of content in the repo and
  asserts a counterpart in the zip. Proven by deleting a concept and watching it
  fail.
- **Export dialog rewritten** to describe the archive from generated counts.
  The old copy named two sections and had never learned about Crime, Concepts or
  the research inputs. Two guards: the summary must match the zip, and the
  rendered dialog must match the summary.
- **Government Cloud got an owner.** Its 8 briefs — ~8,000 words, the most
  commercially sensitive prose in the archive — had no metadata header and a
  copyright reading only "© 2026." with no name. Now stamped, with
  `method: AI-assisted research, author-directed`, and the notice inside the
  prose names the author so it survives being pasted somewhere.
- **Well-formedness guard.** The completeness check asked "did the file arrive."
  It now also asks "does it carry a header and name its author." That is the
  check whose absence let eight files travel unattributed.

### Crime section — 20–24 August

- Rebuilt from 20 loose sidebar entries into **nine sections, each owning a
  chart**, charts first with plain-language summaries underneath.
- Homicide (two official measures, never reconciled), international comparison,
  break-ins, arrests, incarceration, ICE detention, reports of the unexplained.
- **The honest verdict shipped:** crime did not rise overall. Overdose deaths
  kept and labelled as a health outcome, not an offence.
- Dismissible findings notice stating the result and the accuracy limit, linking
  the disclaimer.
- **The strongest finding is structural:** organised harassment has no category,
  so its absence from the data proves nothing.

### Public Health — 19–20 August

- Suicide, overdose and surrounding indicators; 188 indicator rows, 104 tiered
  sources.
- One international suicide chart: **the US rose 40% while the world fell 27%.**
- Overdose series extended to 2025 on national statistics, with the basis change
  marked on the plot.
- Five concepts added, each linked from the chart it explains.

### Archive & provenance — 23 August

- `wayback_sweep.py`: snapshots every cited source, records the capture date,
  and marks a snapshot that **predates** our access rather than passing it off
  as evidence.
- Three bugs found and fixed in the process — scraped timestamps, unconfirmed
  captures read as refusals, and the daily capture cap misread as a rejection.

### Infrastructure & UI — 22–25 August

- **Test suite** now 10 rounds, and portable: it had hardcoded a container-only
  browser path, so it could never have run on your Mac.
- **Research inputs moved out of `/tmp`** — four builders read rows from files
  that existed only in the container that made them.
- **One reading measure** across the site; **one modal width scale**
  (sm/md/lg/xl) replacing five bespoke widths.
- **Modal heights bounded** with pinned footers — a tall dialog was putting its
  primary button off-screen.
- **Date-stamp churn fixed** twice: CSV line endings, and a README date that
  made the freshness guard cry drift daily.

---

## Standing rules — unchanged

- **No extraterrestrial or spirit-world material. Ever.** Sean, 2026-08-26, and
  it is not a matter of framing or labelling: the site reports facts, transcripts
  and research. A concept along those lines was proposed and then killed by a
  count of Sean's own journal — extraterrestrials appear in 8 of 448 files. Do
  not raise it again, and do not write it if asked.
- **Bullhorn-derived concepts are framed as QUESTIONS.** Sean, 2026-08-26.
  Material reported from the bullhorn is unresolved, so it takes the question
  form (`has-an-attack-happened` is the template). Documented findings stay as
  statements — a fact with four regulators behind it is not an open question.
- **Repetition is not corroboration.** A pattern of statements through the
  bullhorn is ONE source saying something many times, not many sources. Every
  statement needs independent verification regardless of how often it recurs.
  Same logic as "datasets do not corroborate each other", applied to testimony.
- **The author reports, he does not assert.** Bullhorn material is recorded as
  accusation and attribution, never adopted. "This was communicated to me, on
  this date" is testimony and takes `pattern` basis. "The system functions by X"
  is a claim about the world and needs a source, even when X is what he was told.
- **Charts first**, plain-language summary underneath. Enforced structurally.
- **One idea per statement, under 35 words.** Enforced at build time.
- **Causes are attributed, never asserted.** Co-occurrence is not relation.
- **Absences carry the same weight as lines.**
- **Every figure resolves to a tiered source.** A documented · B corroborated ·
  C claimed.
- **Datasets do not corroborate each other.**
- **MERGE, never clobber** — a builder replaces its own rows and keeps others'.
- **Every body of content has an owner script and a `--check`.** No owner is how
  content goes missing, and how it travels unattributed.
- **Patches:** fetch origin, rebase, one commit per patch, verify against a
  clean clone before sending. This is the permanent workflow for cloud sessions,
  not a temporary one — see below.

---

## Where things live — three places, not two

| Where | What | Reachable |
|---|---|---|
| **This folder** (`Documents/Claude/Invisible Ships/`) | The repo, research, patches, these planning docs | Always, offline, yours |
| **The claude.ai Project** | Mirrors of the planning docs, plus session notes and findings | Any Claude session, any device |
| **`~/Downloads`** | Nothing of ours. Keep it that way. | — |

```
Documents/Claude/Invisible Ships/
├── v0-invisibleships/              the site (git)
├── official-plan.md                where we're going
├── worklog.md                      where we are  <- this file
├── 05-delivery/                    site-wide patches
├── Crime Research/05-delivery/     crime patches
├── Public Health Research/05-delivery/
├── Government Cloud Research/      prompts, outputs, dataset
└── Archive/, _to_delete/           old material
```

---

## Rebuilding everything

```bash
bash scripts/build_crime_all.sh          # pipeline in the right order
npm run build
npx next start -p 3100 & node scripts/test-data-roundtrip.mjs
```

The pipeline order matters and is written down in that script because getting it
wrong once shipped a stale corpus. The corpus checks run at the end, inside the
suite, so forgetting is no longer possible.

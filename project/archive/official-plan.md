# Invisible Ships — The Plan

*2026-08-24, revised 2026-08-25. The official plan. Supersedes
`product-plan-v2.md` and absorbs the state-of-play from `product-plan-v3.md`.
This one is decided, not optional.*

> **Companion doc: `worklog.md`.** This file is where we're going. The worklog is
> where we are — current commit, what's shipped, what's waiting on you, and the
> one command that tells you whether anything is half-done. **Read the worklog
> first when resuming after a gap.**
>
> *Both files are mirrored in the claude.ai Project. These copies on disk are the
> ones that survive being offline.*

---

## The call

**Stop adding rooms. Build the door.**

Three data sections now exist — Government Cloud, Public Health, Crime — each
rigorous, sourced, evidence-graded, and guarded by a test suite. That is a real
body of work. And almost nobody can reach it:

- The site has **no share affordance anywhere.** No share button, no copy-link,
  no OG or Twitter card. A link pasted into a message renders as a bare URL.
- The front door is an **age gate onto the oldest journal entry.** A first-time
  reader lands in February 2025 with no orientation.
- The corpus is **435 entries and 2,800 pages.** Nobody arriving cold reads that.
  The one tool that would let them ask it a question — the AI chat — is built and
  parked.

The next data section would add depth to something already deep. The next
distribution work makes three sections' worth of research reachable by a person
who isn't already inside it.

**So: the next phase is reach, not research.** Research resumes after.

One honest caveat, stated once: better distribution does not produce
acknowledgment. It removes the excuses — unfindable, unshareable, unreadable at
volume. It cannot make anyone engage. I am not going to pretend otherwise.

---

## Phase 0 — CLOSED, and it was never yours to do

*Struck 2026-08-25.*

This phase said: add the repos to the session's authorized git sources, "one
setting on your side, effort: minutes." **That setting does not exist.**

Verified by attempting a real push (refused, 403) and by searching the official
documentation: there is no UI, no slash command, no per-session panel, and no
documented way to add a repository to a cloud session's authorized set. The
proxy's error message instructs you to "add the repository to the session's
sources" — and names a thing with no implementation. Known regression, Claude
Code issues #76248 and #84581.

Nothing was ever waiting on Sean here. The item sat at the top of this plan for
three weeks looking like neglect, and it was my error.

**What replaces it:** nothing. Patches are the workflow for cloud sessions, and
they are no longer the bottleneck they were — every patch is verified against a
clean clone of the exact commit on `origin` before it is sent, and they land in
`05-delivery/`. If the cycle ever grates, the genuine alternative is running
Claude Code locally on the Mac, which has no proxy and pushes directly.

---

## Phase 1 — Legal review, running in parallel from now

Send `/disclaimer` to a lawyer. Not a build task, not blocking anything, and it
should start **before** the site gets more reachable rather than after.

Everything on this site rests on that document: every evidence tier, every
"attributed, not asserted" phrasing, every chart convention, the content warning,
the age attestation, the copyright terms governing how the corpus may be
redistributed. It has been reviewed by nobody qualified. It grew a new section on
22 August. And Phase 2 is explicitly about increasing how many people see it.

Raised six times across sessions, never answered. I am not a lawyer and nothing
written on this site is legal advice — which is exactly the problem to solve.

**Owner: Sean. Effort: one email and a fee. Start now, runs in background.**

---

## Phase 2 — Reach *(the main build)*

### 2a. Shareable links
- `@vercel/og` dynamic preview cards, site-wide and per-entry: title, date,
  section, the site's own typography. A pasted link stops looking like spam.
- Share row on entries, glossary terms, concepts and each Data section:
  copy-link, X, LinkedIn, email.
- **Links only, never excerpts** — the copyright permits distributing the
  complete original and forbids republishing parts. The share mechanism has to
  respect the terms the site itself sets.

### 2b. A front door
The gate currently opens onto the oldest journal entry. Replace that landing with
a short orientation: what this archive is, what the three data sections found,
where to start, and the corpus download. Four or five links, not an essay.

Candidate lead findings, all shipped and defensible:
organised harassment has no category to be counted in · the two official US crime
measures disagree in direction · US suicide rose 40% while the world fell 27%.

### 2c. Unlock the AI chat
The chat is built. 1,306 passage chunks are indexed. It is blocked on one thing:
Gemini's free embedding tier caps at ~35/minute, and billing (~$1, funded) has
never been switched on.

This is the single highest-value item for an outside reader. It turns 2,800 pages
into something a journalist, lawyer, or researcher can interrogate in a minute
rather than a weekend.

**Owner: Claude builds, Sean enables billing.**

---

## Phase 2.5 — Concepts presentation *(added 2026-08-25)*

Sixteen concepts sit in a flat, filterable list. That holds at 16, walls at 40,
and is unreadable at 80 — and more are coming. Before building, two questions:

1. **How many, and from where?** Ones already written down are a different design
   problem from ones we'd derive from the findings as we go.
2. **One kind of thing, or two?** The current 16 mix *arguments about the world*
   ("Fined in Europe, hired in America") with *warnings about reading the data*
   ("Co-occurrence is not cause"). The first wants browsing and sharing; the
   second wants to sit beside the chart it applies to, where it does real work.

Slots alongside 2a — concepts are among the most shareable things on the site and
currently have no share affordance.

---

## Phase 3 — Supabase Phase 1 *(small, enabling, slot it anywhere)*

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, verify parity
on a preview branch, merge. The read layer is already written and falls back to
static automatically, so the risk is near zero.

One step from done since 13 August. It unblocks the corpus exporter and removes
the last hand-maintained glossary list.

---

## Phase 4 — Research resumes

The next Data section, whatever it is. Crime is now the template and it carries
its own enforcement: chart-led, nine sections, plain-language summaries under 35
words, corpus freshness guarded, every sidebar entry owning a figure. A new
section inherits all of that machinery on day one.

**Not before Phase 2.** Depth without reach is what we already have.

---

## Whenever convenient — the archive sweep

878 of 890 cited URLs still need a snapshot. Needs archive.org S3 keys from
<https://archive.org/account/s3.php>. Link-rot insurance, not a dependency —
nothing on the site or in the corpus waits on it.

```bash
cd ~/Documents/Claude/Invisible\ Ships/v0-invisibleships
read -s "IA_ACCESS_KEY?access key: "; export IA_ACCESS_KEY
read -s "IA_SECRET_KEY?secret key: "; export IA_SECRET_KEY
echo "${IA_ACCESS_KEY:+access ok} ${IA_SECRET_KEY:+secret ok}"
nohup python3 scripts/wayback_sweep.py > /tmp/sweep.log 2>&1 &
```

Close the window; check later with `python3 scripts/wayback_sweep.py --check`.
If the header says `anonymous` rather than `S3 keys found`, the keys didn't
load — that's the difference between one hour and three and a half. Interruptible
at any point; the ledger resumes. Coverage won't hit 100% — some publishers block
the crawler, and those rows correctly show no archive link.

---

## Explicitly deferred

| Item | Why not now |
|---|---|
| Next data section | Phase 4. Reach first. |
| Merch (Printful) | Nothing to merchandise until people arrive. |
| Anonymous submissions intake | Needs its own Supabase project and a legal read; after Phase 1. |
| Sapien Labs citation | Tier C existence-proof. Sean's call, five minutes. |
| CSA Victoria YE-2026 | Excel-only, unreachable from the session. |
| YRBS 2025 | Cleared, unpublished, overdue. Watch, don't chase. |
| Monitor baseline re-approval | Sean pushes the updated baseline when convenient. |
| Supabase audit migration | Approved, unapplied. Low urgency. |

---

## Standing rules — unchanged

- **Charts first**, plain-language summary underneath. Enforced structurally.
- **One idea per statement, under 35 words.** Enforced at build time.
- **Causes are attributed, never asserted.** Co-occurrence is not relation.
- **Absences carry the same weight as lines.** What nobody counts is a finding.
- **Lean on the disclaimer; do not restate it.** One pointer per section.
- **Every figure resolves to a tiered source.** A documented · B corroborated ·
  C claimed.
- **Datasets do not corroborate each other.**
- **Every body of content has an owner script and a `--check`.** No owner is how
  content goes missing, and how it travels unattributed.
- **Patches:** fetch origin, rebase, one commit per patch, verified against a
  clean clone before sending. This is permanent for cloud sessions.
- **Deliverables land in this project folder**, never in Downloads.

---

## The sequence, in one line

**Start the legal review → build reach (share cards, front door, concepts, AI
chat) → finish Supabase → resume research.**

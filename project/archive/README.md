# Archive — the planning docs that came before `project/`

These five files were loose in `~/Documents/Claude/Invisible Ships/`, next to the
repository rather than inside it, and outside version control. They are the generation
of planning that `project/` replaced. They are here verbatim, with their original dates,
because they hold reasoning that is still worth reading and because a document nobody
can find is the problem `project/` exists to solve.

**Nothing in this folder describes the present.** Every file here is a snapshot of a day
in August 2026. `project/roadmap.md` is the current state; `project/features/` is the
work in flight; `project/decisions/` is what was settled and why. If a file here
disagrees with one of those, the file here is wrong and out of date, not a second
opinion.

That warning is not decoration. `worklog.md` opens by stating which commit `origin/main`
points at and how many commits are unpushed, as of 25 August. Read cold, that reads like
today's status. It is not.

## What each one is

| File | Dated | What it is | Status |
|---|---|---|---|
| `official-plan.md` | 24–25 Aug | "Stop adding rooms. Build the door." The decision to stop expanding the archive and finish the entry path. | **Superseded** by `project/roadmap.md`. The call itself still stands. |
| `worklog.md` | 25 Aug | Companion to the above: what was shipped, what was waiting, and the commit position. | **Superseded** by `project/roadmap.md`. Its commit numbers are historical. |
| `product-plan-v3.md` | 24 Aug | A state-of-the-site table, area by area. | **Historical.** Useful as a record of what was live in August; several rows are now wrong (the gate no longer has age attestation, for one). |
| `charting-viz-stack-decision.md` | 16 Aug | Recommends visx + react-force-graph + react-simple-maps, for maps, network graphs and bespoke visuals. Explicitly not for standard charts. | **Live and unexecuted.** No charting library is installed. See the note below. |
| `d3-pilot-plan.md` | 16 Aug | A branch-only pilot to validate that stack against real data before committing to it. | **Live and never started.** |

## A note on the charting decision, so it is not read as ignored

`charting-viz-stack-decision.md` chose a library stack, and `/insights` was then built
with a hand-written inline SVG chart and no library at all. That is not a reversal. The
decision scoped itself to maps, relationship graphs and bespoke interactive work, and
said in as many words that standard charts were not what it was for. A line chart over
a few dozen daily counts is a standard chart: it is about forty lines of arithmetic,
it is guarded by `scripts/check_axis_ticks.mts`, and a library for it would have shipped
more bytes than the whole page.

The decision is still the right one for the visualisations it was written about, none of
which have been built yet.

## The originals

The copies at the root of `~/Documents/Claude/Invisible Ships/` are still there; nothing
was deleted. They can go whenever Sean wants, and these are the versions to keep. The
same documents are also mirrored in the claude.ai Project, which is where they were
written.

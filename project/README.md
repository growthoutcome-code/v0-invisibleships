# project/ — how Invisible Ships is decided and planned

Engineering and product knowledge that has to survive a session, a branch, or a
contributor. If a question has been settled, it is written here so it is not argued
twice.

**Why not `docs/`?** `scripts/add_disclaimer_footer.py` stamps the archive's Critical
Disclaimer onto every markdown file under `docs/` and `research/`, because those hold
archive content. Engineering notes are not archive content and should not carry that
footer, so they live here instead. `project/` is deliberately outside that scan.

## What is where

| Path | Holds | Lifetime |
|---|---|---|
| `/CLAUDE.md` | The short, enforceable rules an assistant reads automatically. Points here. | Living |
| `project/roadmap.md` | The whole product, in priority order. Where things are going. | Living |
| `project/workstation-setup.md` | How to set up a new computer to work on the site, and the optional local commit and pull triggers. | Living |
| `project/decisions/` | One file per settled question, numbered. **Why** things are the way they are. | Permanent |
| `project/features/` | One file per branch or piece of work in flight. **Tactics.** | Until merged |
| `project/archive/` | Planning docs that predate this tree, verbatim, with what superseded each. **History, never current state.** | Permanent |

## The three rules

**1. A decision that was argued belongs in `decisions/`.** Not in a commit message,
not in a chat log, not only in a Claude project doc. If someone could reasonably
propose the opposite next month, write the record. Numbered, never renumbered.

**2. Work in flight belongs in `features/`, named after its branch.** Before starting
a branch, copy `features/TEMPLATE.md` to `features/<branch-name>.md` and fill the top
half. It is a working document — update it as you go, and it earns its keep the day
someone picks the branch up cold.

**3. When they conflict, `CLAUDE.md` wins for rules, `decisions/` wins for reasons,
and the newest decision wins over an older one it says it supersedes.** A decision is
never edited to change its conclusion — a new one supersedes it and the old one gets
`Superseded by NNNN` in its status. That way the history of a reversal is legible,
which matters: this project has reversed itself within a single day and the reasoning
for both halves was worth keeping.

## Conventions

- Decisions are numbered `NNNN-kebab-title.md`, four digits, allocated in order.
- Every decision opens with a status line: `Accepted`, `Superseded by NNNN`, or
  `Proposed`.
- State what was **rejected** and why. The rejected options are the part that stops
  the argument recurring — "we already tried Cloudflare and it does not carry ASN" is
  worth more than the conclusion alone.
- Write dates. "Recently" ages badly.
- Prefer plain prose over bullets for reasoning, tables for options and trade-offs.

## Relationship to the Claude project docs

There are ~90 working documents in the attached Claude project (session logs,
audits, findings). Those are a **work journal** and stay there. What belongs in this
repo is the distilled result: the roadmap, the decisions, and the tactics for work in
flight. When a project doc turns out to contain a settled decision, port it here and
leave the original as history.

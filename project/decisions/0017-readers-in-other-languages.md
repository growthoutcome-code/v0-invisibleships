# 0017 — How does the site serve readers in other languages?

- **Status:** Accepted
- **Date:** 2026-10-03
- **Supersedes:** none

## The question

The archive is in English, and visits arrive from China, Taiwan and Peru. Should
the site be translated, support right-to-left languages, or something smaller?

## Decision

**Point readers to translation rather than translate the site.** The gate's first
screen tells readers, in their browser's language when it is one of 11, to
download the corpus and translate the plain-text files, or to let the browser
translate the pages. The site makes sure browser translation cannot crash it.
Right-to-left layout and translated pages are deferred.

Sean, 3 Oct: RTL cannot be prioritised now; "include 1-2 sentences in the first
page of the gate that encourage overseas visitors to download the corpus for best
results in translating"; Claude to choose among the options
(`claude/gate-welcome-options.md`, recommended Option 2).

## Why

- Visitor browser languages, 90 days to 3 Oct: about 108 sessions in US English,
  4 in Simplified Chinese, 1 in Peruvian Spanish. None right-to-left.
- RTL layout is 3–5 days, RTL charts another 3–4, and only pays off with a
  translated interface; translating the archive itself is months and
  $75k–$185k per language (`claude/rtl-research.md`, `claude/rtl-plan.md`).
- Plain-text files translate more completely than pages, and the corpus already
  carries the disclaimer in every file.
- Chrome's translator crashes React pages; a reader sent to translate must not
  land on a blank page.

## Rejected

| Option | Why not |
|---|---|
| RTL layout and charts now | No RTL visitors yet; the cost buys nothing until a language is served |
| Per-language front doors (`/zh`, `/es`) | 1–1.5 weeks per language plus translation and legal review; worth it only when marketing targets a country |
| Choosing the language from location | Location is not language, and the site does not use it to change content. The browser's own language setting is what the reader chose |
| A language question in the gate | Rejected class of change: no gate fields to fill gaps (0001, CLAUDE.md §2) |
| The English line only, for everyone | A reader who does not read English cannot read the sentence telling them how to translate |

## Consequences

- The 11 notes are AI-drafted and unreviewed until a native speaker checks them.
- A global patch to `Node.prototype.removeChild` and `insertBefore` lives in
  `app/layout.tsx`. It only acts on calls that would otherwise throw.
- Readers of right-to-left languages get translated text in a left-to-right
  layout.

## What would change this

Visitors with right-to-left browser languages in meaningful numbers, or marketing
aimed at a specific country. Then `claude/rtl-plan.md` phases 2–3, and a front
door for that language.

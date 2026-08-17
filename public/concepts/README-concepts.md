# Invisible Ships — Core Concepts

> **Read this first.** The author acknowledges that most of the material in this
> collection is unverified. Concepts formed by the author record reported
> experience; concepts that rest on *pattern* rest on observation rather than
> documentation. Neither establishes a cause, a technology, a responsible party,
> or a coordinated campaign, and none of it has been independently tested or
> corroborated. Read alongside the full disclaimer:
> https://www.invisibleships.com/disclaimer

19 concepts, exported from `lib/concepts.ts` — the single source of truth
behind https://www.invisibleships.com/concepts. This folder is a snapshot; the site
is authoritative.

## Two labels on every concept

Each concept carries two independent labels, and they do not imply one another.

**Who formed it**

- `ai` — AI analysis (12): derived by a language model reading the research corpus.
- `author` — Author's observation (7): formed by Sean C. Harris from lived experience.

**What it rests on**

- `documented` (5): supported by a court ruling, regulator decision, or official document.
- `structural` (7): follows from what the dataset does and does not contain.
- `pattern` (7): an observation across material. Not documentation.

A `documented` concept stands whether or not you accept any `pattern` concept.
That separation is the point of the labelling.

## Files

```
concepts/
  README-concepts.md
  concepts.json     structured, mirrors lib/concepts.ts, includes field definitions
  concepts.csv      one row per concept, list fields joined with |
  <id>.md           one file per concept (19)
```

## Fields

`verification` is `unverified` unless stated otherwise. `sourceOrigin` records where a
concept came from — `journal`, `data`, or `external_research`. `glossaryReferences`
point at site-specific terms and are **not** independent evidence. `references` mixing
external links are context, not corroboration — read each concept's `referencesNote`.
`hypotheses` are sub-claims, each unverified in its own right.

© 2026 Sean C. Harris. All Rights Reserved.

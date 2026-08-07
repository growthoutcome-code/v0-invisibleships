# Glossary — cleanup & expansion record

*Last updated 2026-08. Maintained with Claude (Cowork). This is the human-readable record of the glossary accuracy pass; the live data lives in the two files noted under "Where the glossary lives."*

## Where the glossary lives (important)
The glossary is assembled at build time by `lib/server-corpus.ts`, which merges two bundled sources — it does **not** read the glossary from Supabase:

1. **`public/corpus/rels.json`** → the `glossary` array (the original dictionary/reference terms).
2. **`lib/site-content.ts`** → `EXTRA_GLOSSARY` (the in-work / coined terms and newer additions).

To edit a term, change it in whichever file it lives in, then rebuild/redeploy. Slugs are the stable id (URLs + journal cross-references key off them) — change wording freely, but avoid changing a slug.

## What this pass did (2026-08)
- Reviewed all 30 published terms for accuracy, clarity, consistency, and sourcing.
- Fixed errors: `euthanisia`→`euthanasia` (display), `perceptual set` pronunciation (was pasted from `hardware`), `terrorism` punctuation, `torment` "transistive"→"transitive", stray characters, and dropped `Google Gemini Summary` / `Google AI Overview` attributions.
- Merged `telepathic` into `telepathy` (adjective form + example); remapped 397 journal→glossary cross-links from `telepathic` to `telepathy`.
- Expanded key terms with neuroscience grounding (hardware, software, telepathy, torment) and real, cited references.
- Added 8 new terms: image-based search, psychological smothering, microwave auditory effect, non-ionizing radiation, muon tomography, false disclosure, obedience experiment, electromagnetic field.
- Added a **Related terms** line and a **Sources** line (markdown links) to most entries.

Net: 37 live terms (17 in `rels.json` + 20 in `site-content.ts`).

## Sourcing & linking policy
- Link external, verifiable sources (news, studies, official/company pages, Wikipedia). External links (and "Further viewing") should open in a **new window** (`target="_blank" rel="noopener noreferrer"`).
- Dictionary definitions keep a plain-text attribution (Merriam-Webster).
- Purely coined in-work terms need no external source.

## Known follow-up (rendering)
`components/GlossaryItemReader.tsx` (and the in-app glossary reader in `components/JournalBrowser.tsx`) currently render definitions as **plain text** via `cleanDef()`, which strips markdown links. So the new **Sources** and **Related terms** show as text today. To make them clickable — sources opening in a new window, related terms linking to their glossary entries — the reader(s) need a small markdown/link render pass. Content is authored markdown-ready for that upgrade.

## Full working record
A detailed, decision-by-decision record (every term's before/after, the cross-reference map, and the Supabase-vs-bundled analysis) is kept in the linked claude.ai Project docs: `glossary-cleanup-status.md` and `glossary-cross-reference-plan.md`.

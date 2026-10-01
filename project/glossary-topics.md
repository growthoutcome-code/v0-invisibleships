# Glossary topics

*Set 30 Sep 2026 (Sean: "What you've suggested is amazing. Let's get that filter
built out for the glossary"). The Glossary's Topic filter.*

## The topics

General fields of knowledge, not the Journal's themes. A journal theme says what an
entry records ("Death threats"); a glossary topic says what field a word belongs to.

| Slug | Label |
|---|---|
| `glossary-military-intelligence` | Military & intelligence |
| `glossary-technology` | Technology |
| `glossary-neuroscience` | Neuroscience |
| `glossary-neuroethics` | Neuroethics |
| `glossary-ethics-human-rights` | Ethics & human rights |
| `glossary-psychology` | Psychology |
| `glossary-physics-signals` | Physics & signals |

Neuroethics is kept apart from Ethics & human rights: it is the field closest to what
this archive asks (who may read or write a mind).

## How a topic is assigned

- **At most two per term**, by reading the definition.
- **The archive's own words are not filed as established science.** Diving,
  Breaching, Image-based search and Neuro-engagement describe capabilities with no
  published record (their definitions say so), so they go under Military &
  intelligence or Neuroethics, never Neuroscience or Technology.
- A new term gets its topics in the same change that adds it.

## Where topics live

One table: `lib/glossary-topics.json` (document id → topics; topic order is chip
order). Stored like journal themes — category rows of kind `glossary_topic`, no new
table or column — in all three copies:

| Copy | Where | Written by |
|---|---|---|
| Site data | `public/corpus/rels.json` categories + doc_categories | `scripts/apply_glossary_topics.py` |
| Download | `categories:` line in `glossary/` (zip-only) and `glossary-site/` files, manifests | the script, and `scripts/export_site_content_md.mjs` for `glossary-site/` |
| Supabase | `categories`, `document_categories` | `python3 scripts/apply_glossary_topics.py --sql`, run by hand |

`npm run corpus` applies them; `npm run check` fails if the site data or download
drifts from the table.

A term's document id: the primary-record terms carry one (`IS-GLO-…`); the
site-written terms are `IS-GLO-SITE-<SLUG>`. Supabase `glossary.document_id` is empty
for the site-written terms, so the site derives it from the slug.

## Known differences (30 Sep 2026, reported, not changed)

- Supabase `glossary` holds older, shorter definitions than the site and download for
  **Breaching, Diving and Neuro-engagement**.
- Supabase `glossary` has **involuntary thought**, which is in neither the site data
  nor the download and has no document id, so it carries no topic.

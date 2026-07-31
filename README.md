# Invisible Ships — Journal Browser

A Next.js front end for the *Discovery of Neuro-tech Terrorism* corpus: browse the
journal (day entries + recording transcripts) and glossary, filter by date / part /
location / topic / statement-type / audio, and read each chunk with its Google Drive
audio and source links. Data is served from **Supabase** (built from the 712-file
Markdown corpus), with a bundled JSON fallback so it runs instantly offline.

## Stack
- Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- Supabase (Postgres) as the queryable index — project **Invisible Ships** (`djbnuzqfickrdehbbmrv`)
- Bundled corpus in `public/corpus/` used as a seed / offline fallback

## 1. Run locally
```bash
npm install
cp .env.local.example .env.local     # values are prefilled for this project
npm run dev                          # http://localhost:3000
```
On first load the app tries Supabase; if the DB isn't populated yet it automatically
falls back to the bundled corpus in `public/corpus/`, so you always see data.
The header shows the active source (`supabase` or `bundled`).

Default app password (client-side gate): **`ships`** — change `NEXT_PUBLIC_SITE_PASSWORD`
in `.env.local`. Leave it blank to disable the gate.

## 2. Environment (`.env.local`)
| var | purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon key (read-only; RLS enforced) |
| `NEXT_PUBLIC_SITE_PASSWORD` | client-side gate for the prototype |

The anon key is read-only: Row-Level Security is enabled with a select-only policy,
so the public site can read but not modify data.

## 3. Deploy to Vercel (canonical repo: `v0-invisibleships`)
```bash
git init && git add -A && git commit -m "Corpus-backed journal browser"
git remote add origin https://github.com/growthoutcome-code/v0-invisibleships.git
git branch -M main
git push -u origin main        # replaces the v0 scaffold with this app
```
In Vercel, the project already auto-deploys `main` to `staging.invisibleships.com`.
Add the three env vars above in **Project → Settings → Environment Variables**, then redeploy.

> Note: `v0-invisibleships` is linked to a v0.dev project. Pushing here means v0 is no
> longer the source of truth — future edits happen in code, not v0. (This matches the
> "rebuild fresh from Corpus" decision.)

## 4. Populate Supabase from the deployed app (one step, after first deploy)
The corpus is served statically at `/corpus/*.json`. A stored Postgres function pulls it
straight into the database (no large payloads through any client). After the site is live, run:
```sql
select ingest_from_url('https://staging.invisibleships.com/corpus');
```
(or your deployment's URL). This upserts documents, audio_files, glossary, categories,
and cross-reference tables. Re-run any time the corpus is regenerated. Once populated,
the app reads live from Supabase (header shows `source: supabase`).

## 5. Updating the corpus
Regenerate the Markdown corpus (see `convert.py` in the corpus project), rebuild the
JSON with the project's `build_json.py`, drop the files into `public/corpus/`, redeploy,
and re-run `ingest_from_url(...)`.

## Data model
See the corpus project's `supabase_schema.sql` and `00_PLAN_*`. Core table `documents`
(one row per chunk) plus `audio_files`, `glossary`, `categories` + join tables.

## Notes / next steps
- Topic filter uses the corpus taxonomy (`categories` + `statement_types`). The old
  staging app's **severity** dimension (Critical/High/Medium/Low) is not in the corpus;
  add it later via an enrichment pass into the reserved `themes` field if wanted.
- Full-text search (`documents.fts`) and pgvector semantic Q&A are provisioned in the
  schema for a later pass.

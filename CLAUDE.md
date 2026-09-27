# Working rules for this repository

Read this before changing anything. These are settled decisions, not preferences:
each one was argued out once and re-litigating it costs Sean an hour he has
already spent. Where a decision has reasoning worth reading, the project doc is
named — those live in the claude.ai project "Invisible Ships", not in this repo.

---

## 1. The disclaimer travels with every file and every page

The Critical Disclaimer on Transcripts and Accusations applies to the **entire
archive** — Journal, Research, Concepts, charts, and the downloadable corpus. It
has no exemptions and nothing is out of scope. Two standing conditions are part
of it: **all information requires independent verification**, and **the site makes
no claim against any organization**.

One source, three lengths:

| Form | Lives in | Rendered by |
|---|---|---|
| Full text | `lib/terms.ts` § `critical` (the original Pt. 01 wording, verbatim) | `/disclaimer`, the gate, `meta/IS_META_terms.md` |
| Standing line | `lib/disclaimer.ts` | `components/StandingDisclaimer.tsx`, mounted on the `ItemGate` and `GatedApp` seams |
| Corpus footer | `lib/disclaimer.ts` → `scripts/generated/disclaimer.json` | `scripts/add_disclaimer_footer.py` |

**Never retype the disclaimer text.** Read it from those modules. Adding content
of any kind means running the pipeline, not writing a disclaimer by hand:

```
npm run corpus     # export → footer → sync → index, in the order that works
npm run check      # fails if anything ships without the standing disclaimer
```

The two frozen extracts in the corpus (`meta/IS_META_disclaimer.md`,
`meta/IS_META_copyright.md`) carry SUPERSEDED banners and are **never edited** —
rewriting a verbatim extract would falsify it. See
`claude/disclaimer-coverage-plan.md` and
`claude/disclaimer-surfaces-and-final-language.md`.

---

## 2. Measurement: what is allowed, and what is settled

Full reasoning in `claude/measurement-and-privacy-decisions.md`. The rules:

- **PostHog only.** Google Analytics was removed on 26 Sep 2026 and is not coming
  back without a specific reason. Do not add analytics, tag managers, or
  ad-adjacent scripts.
- **Nothing initialises before consent.** `initAnalytics()` returns without
  setting `inited` until the reader has answered the gate's measurement screen.
  That early return is deliberate and must stay.
- **Page views are ordinary operational monitoring.** Do not write copy that
  treats counting them as ethically fraught or ties them to the archive's subject
  matter. They are unrelated things.
- **Session replay stays on, behind consent, with `maskAllInputs`.** It is useful
  for finding UI bugs. The legal exposure (state wiretap claims) is answered by
  prior consent, not by removing the feature.
- **No locations on `/insights` until a network can be labelled.** A VPN exit
  resolves to the VPN's city; a geography table that cannot say which rows are
  hosting networks is a map of guesses. When it returns: classify server-side from
  a local ASN dataset (GeoLite2-ASN), store the **label** — residential / hosting
  or VPN / unknown — plus country, never the address. Not Cloudflare; not a
  per-request third-party lookup.
- **Never store an IP.** Geography comes from Vercel's edge headers. The one join
  key is `client_hash`, a salted SHA-256 of the PostHog cookie id.

### Keeping the author and Claude out of the numbers

| Lever | Effect | Use on |
|---|---|---|
| `?analytics=off` | nothing recorded at all (cookie **and** localStorage) | a device only used to build the site |
| `?author=1` | row written and marked `is_author`; excluded from every public view | a device that also reads the site |

The project's PostHog internal-traffic filter has four conditions: a cohort, the
production `$host`, an IP regex, and `is_author is not set`. The last one is what
catches an author session from an unlisted network.

**Standing rule for any Claude session:** test on `localhost` or a preview
deployment — both excluded by the `$host` filter. If production must be opened,
open it as `https://www.invisibleships.com/?analytics=off`. The site cannot detect
an assistant driving a browser (`navigator.webdriver` is false for an extension),
so this is discipline plus the cookie.

### The public page

`/insights` is public, linked from the footer (far-right column, with a live
count), `noindex` for now, and reads **only** the `insights_*` Supabase views —
which exclude author-marked rows — plus PostHog for counts. Prose lives behind
"How this is measured", never on the page. The opt-out control lives in that
dialog.

---

## 3. Content that arrives by a route no script owns

This repository has been bitten five times by content reaching readers through a
path no script and no guard knew about: `journal/` and `references/` exist **only
inside the zip**, and 715 of 840 corpus files once shipped with no disclaimer
because nothing owned them.

So: if you add a folder, an exporter, a section or a route, it must pass through
`npm run corpus` and be caught by `npm run check`. A new path with no owner is the
bug, even when the content is correct.

---

## 4. Environment

`.env.local` holds the working set. These must also be set in **Vercel
Production** or the feature silently does nothing:

- `SUPABASE_SERVICE_ROLE_KEY` — without it no gate answer or download is ever
  written. Never prefix a secret with `NEXT_PUBLIC_`.
- `IP_HASH_SALT` — without it `client_hash` writes null rather than an unsalted
  (reversible) hash.
- `POSTHOG_PERSONAL_API_KEY` — read-only (`query:read`), server-side only. Without
  it `/insights` says counts are not connected rather than showing a zero.

---

## 5. Conventions worth not rediscovering

- **Comments inside the `TERMS` array in `lib/terms.ts` must not contain a
  straight apostrophe.** `scripts/export_terms_md.mjs` scans for string literals
  and an apostrophe in a comment opens one, breaking the export.
- **A missing number is not a zero.** Where data is absent, say so in words. The
  insights page says "an honest zero, not a missing number" for a reason.
- **`next build` takes longer than a 180-second shell allows** in the sandbox
  available to Claude sessions. `npx tsc --noEmit` is the fast gate; `npm run dev`
  compiles a route on first request and is the practical check for a new page.
- Commit messages here carry the reasoning, including what was rejected and why.
  Keep that.

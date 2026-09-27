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
- **There is no consent screen, and adding one is a decision, not a fix.** A
  fourth gate step asking permission to count page views was built on 26 Sep 2026
  and deliberately not shipped (Sean: "that seems weird... let people opt out or
  don't show it at all"). Counting page views is ordinary maintenance; a consent
  wall overstates it and adds friction to the one thing the site is short of,
  which is readers getting in. What page views get instead is a plain notice in
  the terms and a working switch on `/insights`. Do not add a banner or a consent
  step without revisiting the replay rule below, which depends on this one.
- **Page views are ordinary operational monitoring.** Do not write copy that
  treats counting them as ethically fraught or ties them to the archive's subject
  matter. They are unrelated things. This cuts both ways: it is why no consent
  screen is needed, and why the `/insights` copy argues from transparency rather
  than from surveillance.
- **Session replay is OFF, and that follows from the line above.** Off at the
  PostHog project level and pinned off in code by `disable_session_recording: true`
  in `lib/analytics.ts`. Prior consent was the entire defence against state
  wiretap claims for replay; with no consent screen there is no consent to rely
  on, so the feature goes rather than the screen. Note what did NOT drive this:
  CA **SB 690** does not touch CIPA §631, so its fate changes nothing here.
  Turning replay back on means adding a real consent flow first — and is worth
  revisiting only when there is traffic worth watching or something is being sold.
  At 22 filtered visits all time it bought nothing.
- **A location is only printed when it is the reader's own.** Live since 26 Sep
  2026. `lib/asn.ts` classifies the address in memory from a local GeoLite2-ASN
  file and stores only the label — `hosting` / `direct` / `unknown` — on
  `gate_events` and `corpus_downloads`. Never the address, never the ASN, never the
  operator name.
  - **One list, a VPN flag on every row.** `locationRows()` in `lib/insights.ts`
    returns every location with a required `flag`: "VPN or datacenter" / "not a
    VPN" / "network unknown". Sean, 27 Sep: "it really is as simple as whether or
    not the location is from a VPN or not."
    - **The only unrelaxable rule: no row renders without a flag.** An unflagged
      city asserts a reader is there, which for an exit node is false. `flag` is
      required in the type and the view coalesces null to `unknown`.
    - Two earlier versions overshot this and were reverted: one deleted the VPN
      cities and left a bare count, one gave them a separate section. Do not
      rebuild either. The label is the whole requirement.
    - **A filter for non-VPN cities only is the agreed next step, deliberately not
      built** ("I don't think we need to yet"). The flag is already its data, so it
      is a UI change and nothing more.
    - Guarded by `scripts/check_insights_split.mts`, which checks every row is
      flagged and flagged correctly in both directions.
  - `direct` means "no hosting network matched", NOT "no VPN". Render it as a
    detection, never as a guarantee.
  - **The real location behind a VPN is not obtainable and must not be pursued.**
    Not by Cloudflare, not by a paid IP service, not by WebRTC or fingerprinting.
    The exit node's address is the only one the site ever receives. Deliberately
    defeating a reader's privacy tool would also make the terms false ("no attempt
    is made to identify individual readers") and is the contradiction this archive
    least needs. Unplaceable visits are reported as a count, never as a place.
  - **No gate question asking for country.** Considered and rejected 26 Sep 2026:
    readers breeze through the gate to reach the content, so the answers would be
    mostly noise presented as data — and the existing role question, live for
    weeks, has exactly one answer. Do not add fields to the gate to fill gaps in
    measurement.
  - Built on `gate_events`, **not** PostHog page views: PostHog resolves geography
    from a city database with no network data and never returns the address, so a
    PostHog city cannot be labelled at all.
  - **Not Cloudflare.** Its visitor-location headers carry no ASN on any plan;
    getting one means a Worker in front of the site reading `request.cf.asn`, plus
    Vercel's own geo headers then resolving to Cloudflare's edge.
  - `MAXMIND_LICENSE_KEY` missing is a supported state: `scripts/fetch_asn_db.mjs`
    skips, every row reads `unknown`, and the page says why. It never fails a build.
  - `scripts/check_asn_classification.mts` runs in `npm run check` and pins the
    traps (Google Fiber and Starlink must not read as hosting). Fix a false
    positive by adding to `NOT_HOSTING_PATTERNS`, which wins, not by narrowing the
    hosting list.
- **Never store an IP.** Geography comes from Vercel's edge headers; the ASN
  lookup reads `x-forwarded-for` inside one function call and keeps nothing. The
  one join key is `client_hash`, a salted SHA-256 of the PostHog cookie id.

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

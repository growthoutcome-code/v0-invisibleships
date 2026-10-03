# Invisible Ships — roadmap

**Last reviewed: 2026-10-02.**

How to read this: **Now** is being worked on. **Next** is agreed and queued. **Later**
is real but unscheduled. **Not doing** exists so the same suggestions stop coming back.

> **Sean: the ordering in Next and Later is inferred from the work history, not stated
> by you.** Correct it freely — it is written down so it can be argued with rather than
> re-guessed each session. Items marked **[confirm]** are ones I am least sure belong
> where I put them.

## Now

| Work | State | Where |
|---|---|---|
| Visit trust labels on `/insights` | In progress | `features/visit-trust-labels.md`, decision `0002` |
| `/insights` restructure — Google leads, pages lead, locations on both tabs | In progress | `features/insights-page-restructure.md` |
| **News** — a dated index of about 200 official-source posts and news items, one band on the master timeline | **Ready to merge (2 Oct).** 276 items, 259 with draft summaries, 17 pending. Width fixed, line-click dialog, bottom sections on `/news`, and a Contribute bottom section on every page with bottom sections. Unlisted until the 17 are written; then Sean reviews the drafts | `features/news.md` |
| `POSTHOG_PERSONAL_API_KEY` into Vercel | Missing in production as of 27 Sep, so the live `/insights` had no traffic numbers. **[check]** whether it has been added since | Vercel env |

**Shipped since the last review (27 Sep → 1 Oct):** every unpushed commit is live (production `f14a3cf`), so the gate and download logging is deployed. `gate_events` holds 5 rows, the latest from 1 Oct. The same period also shipped:
- the random bottom sections (`0011`, `0012`);
- the glossary additions and the Health & symptoms topic;
- the Zersetzung concept;
- the home hero questions;
- the chart heading;
- the footer explainer;
- the split-circle theme icon;
- the wider glossary sidebar (`0014`).

## Next

| Work | Why now | Notes |
|---|---|---|
| News: curation skill and a daily Claude task that finds new articles | Keeps the News index current without Sean searching by hand | After launch, so the skill records the method that worked. Runs every day (Sean, 2 Oct). Drafts only; nothing publishes without Sean. See `features/news.md` |
| News: "In the news" on glossary, concept and journal pages | The other direction of each item's backlinks | Built from the same `related` field as the item pages |
| **Marketing launch** — social plan first | Sean, 27 Sep: starting soon | See `marketing-readiness-notes` in the Claude project. The measurement gap is attribution: **every visit to date is `$direct`** and there is no attribution panel. Agree a UTM convention *before* the first post — inconsistent tags cannot be retrofitted |
| Traffic sources section on `/insights` | Marketing is worthless unmeasured | PostHog already captures `utm_*` and `$referring_domain`; this is a query, not an architecture |
| ASN network labels (iptoasn) | Closes the two gaps in `0002`: same-time-zone VPNs, and Tor users mislabelled as bots | Free, no account. Swap inside `lib/asn.ts` |
| Non-VPN filter on locations | Agreed, deferred | The labels are already its data |
| **[confirm]** Contribution review and moderation | Planned in depth in the Claude project, not started | Needs a decision record before building — it is a policy question as much as a feature |

## Later

| Work | Notes |
|---|---|
| **[confirm]** Merchandise | Triggers CalOPPA, Colorado trade-name registration, sales tax, processor obligations, and reopens replay/consent as a set. Colorado attorney and a CPA before the first dollar. See `0001` |
| **[confirm]** Session replay, reinstated | Only behind a real consent flow, and only when there is traffic worth watching. See `0001` |
| **[confirm]** AI question/answer surface | Tables and provider config exist (`qa_cache`, `question_log`, `ai_provider_config`, `AI_CHAT_ENABLED`); current status unclear to me and worth a line here once you confirm it |
| Journal / capture promotion path | `capture_entries` → `documents` by explicit promotion; schema in place |
| Playwright assertion that the standing disclaimer renders | Offered repeatedly, never built. Cheap insurance on the one thing that must never regress |
| Index of the ~90 Claude project docs | Which are current, which are history. Growing cost every session |

## Not doing, with the reason

Pulled from the decision records so nobody re-proposes them.

| Proposal | Why not | Record |
|---|---|---|
| Google Analytics | Removed 26 Sep. Cannot do the cross-check `0002` depends on. Only re-open for Google Ads conversion tracking | `0001` |
| Cookie banner or consent screen for page views | Overstates ordinary monitoring; adds friction to entry | `0001` |
| Gate question asking reader location or country | Readers breeze through to the content; answers would be noise presented as data | `0001`, `0002` |
| Cloudflare in front of the site | Carries no ASN to origin on any plan; needs a Worker and a DNS move, and breaks Vercel's geo headers | `0002` |
| MaxMind GeoLite2 | Account plus a 30-day licence clock, for data iptoasn gives away | `0002` |
| Third-party VPN detection APIs | Post every reader's IP to a third party | `0002` |
| Determining the real location behind a VPN | Not obtainable by any tool at any price; pursuing it would make the terms false | `0002` |
| Storing an IP address | Never | `0001` |

## Standing constraints on everything above

These are not roadmap items; they are conditions any new work inherits.

1. **The Critical Disclaimer covers the entire body of work**, site and downloadable
   corpus alike: all information requires independent verification, and the site makes
   no claim against any organization. New content inherits it — `npm run check`
   enforces the corpus side across 837 files.
2. **The download must equal the site, byte for byte.** `npm run corpus` then
   `npm run check`. A content edit that skips this fails the guard.
3. **No location renders without saying whether it is a VPN.** See `0002`.
4. **Marketing must not overclaim.** The disclaimer discipline is the project's
   strongest asset precisely because it is unusual; a post asserting what the archive
   declines to assert would be quoted against the disclaimer, not against the post.

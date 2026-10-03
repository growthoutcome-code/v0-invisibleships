# 0016 — Does the site keep Google Analytics alongside PostHog?

- **Status:** Accepted
- **Date:** 2026-09-28 (written down 2026-10-03)
- **Supersedes:** 0001, in part: the "PostHog only" clause and its "Keep Google
  Analytics" rejection. Everything else in 0001 stands.

## The question

Record 0001 said "PostHog only" and listed keeping Google Analytics as rejected.
That clause came from a Claude session that removed GA on 26 Sep 2026 while
rebuilding `/insights` (a206fce). Sean had asked only whether GA was wired up. Is
GA part of the site?

## Decision

**Yes. Google Analytics and PostHog both run, and Google Analytics is never
removed.** Sean, 28 Sep 2026: "we never want to remove Google Analytics." GA was
restored the same day (66c5106) and has been live since.

## Why

It is Sean's decision. The removal was a product decision taken without him, and
it was reversed as soon as he saw it.

What exists now:

- `lib/analytics.ts` loads GA after the exclusion check, so localhost, browser
  automation and opted-out devices never load it.
- Every `track()` call and `registerVisitorProps()` writes to both tools.
- The corpus download is sent to GA from the server through the Measurement
  Protocol (f1bfa2d), so GA counts downloads that were actually served.
- `/insights` reads GA live (`lib/insights-ga.ts`) alongside PostHog and Supabase.

## Rejected

| Option | Why not |
|---|---|
| PostHog only (0001) | Sean wants GA kept, permanently. Removing it was not his decision |
| Removing GA because it lacks author exclusion | Fix it inside GA instead: `is_author` is already sent as a user property, so an audience or report filter can exclude it |
| Removing GA because the role answer never reached it | Fix it inside GA: register `visitor_role` as a custom dimension (event-scoped and user-scoped) |
| Removing GA for the EEA/UK consent obligation | Not live while there are no EU readers. Handle it when there are, without removing GA |
| Removing GA because an archive about surveillance "should not load an advertising tag" | Wrong in principle. Counting page views is ordinary site maintenance and has nothing to do with the archive's subject (see 0001) |

## Consequences

- Two dashboards count two different populations. PostHog's internal-traffic
  filter removes the author's devices; GA does not until the same exclusion is
  set up there. Differences between them are expected, not a fault.
- The EEA/UK consent question becomes live the day there are EU readers.
- Any future analytics change must keep GA working.

## What would change this

Only Sean saying so.

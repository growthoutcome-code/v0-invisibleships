# 0001 — How does this site measure its readers, and what does it refuse to do?

- **Status:** Accepted. "PostHog only" and the "Keep Google Analytics" rejection are superseded by [0016](0016-google-analytics-stays.md): Google Analytics stays
- **Date:** 2026-09-26
- **Supersedes:** none

## The question

The site had analytics that nobody had decided on: Google Analytics and PostHog both
firing on page load, before any screen mentioned measurement, counting the author as a
reader. What should be measured, what should be asked, and what should be refused?

## Decision

**PostHog only, page views only, counted by default, no consent screen, session
replay off, and no location shown without saying whether it is a VPN.** The author's
own traffic is excluded by a cookie rather than by IP. No IP is ever stored by this
site.

## Why

**Counting page views is ordinary operational monitoring.** It is what every site
does to know whether it works, and it has nothing to do with what this archive
documents. Treating the two as morally adjacent is a category error, and page copy
that implied otherwise was removed. The legitimate arguments are about accuracy,
consent law, and whether a number means what it appears to mean.

That framing decides the consent question. A permission wall in front of an archive
overstates what is happening and adds friction to the one thing the site is short of,
which is readers getting in. A fourth gate screen asking permission was built on
26 Sep and deliberately not shipped (it remains in `stash@{0}`, abandoned rather than
dropped). What page views get instead is a plain statement in the terms, which every
visitor passes, and a working switch on `/insights`, which someone can return to.

**Session replay off follows from that, not from legislation.** Prior consent was the
entire defence against state wiretap claims for replay. With no consent screen there
is nothing to rely on, so the feature goes rather than the screen. It is off at the
PostHog project level and pinned off in code by `disable_session_recording: true`,
because a project setting is a checkbox someone can tick months later without reading
anything. At 22 filtered visits it bought nothing. Console-log and network capture
went with it, since they existed only to enrich replay.

Note what did **not** drive this: California SB 690, amended July 2026, would strip
private suits under CIPA's pen-register provision (§638.51) but deliberately does not
touch §631, the wiretap provision actually used against session replay ($5,000 per
violation). Florida's FSCA, Pennsylvania's WESCA and federal ECPA remain. **SB 690's
fate is therefore irrelevant here** and is not a reason to restore replay.

**Author exclusion by cookie, not by address.** An IP allowlist cannot keep up with
hotels, hotspots and new VPN exits; a session from an unlisted range counted as a
reader on 28 August. The PostHog internal-traffic filter now also requires
`is_author is not set`, and `?author=1` marks a device for good.

## Rejected

| Option | Why not |
|---|---|
| Keep Google Analytics | Gave nothing PostHog did not: no custom dimension was ever registered for the gate's role answer, the server-side download event never reached it, and its unfiltered numbers caused a 470-vs-22 confusion. Against that it carried a Google ad-tech tag and an EEA/UK consent obligation. Removed 26 Sep 2026. Historical data stays in the Google account; re-adding is one commit |
| Re-add GA for marketing | It cannot do the IP/browser cross-check that 0002 depends on, because it never exposes the IP. The only real trigger would be buying Google Ads, for conversion tracking, in its own section |
| Cookie banner | A notice people click past is not notice |
| Consent screen in the gate | Overstates ordinary monitoring and adds friction to entry. Sean: "that seems weird… let people opt out or don't show it at all" |
| Keep replay behind consent | Coherent only with a consent screen. Without one there is no consent to rely on |
| Gate question asking the reader's country | Readers breeze through the gate to reach the content, so answers would be mostly noise presented as data. Evidence: the role question had been live for weeks with exactly one answer, the author's. Do not add gate fields to fill measurement gaps |
| Store the IP to make analysis easier | Never. Geography comes from Vercel edge headers; the only join key is a salted hash of the analytics cookie |

## Consequences

- No consent record exists, so any future feature that needs consent must add the
  screen first. Replay is the obvious one.
- Declines are counted as a bare timestamp in `measurement_declines`: "22 visits"
  means something different if two people opted out than if two hundred did.
- Every number on `/insights` excludes the author, which is why the figures are small.
  That is the point.
- Two exclusions cannot be closed: a crawler that renders pages counts as a visit, and
  an author session from an unmarked device on an unlisted network counts too.

## What would change this

**Selling anything.** It brings CalOPPA's privacy-policy requirement (no size
threshold), Colorado trade-name registration, a sales tax license and processor
obligations — and it is the point at which replay and consent should be reopened as a
set rather than one at a time. Worth a Colorado attorney and a CPA before the first
dollar. Separately: real traffic volume is the trigger to reconsider whether the gate's
role question earns its place.

An LLC would not shield the author from liability for his own statements. Entities
help with commerce, not with content.

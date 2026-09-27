# 0002 — How do we know whether a visit actually came from the place it reports?

- **Status:** Accepted
- **Date:** 2026-09-27
- **Supersedes:** the locations approach inside 0001 (0001 otherwise stands)

## The question

`/insights` wants to show where readers are. An IP address geolocates to a VPN exit
node, not to the reader, so a list of cities silently mixes places readers are with
places servers are. Sean: *"I just want to know the country, the locale that the visit
came from, legitimately."* Can that be determined at all, and with what?

## Decision

**Compare the two location signals PostHog already collects.** `$geoip_time_zone`
comes from the IP and says where the network exits; `$timezone` comes from the browser
and says where the device is. A VPN changes the first and not the second, so
disagreement across zones means the reported city is a relay's.

Every visit gets one of four labels — **Confirmed, Probable, Relay detected,
Automated** — and one location string whose *precision* varies with the label. For a
relayed visit the page prints the device's **time zone**, not a city, because the zone
is true and the city is false.

This needs no dataset, no account, no third party and no new collection. ASN data is a
later refinement, not a prerequisite.

## Why

Measured on the project's own 470 page views, 27 Sep 2026:

| IP city | IP time zone | Browser time zone | Visits |
|---|---|---|---|
| Denver | America/Denver | America/Denver | 297 |
| Ypsilanti | America/Detroit | **America/Denver** | 75 |
| Los Angeles | America/Los_Angeles | **America/Denver** | 24 |
| Belleville | America/Detroit | **America/Denver** | 21 |
| Chicago | America/Chicago | **America/Denver** | 17 |
| Miami | America/New_York | **America/Denver** | 5 |
| Seattle / Washington / Secaucus / Rockwall / Reston | various | **America/Denver** | ~6 |
| Melbourne FL | America/New_York | America/New_York | 2 |
| Lima PE | America/Lima | America/Lima | 1 |
| Hsinchu / Manassas / Shanghai | various | **UTC** | ~5 |

Sean is in Denver. Roughly **150 of 470 events are one Denver device behind exits
elsewhere** — including the "engaged Los Angeles reader" reported to him in an earlier
session, which was him. Secaucus, Reston and Rockwall are datacenter towns, which
corroborates independently: almost nobody lives in a server farm.

A **UTC** browser clock is the headless-browser default, so it is a free automation
signal needing no user-agent parsing.

**A correction this decision rests on:** it was previously recorded in this project
that PostHog "never returns the IP". It does — `$ip` is present on every event and is
queryable with the personal API key. That is why visits can be classified
retroactively and why no client-side super-property is needed.

## Rejected

| Option | Why not |
|---|---|
| Ask PostHog for a VPN flag | It has none. Checked against the project's own property list: the geo set is city, country, continent, lat/long, postal, subdivision, timezone, accuracy radius. No ASN, no proxy flag. PostHog's geo enrichment uses a city database, which carries no network data |
| Cloudflare | Carries **no ASN to origin on any plan**. Getting one needs a Worker reading `request.cf.asn` plus a DNS move, after which Vercel's own `x-vercel-ip-*` headers resolve to Cloudflare's edge rather than the reader |
| MaxMind GeoLite2-ASN | Free, but needs an account and a licence key, and the licence requires deleting or updating the database within 30 days of each release — a standing obligation on a side project. A reader against it was written and is superseded before use |
| proxycheck.io / IPinfo privacy APIs | Would answer directly and have ample free tiers, but post every reader's IP to a third party. Rejected on principle, not price |
| Deanonymise past the VPN (WebRTC leak, fingerprinting) | Would make the terms false ("no attempt is made to identify individual readers"), has no legitimate-interest basis under GDPR/ePrivacy, and is the conduct that makes a wiretap claim look like what plaintiffs say it is. Some readers use a VPN *because* of what this site is about |
| One mixed list of cities with a small per-row label | Tried 26 Sep. Reads as an audience ranking; the largest row it ever had was one reader's VPN exit |
| Delete the VPN cities, show a bare count | Tried 26 Sep, over-corrected. Destroys information Sean wants: he does want to see a visit came via Amsterdam, with Amsterdam marked as a server |
| A separate section for VPN rows | Tried 27 Sep. Solved a presentation problem the label already answers. Sean: "we don't have to have separate sections" |

## Consequences

- **The real location behind a relay is still unobtainable**, by any tool at any
  price. The reported answer degrades in precision, never in truth: a time zone, not a
  city.
- **Agreement is corroboration, not proof.** The check only catches relays that cross a
  time zone, and VPN clients default to the *nearest* server, which usually lands in
  the user's own zone. So `Confirmed` means "no relay detected across time zones",
  which is weaker than it sounds. Melbourne and Lima are plausible readers, not
  certain ones.
- **A known inaccuracy, recorded rather than hidden:** Tor Browser and hardened
  Firefox report UTC deliberately, to defeat fingerprinting. Time zones alone cannot
  separate them from crawlers, so some genuine readers will be labelled Automated.
  Only network data fixes this, by recognising a Tor exit.
- The browser clock is self-reported and can be changed. Strong signal, not an identity
  document.
- Reader numbers are **smaller than the 22 previously reported**. The dashboard will
  say so.

## What would change this

Adding ASN data, which closes exactly two gaps and nothing else: the same-time-zone
VPN (the *default* client configuration, so this is not a corner case), and
mislabelling privacy-hardened humans as bots. The free source is **iptoasn.com** —
public domain (PDDL v1.0), no account, no API key, hourly updates. Because
`lib/asn.ts` exposes one function returning a small enum, the dataset is swappable
without touching anything downstream.

The honest test of whether ASN is needed: once labelling is live, if the `Confirmed`
count looks implausibly high for a site with no distribution, same-time-zone VPNs are
hiding inside it.

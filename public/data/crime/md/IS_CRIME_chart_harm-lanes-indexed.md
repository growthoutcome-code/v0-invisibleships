---
id: IS-CRIME-CHART-HARM-LANES-INDEXED
title: Crime — Six kinds of harm, indexed
collection: data
doc_type: chart-brief
section: crime
geography: United States (unless a row says otherwise)
generated_by: scripts/build_corpus_md.py
chart_file: crime/charts/harm_lanes_indexed.json
series_count: 6
word_count: 896
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# Six kinds of harm, indexed

*Independent research compiled from public records for informational purposes only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, **B** corroborated, **C** claimed — B and C may not be quoted as established fact. Causes are reported as attributed, never asserted. This dataset does not corroborate, and is not corroborated by, any other dataset in this corpus. See `meta/IS_META_terms.md`.*

**Unit.** Each lane indexed to its own first year in this window = 100 · **Publisher.** FBI; CDC/NCHS; BJS; US Courts · **Evidence tier.** A

## What this chart shows

- [A] Overdose deaths quadrupled since 1999 — the steepest rise of any lane — and have fallen since their 2022 peak.
- [A] But an overdose death is a health outcome, not an offence — nobody was charged. It is here as harm; Public Health carries the record.
- [A] Homicide spiked 29.4% in 2020, then fell to the lowest rate ever recorded.
- [A] Defamation-adjacent federal filings are at a 22-year high, rising sharply since 2023.
- [A] Missing-person entries are at their modern low. Whether that is fewer cases or less entering cannot be separated.
- [A] Break-ins have fallen further than any other lane — 53% from 2000 to 2019, and 26% more from 2020 to 2024 on the basis that replaced it.
- [A] Part of that is fewer reports, not fewer break-ins: 40.7% of victimisations reached the police in 2024, against 58.8% in 2010.
- [A] Two categories this site cares about have no lane at all — harassment, because nobody counts it, and home invasion, because it is not an offence anyone records.

## The series

### Missing persons
FBI NCIC · tier B · 11 points, 2014–2025

- First: 100 (2014) · Last: 78.5 (2025)
- Highest: 102.7 (2017) · Lowest: 78.5 (2025)
- Basis: NCIC missing-person records entered per year; indexed to 2014 = 100
- Caveat: Counts RECORDS, not people: one person can generate more than one record, and a record is cancelled when the case closes for any reason — cancellation does not mean found alive.
- Caveat: Adults are not subject to the same mandatory-entry rules as juveniles, so adult cases are under-entered by an unknown margin.
- Caveat: Tribal and Indigenous cases are documented as substantially undercounted.

### Drug overdose deaths
CDC/NCHS · tier A · 27 points, 1999–2025

- First: 100 (1999) · Last: 415.3 (2025)
- Highest: 640.6 (2022) · Lowest: 100 (1999)
- Basis: deaths per year; indexed to 1999 = 100
- Caveat: 2025 is provisional and will revise upward as late certificates are processed.
- Caveat: Full series and the provisional-versus-final problem are in the Public Health section.

### Defamation filings
US Courts · tier A · 20 points, 2004–2025

- First: 100 (2004) · Last: 126.9 (2025)
- Highest: 126.9 (2025) · Lowest: 74.1 (2014)
- Basis: federal civil cases commenced under Nature of Suit 320; indexed to 2004 = 100
- Caveat: THIS IS A PROXY. Nature of Suit 320 is 'Assault, Libel & Slander' COMBINED. Defamation cannot be separated from assault claims in this series.
- Caveat: Federal civil filings only. Most defamation is litigated in state courts, which publish no comparable national series.
- Caveat: Defamation is a civil tort, not a crime, in essentially every US jurisdiction.

### Homicide
FBI · tier A · 24 points, 1999–2025

- First: 100 (1999) · Last: 90.7 (2025)
- Highest: 139 (2020) · Lowest: 90.7 (2025)
- Basis: murder and nonnegligent manslaughter known to police; indexed to 1999 = 100
- Caveat: Counts differ between publication vintages; see the data-quality register.
- Caveat: 2022 and 2023 could not be verified against a fetched source and are absent.

### Intimidation (incl. stalking)
BJS · tier A · 3 points, 2022–2024

- First: 100 (2022) · Last: 106.8 (2024)
- Highest: 108.1 (2023) · Lowest: 100 (2022)
- Basis: BJS national estimate of NIBRS offence 13C; indexed to 2022 = 100
- Caveat: THREE POINTS ONLY. BJS's coverage-adjusted national estimates begin in 2022; the FBI publishes no citable national 13C series before that.
- Caveat: NIBRS has no stalking offence code — the manual folds stalking into Intimidation, so stalking is inside this number and cannot be separated from one-off threats.
- Caveat: 2024 is the 'initial' provisional version and will be revised.

### Burglary (break-ins)
FBI · tier A · 25 points, 2000–2024

- First: 100 (2000) · Last: 31.4 (2024)
- Highest: 102.5 (2002) · Lowest: 31.4 (2024)
- Basis: burglary rate per 100,000 people known to police; indexed to 2000 = 100
- Caveat: THE BASIS CHANGES IN 2020. Years to 2019 are the FBI's Summary Reporting System, which was then retired; 2020 onward are NIBRS-based national estimates built from agencies covering 87.2% of the population in 2024. The chart breaks the line there rather than drawing through it, and the index across the break is not a single measurement.
- Caveat: Fewer burglaries are reported to police than a decade ago — 40.7% of victimisations in 2024 against 58.8% in 2010. Some of this police-recorded fall is fewer break-ins and some is fewer reports, and the two cannot be separated.
- Caveat: Households asked directly report the same DIRECTION: 34.1 burglaries per 1,000 households in 1999 against 12.0 in 2024. That survey category was itself redefined in 2017, so its two halves are not one series either.
- Caveat: About one burglary in seven is cleared — 15.2% in 2024.

## Note on reading this

These lanes count different things in different units, so each is indexed to its own first year = 100: the chart shows direction, never size. Click any lane for its raw figures, method and caveats.

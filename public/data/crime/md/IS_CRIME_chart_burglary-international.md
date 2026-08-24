---
id: IS-CRIME-CHART-BURGLARY-INTERNATIONAL
title: Crime — Break-ins abroad: one code, five countries
collection: data
doc_type: chart-brief
section: crime
geography: United States (unless a row says otherwise)
generated_by: scripts/build_corpus_md.py
chart_file: crime/charts/burglary_international.json
series_count: 5
word_count: 1076
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# Break-ins abroad: one code, five countries

*Independent research compiled from public records for informational purposes only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, **B** corroborated, **C** claimed — B and C may not be quoted as established fact. Causes are reported as attributed, never asserted. This dataset does not corroborate, and is not corroborated by, any other dataset in this corpus. See `meta/IS_META_disclaimer.md`.*

**Unit.** Police-recorded burglary of private residential premises, per 100,000 inhabitants (Eurostat/UNODC ICCS05012) · **Publisher.** Eurostat (joint Eurostat–UNODC data collection) · **Evidence tier.** A

## What this chart shows

- [A] Four of the five countries are below where they started in 2008. The Netherlands fell furthest — 79% below its 2009 peak.
- [A] Italy is the exception: 44% above its 2020 trough and still climbing.
- [A] Germany has also risen 44% since its 2021 low, though it remains half its 2015 peak.
- [A] Sweden records 3.4 times Germany's rate on the same code. That gap is mostly the code: Sweden counts cellars and attic storage, Germany does not.
- [A] Across the EU, residential burglary is 38% below 2014 — but 12% above its 2021 low.
- [A] No line on this chart is a count of home invasions. No country here publishes one.
- [A] There is no global line to draw. UNODC has withdrawn burglary as a retrievable indicator from its own portal.
- [A] Its dashboards redirect and the legacy spreadsheet returns 404, checked 21 August 2026. These European figures survive only because Eurostat publishes the same collection.

## The series

### Sweden
Eurostat (joint Eurostat–UNODC data collection) · tier A · 17 points, 2008–2024

- First: 412.4 (2008) · Last: 319.9 (2024)
- Highest: 455.1 (2011) · Lowest: 319.9 (2024)
- Basis: Eurostat/UNODC ICCS05012, burglary of private residential premises, per 100,000 inhabitants
- Caveat: Sweden's national category ('bostad') INCLUDES cellar and attic storage areas, which Germany's does not. That alone inflates the Swedish rate against Germany's on a nominally identical code.
- Caveat: The 3.4-to-1 gap against Germany in 2024 should be read as a warning about the code, not as a finding about either country.

### Italy
Eurostat (joint Eurostat–UNODC data collection) · tier A · 17 points, 2008–2024

- First: 257 (2008) · Last: 263.8 (2024)
- Highest: 421.2 (2013) · Lowest: 183.6 (2020)
- Basis: Eurostat/UNODC ICCS05012, burglary of private residential premises, per 100,000 inhabitants
- Caveat: The only line in the set rising: 44% above its 2020 trough.
- Caveat: The 2020 collapse and partial recovery track the pandemic period.

### Spain
Eurostat (joint Eurostat–UNODC data collection) · tier A · 17 points, 2008–2024

- First: 205.7 (2008) · Last: 166.8 (2024)
- Highest: 272.7 (2013) · Lowest: 152.9 (2020)
- Basis: Eurostat/UNODC ICCS05012, burglary of private residential premises, per 100,000 inhabitants
- Caveat: 38.8% below its 2013 peak, with the pandemic trough in 2020.

### Netherlands
Eurostat (joint Eurostat–UNODC data collection) · tier A · 17 points, 2008–2024

- First: 556.2 (2008) · Last: 117 (2024)
- Highest: 573.7 (2009) · Lowest: 117 (2024)
- Basis: Eurostat/UNODC ICCS05012, burglary of private residential premises, per 100,000 inhabitants
- Caveat: The steepest fall in the set: 79% below its 2009 peak.
- Caveat: No published break in the series across the period.

### Germany
Eurostat (joint Eurostat–UNODC data collection) · tier A · 17 points, 2008–2024

- First: 131.7 (2008) · Last: 93.98 (2024)
- Highest: 205.8 (2015) · Lowest: 65.22 (2021)
- Basis: Eurostat/UNODC ICCS05012, burglary of private residential premises, per 100,000 inhabitants
- Caveat: Eurostat's metadata records that Germany's national correspondence table to ICCS section 05 remains INCOMPLETE — the code is nominally shared, the underlying categories are not fully mapped.
- Caveat: Cross-checks against the BKA's own Wohnungseinbruchdiebstahl series for 2022 (65,908 cases against a population of roughly 83.2 million).
- Caveat: The 2021 trough coincides with the second year of pandemic restrictions; the series has risen 44% since.

## Note on reading this

Every line is filed under the same ICCS code, which makes each line's DIRECTION comparable and the distance between lines much less so — Eurostat records that Germany's mapping is incomplete and Sweden counts cellar and attic storage where Germany does not. France is absent because Eurostat states there is no correspondence between the French classification and this code at all. The United States publishes nothing on this basis.

## Is a home invasion recorded as a home invasion?

No. It is recorded as a burglary, and the record keeps the things a filing system can check — where the building was, whether entry was forced, whether anything was taken — rather than the thing that makes it a home invasion, which is that someone was home. The FBI's NIBRS sorts burglary by location type, premises entered and force; it has no data element for an occupied dwelling, so the count could not be produced from the returns even if someone wanted it. Michigan shows how complete the burial is: 'home invasion' is the literal statutory name of its burglary offence, in three degrees, and its state reporting manual codes every one of them as ordinary burglary. Australia and New Zealand are more explicit still — their shared classification, ANZSOC, lists home invasion only as an inclusion term inside aggravated and non-aggravated burglary of a dwelling. It is defined into burglary by the classification authority itself. Statistics Canada says the quiet part outright: because there is no agreed-upon definition, home invasion is difficult to measure and is not captured directly by its national survey — so StatCan reports robberies in private residences instead as a stand-in. The one place we found publishing home-invasion figures is the state of Victoria, where the 2018 total is split across two unrelated offence families — 105 offences filed under aggravated burglary and 87 under serious assault, which never reach any burglary total. Re-checked on 21 August 2026, that remains the most recent published figure anywhere we could find.

So the honest answer to whether home invasions have risen is that no national series exists to say. What can be said is that break-ins overall have fallen sharply almost everywhere they are measured, on every basis, for two decades — and that the occupied case is not rare. The ONS, working from survey responses rather than police codes, found that in over half of domestic burglaries where the offender got inside, someone was at home at the time. That is the closest thing to a measurement of the thing itself that exists, it is nine years old, and it is a share rather than a count.

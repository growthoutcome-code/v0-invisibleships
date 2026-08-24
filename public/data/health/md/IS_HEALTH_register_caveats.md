---
id: IS-HEALTH-REG-CAVEATS
title: Crime — Read before quoting any figure
collection: data
doc_type: register
section: public-health
geography: United States, with international comparison where a chart says so
generated_by: scripts/build_corpus_md.py
entry_count: 50
word_count: 1243
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# Read before quoting any figure

*Independent research compiled from public records for informational purposes only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, **B** corroborated, **C** claimed — B and C may not be quoted as established fact. Causes are reported as attributed, never asserted. This dataset does not corroborate, and is not corroborated by, any other dataset in this corpus. See `meta/IS_META_disclaimer.md`.*

Constraints that apply to everything in this folder.

**50 entries.**

- [—] US series age-adjusted to 2000 US standard population; annual 2001-2021 from NCHS db464 tables, 2022-2024 from db509/541/548, 1999 from db362. No US 2025 figure yet — provisional 2025 counts expected via CDC WONDER/NVSS later in 2026.

- [—] CDC Vital Signs June 2018 analyzed persons aged >=10; its rates not directly comparable to all-ages age-adjusted NCHS rates; its '~30% since 1999' is the origin of the claim under review.

- [—] Cross-country 'WHO' rows are WHO Global Health Estimates (age-standardized to WHO world standard population) via World Bank API mirror (SH.STA.SUIC.P5); modeled estimates differ in level from national vital registration (e.g., WHO Canada 2021 = 9.4 vs PHAC 11.8). Use WHO rows for trend comparison, national rows for latest levels.

- [—] UK: ONS figures are England & Wales registrations, not UK-wide occurrences; only 38.7% of 2024 registrations occurred in 2024 (coroner delays) — occurrence-based rates broadly stable since 2018. UK definition includes deaths of undetermined intent (15+), inflating rates relative to some countries.

- [—] Japan: NPA/MHLW suicide statistics (2025: 19,097; rate 15.4) compiled differently from vital-statistics causes of death; crude rates.

- [—] Australia 2024 (11.9), Canada 2024 count (4,394), South Korea 2024 (28.3; 14,439) are preliminary/subject to revision.

- [—] Germany 12.2 (2023) is a crude resident rate; EU-standardized German rate 10.3 in 2021 vs EU average 10.2 (Destatis).

- [—] Divergence answer: yes — the US long-run rise (~+30-35% since 1999/2002) diverges from peers. Japan, Germany, France declined substantially since 2000; Canada flat-to-declining; UK and Australia roughly flat with modest recent upticks; South Korea rose steeply to ~2010-2011, declined, remains OECD's highest, ticked up in 2024.

- [—] Per safe-reporting standards, method-specific figures intentionally excluded; only aggregate rates and counts reported.

- [—] WHO GHE values fetched via World Bank API mirror; WHO IRIS PDF returned 403 — headline findings verified from WHO's news release and fact sheet.

- [—] Small discrepancies between the 2019 report's global rate (9.0) and GHE-2021-revision value for 2019 (9.42); series internally consistent within one source, not mixable across sources.

- [—] WHO GHE figures for China, Russia, India are modeled estimates, not counted deaths; countries included by design — the data-quality problem is reported as a finding, not a reason for exclusion.

- [—] NCRB ADSI 2022 PDF robots-blocked; count tier B via CMHLP; rate and 2017-2022 trend tier A via peer-reviewed analysis.

- [—] Million Death Study absolute count not verifiable from a fetchable page; represented by the peer-reviewed rate comparison (22 vs ~11.4).

- [—] Rosstat not fetched directly; Rosstat-based figures via peer-reviewed EJPH analysis (conference-supplement abstract) and 2024 Population and Economics article.

- [—] Frontiers 2025 corrected global total (>1M/yr) is a peer-reviewed MODELED estimate; present as such.

- [—] Safe-reporting: rates and counts only; method details deliberately not extracted.

- [—] WHO fact sheet 727,000 / 73% LMIC = 2021 (GHE 2021); 700,000+/36% decline = 2019 (GHE 2019). Label years explicitly in visualizations.

- [—] Provisional vs final overdose counts differ: May 2026 release compares provisional 2025 (69,973) vs provisional 2024 (81,313); final 2024 is 79,384. Do not mix provisional and final in one series.

- [—] Gallup depression = self-reported lifetime/current diagnosis, not clinically assessed prevalence; rising diagnosis can reflect help-seeking, screening, reduced stigma as well as true incidence — different construct from NSDUH MDE or PHQ-8.

- [—] NSDUH 2021+ uses redesigned multimode methodology, not directly comparable with pre-2020 NSDUH; do not splice.

- [—] WHO 25% pandemic increase is a modeled first-pandemic-year estimate, not diagnoses; WHO baselines since revised (depression 5.7% adults / ~332M; anxiety 359M in 2021).

- [—] Cancer incidence trends can be inflated/masked by screening and diagnostic change; BMJ Oncology global counts (+79%) are raw counts affected by population growth, not age-standardized rates; 2020 incidence depressed by pandemic diagnosis disruptions.

- [—] SEER 'stable' all-sites incidence coexists with rising site- and demographic-specific trends.

- [—] US-vs-peer life expectancy gap depends on comparator set (Peterson-KFF: 3.7 yrs in 2024). OECD Health at a Glance 2025 US note not directly fetchable (robots/403) — cited only via Peterson-KFF.

- [—] ACS 2026 projections are model-based estimates, not registrations; actual incidence data through 2022, mortality through 2023.

- [—] Diagnoses vs prescriptions must not be blurred: every Tier A epidemiology source shows stable-to-declining age-standardised schizophrenia prevalence/incidence, while every Tier A prescribing dataset shows rising volumes — cited authors attribute the gap to off-label use, expanded indications, demographics, access; not rising disease.

- [—] England 'items' count dispensing events, not people or doses; items, fills, DDDs, and %-of-population are different measures, not directly comparable.

- [—] Hong Kong study (PMID 39961232) cited by identity only — retrieve exact figures before publishing numbers from it.

- [—] England 2024/25 class-level antipsychotic (13.9m) and hypnotic/anxiolytic (13.4m) items corroborated via The Pharmacist (tier B); canonical values in NHSBSA Excel tables. NHSBSA issued a Jan 2026 correction for patient double-counting in some calendar-year tables — re-check patient counts.

- [—] ASPE = IQVIA Total Patient Tracker projections (SSRIs only for antidepressants — understates total); CDC MMWR = commercially insured only; DEA/IQVIA LRx ~94% of retail — none is a full census.

- [—] GBD 'stable prevalence' is modeled with wide uncertainty in low-data regions; registry incidence measures treated/diagnosed cases, sensitive to service coverage and coding.

- [—] Market-size figures (tier C) are proprietary forecasts, not measured data.

- [—] OECD DDD figures corroborated via Euronews (tier B); primary reference: https://www.oecd.org/en/publications/health-at-a-glance-2023_7a7afb35-en/full-report/pharmaceutical-consumption_4b6cb013.html

- [—] All rows are attributions as stated by the cited source, not asserted causes; several sources themselves flag correlational evidence.

- [—] CDC Vital Signs 2018: suicide rarely caused by a single factor; 54% = no *known* mental health condition — undiagnosed conditions cannot be ruled out.

- [—] Case & Deaton supporting line quoted from Brookings' official publication page summary; deaths-of-despair framing scholarly contested (Ruhm c07; other critiques exist, not fetched).

- [—] HRSA figures are 2038 projections based on current utilization, explicitly excluding unmet need; page updated Dec 2025.

- [—] WHO suicide fact sheet and CDC opioid epidemic page are living documents; dates are last-updated as displayed 2026-08-19.

- [—] Surgeon General doc_dates at month precision where fetched PDF displayed only year.

- [—] Per safe-reporting standards, no suicide method details; firearm access named only as access-level risk factor.

- [—] Twenge et al. (c10) remains contested; both attribution and principal critique (c14) included so the register carries the dispute, not a resolution.

- [—] All tier-A documents fetched and confirmed to contain quoted/near-verbatim lines on 2026-08-19.

- [—] Health is NOT the most-deployed domain: public-admin 151, defence-intel 33, health 32, law-enforcement 31. Phrase health as the largest citizen-facing service domain / third overall.

- [—] deployments.json contains no date fields; all temporal claims about deployments come from milestones.json (occurred_on) or year mentions in workload strings.

- [—] 'Live' = status=production. Pandemic-response has 1 accredited row counted as neither live nor decommissioned.

- [—] geographies.json: 35 rows, 32 country-level (EU, INTL supranational; US-CO sub-national).

- [—] regulations.json: exactly 99 rows, 8 neural_data=true (one proposed); '0 of 99 record recourse' structurally confirmed — no recourse/redress/appeal field exists in the schema.

- [—] WebFetch truncates deployments.json (~148KB); counts were parsed from complete raw JSON, not summarized extractions.

- [—] Every row is structural or pattern only; no row asserts or implies causation; tier grades reflect strength of the documented overlap, never strength of any causal story.

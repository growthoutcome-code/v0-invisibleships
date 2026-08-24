---
id: IS-HEALTH-REG-OVERLAPS
title: Crime — Overlaps with the Government Cloud record
collection: data
doc_type: register
section: public-health
geography: United States, with international comparison where a chart says so
generated_by: scripts/build_corpus_md.py
entry_count: 12
word_count: 1533
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# Overlaps with the Government Cloud record

*Independent research compiled from public records for informational purposes only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, **B** corroborated, **C** claimed — B and C may not be quoted as established fact. Causes are reported as attributed, never asserted. This dataset does not corroborate, and is not corroborated by, any other dataset in this corpus. See `meta/IS_META_disclaimer.md`.*

Structural and pattern observations only. Two things occurring in the same period is a co-occurrence. Each entry carries its own note saying so, and neither dataset corroborates the other.

**12 entries.**

### US suicide rate rose ~30-35% 1999-2018 (CDC MMWR mm6722a1; NCHS db362); record 49,476 deaths 2022 (db509); overdose record 107,941 in 2022 (db549)
[A] both

**Gov Cloud fact:** deployments.json (399 rows, health=32, 29 production) records only id, geography, vendor, domain, workload, status, accreditation, adoption_stage, maturity_score, TRL, source — no health-outcome, wellbeing, or population-impact field anywhere in the schema; regulations.json (99 rows) has no recourse/redress field

**Observation:** The procurement record measures the technical maturity of government health-data systems in detail over the same populations and years in which outcome statistics deteriorated and recovered, yet contains no field in which a health outcome could even be recorded.

*Basis:* structural

*Not a causal claim:* Does not show any deployment affected suicide, overdose, or any health outcome. The absence of outcome fields is a property of what the record measures, not evidence of harm or benefit.

### Pandemic-era mental health elevated: WHO 25% global rise in anxiety/depression first pandemic year (2022-03-02); US adult PHQ-8 depression 18.5% (2019) → 21.4% (2022) (NHSR 213)
[A] temporal

**Gov Cloud fact:** deployments.json: 10 of 14 pandemic-response deployments decommissioned (3 production, 1 accredited); milestones.json: COVIDSafe deleted 2022-08-10; EU DCC regulation lapsed 2023-06-30; HHS Tiberius wound down; CDC VAMS abandoned by most states

**Observation:** The emergency pandemic data infrastructure was largely dismantled across 2022-2023, during the same period pandemic-era mental-health indicators remained elevated above pre-pandemic baselines into 2022.

*Basis:* structural

*Not a causal claim:* Does not show decommissioning caused, prolonged, or relieved distress, nor that retaining these systems would have changed any indicator. The systems tracked infection, contact and vaccination — not mental health.

### US suicide rise 1999-2018 occurred in the WHO Americas region while most other regions declined
[A] jurisdictional

**Gov Cloud fact:** geographies.json: 6 of 35 jurisdictions in the americas region (US, US-CO, CA, BR, CL, MX); deployments.json: the US holds 7 of 32 health-domain deployments — the most of any single jurisdiction, all in production (NIH STRIDES x3, CMS Hybrid Cloud x2, VA x2)

**Observation:** The jurisdiction with the densest health-cloud deployment coverage in the dataset (US) is also the jurisdiction whose suicide-rate rise is documented in the register's health-signal corpus.

*Basis:* structural

*Not a causal claim:* Does not show any relation between US health-cloud deployments and suicide rates. The rise began in 1999, before any deployment in this dataset; co-location reflects US documentation practices.

### Psychiatric prescribing rising in England 2016-2025 (NHSBSA) and the US (ASPE/IQVIA), while schizophrenia prevalence stable (GBD)
[B] both

**Gov Cloud fact:** milestones.json: NHS England direct award of the Federated Data Platform to Palantir 2023-11-21 (GBP330M/7yr), pre-action legal challenge 2023-11-30; deployments.json: GB has 4 health-domain deployments, all production

**Observation:** England's largest health-data platform procurement (FDP, 2023) occurred midway through a documented decade of rising psychiatric prescribing in the same health system.

*Basis:* pattern

*Not a causal claim:* Does not show the FDP relates to prescribing volumes in any direction. The prescribing rise began ~7 years before the FDP award; no prescribing-effect evidence exists in either corpus.

### 2022 was the record year for both US overdose deaths (107,941; db549) and US suicides (49,476; db509)
[B] both

**Gov Cloud fact:** deployments.json: CDC disease monitoring (DCIPHER/HHS Protect lineage) expanded 2022 — Palantir, FedRAMP High, production; one of only 3 pandemic-response systems still in production

**Observation:** The CDC's cloud disease-monitoring platform was expanded in the same year the US recorded its highest-ever overdose and suicide death counts.

*Basis:* pattern

*Not a causal claim:* Does not show the expansion affected either death count, or that the deaths motivated the expansion. DCIPHER monitors infectious disease; the co-occurrence is calendar-year only.

### US life expectancy dipped 2020-21 and recovered to 79.0 by 2024 (db548)
[B] temporal

**Gov Cloud fact:** milestones.json: Tiberius live 2020-08-01, VAMS live 2020-12-01, COVIDSafe launched 2020-04-26 (~6-week emergency build); 10 of 14 pandemic systems decommissioned by ~2022-2023

**Observation:** The full lifecycle of the emergency data infrastructure — built in months during 2020, largely torn down by 2023 — brackets the US life-expectancy dip; the return to 79.0 by 2024 post-dates the teardown.

*Basis:* structural

*Not a causal claim:* Does not show the systems shortened or lengthened the mortality dip, nor that their removal enabled or delayed recovery. Both timelines are driven by the pandemic itself; the alignment is definitional, not evidential.

### US fentanyl wave onset 2013 (CDC); overdose deaths then rose to the 2022 record
[C] temporal

**Gov Cloud fact:** regulations.json: dataset's regulatory era begins with FedRAMP (2011), FISMA modernization (2014); milestones.json health/pandemic entries begin 2019-02-06; deployments.json contains no date fields — timing recoverable only through milestones

**Observation:** The deadliest documented US drug-supply shift (2013) predates nearly all health-domain cloud infrastructure recorded in this dataset (health milestones begin 2019) — the register also records where a health signal precedes the infrastructure entirely.

*Basis:* pattern

*Not a causal claim:* Does not show absence of infrastructure contributed to the epidemic, nor that later infrastructure responded to it. Included to demonstrate temporal precedence runs in both directions.

### Psychiatric prescribing rising 2016-2025 while schizophrenia prevalence stable (GBD)
[A] temporal

**Gov Cloud fact:** regulations.json: 8 of 99 instruments flag neural_data — OECD neurotech recommendation (2019), Chile Law 21.383 (2021), Chile Supreme Court Girardi v. Emotiv (2023), California SB 1223 (2024), Colorado HB24-1058 (2024), Montana SB 163 (2025), UNESCO recommendation (2025), UK ICO strategy (2026, proposed); 0 of 99 record any recourse mechanism

**Observation:** The period of rising psychiatric prescribing (2016-2025) is also the period in which jurisdictions began writing brain-data collection rules (2019-2026); the regulation record captures what may be collected but has no field for what a person can do about it.

*Basis:* structural

*Not a causal claim:* Does not show any link between neural-data regulation and prescribing trends, or between either and brain health. Records the co-timing of two documentation waves and a structural gap in the regulatory record.

### Pandemic-era distress indicators remained elevated into 2022 (NHSR 213; WHO 2022-03-02)
[B] temporal

**Gov Cloud fact:** milestones.json: Aotearoa Immunisation Register made permanent 2022-11-01 ('coevolution': pandemic register hardened into permanent NIR replacement); NZ CIR and COVID Tracer decommissioned

**Observation:** While most pandemic systems were dismantled, at least one (NZ's immunisation register) was made permanent in late 2022 — the same period distress indicators remained elevated — the infrastructure's fate diverged (teardown vs permanence) with no reference to health-indicator trajectories in either case.

*Basis:* pattern

*Not a causal claim:* Does not show the register's permanence relates to mental-health indicators anywhere. The US/WHO indicators cited are not NZ-specific.

### The register's verified health signals come from US (CDC/NCHS), England (NHSBSA), and global (WHO/GBD) statistical systems, 1999-2025
[A] jurisdictional

**Gov Cloud fact:** deployments.json: health deployments span 12 of 35 jurisdictions — US 7, GB 4, CN 3, DE 3, EU 3, RU 3, FR 2, IL 2, NZ 2, AE 1, AU 1, QA 1

**Observation:** The overlap register can only be dense where both corpora are dense: the US and UK account for 11 of 32 health deployments and nearly all citable outcome statistics; most dataset jurisdictions (incl. CN, RU, AE) have health deployments but no comparable outcome series to overlap against.

*Basis:* structural

*Not a causal claim:* Does not show health outcomes differ by deployment density. Documents a coverage artifact: where statistics and procurement records are co-published, overlaps become visible; elsewhere they cannot be constructed at all.

### US overdose deaths declined from the 2022 record to 79,384 in 2024 (−26.2%) and provisional 69,973 in 2025
[C] both

**Gov Cloud fact:** milestones.json (track E): BARDA FY2025 enacted $1.015B with FY2026 request $654M, declining; total US biodefense FY2026 request declining across agencies

**Observation:** US overdose deaths and US federal biodefense/pandemic-preparedness budgets declined over the same 2023-2026 window.

*Basis:* pattern

*Not a causal claim:* Does not show any relation between the two declines — biodefense funding does not address overdose; the overdose decline is attributed elsewhere (naloxone access, supply changes). Recorded strictly as a co-trend.

### Mental-health indicators remained above pre-pandemic baselines into 2022, the period pandemic credentials were wound down
[B] temporal

**Gov Cloud fact:** milestones.json: WHO Global Digital Health Certification Network adopted the EU DCC standard globally 2023-06-05 ('coevolution', 'standard persists'), 25 days before the EU DCC regulation lapsed 2023-06-30 ('decoupled')

**Observation:** The legal instrument behind Europe's pandemic credential expired in June 2023, but its technical standard had been globalized by the WHO weeks earlier — the infrastructure pattern outlived its legal basis during the tail of the pandemic-era mental-health elevation.

*Basis:* structural

*Not a causal claim:* Does not show certification infrastructure affected mental health in any way, nor that its persistence or lapse had health consequences.

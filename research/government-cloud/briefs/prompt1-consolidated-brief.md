# Government Cloud — Prompt 1: Mission Workload & Adoption Map

**Consolidated brief · research date 2026-08-16 · 28 geographies · 399 deployment rows ·
296 sources (Tier A 122 / B 155 / C 20) · 89 vendors · 20 mission domains.**

*Disclaimer.* This report is independent research compiled from public sources for
informational purposes only; it is not legal, procurement, or investment advice.
References to any government body, company, or product are for identification and analysis;
they imply no affiliation or endorsement. No wrongdoing by any named organisation is
asserted except where a cited primary source (court record, regulator finding, official
audit) makes that finding, in which case it is attributed. Tier B is reported-but-unverified
and Tier C is claimed/theoretical — neither may be quoted from this report as established
fact. © 2026. Corrections welcome.

---

## Executive summary

The global government-cloud map is no longer a story of three American hyperscalers
expanding uniformly. It is a story of **three postures toward those hyperscalers**, and
which posture a government holds now predicts its cloud architecture better than its wealth
or its cloud maturity does.

The first posture is **deep multi-cloud adoption** with a national-security ceiling — the
United States, United Kingdom, Australia, and increasingly the Gulf and Israel — where AWS,
Azure and Google Cloud run production mission workloads up to and including classified and
top-secret tiers, gated by elaborate accreditation regimes (FedRAMP/DoD Impact Levels,
IRAP, UK classification tiers). The second is **sovereign-gated admission** — France,
Germany, the EU institutions, and the Gulf states — where the same vendors are allowed in
only through trusted-cloud vehicles, national-champion joint ventures, or sovereign control
overlays (SecNumCloud/S3NS, Delos, Core42's Insight-on-Azure, the EU's €180M all-European
framework). The third is **documented non-adoption** — the Netherlands, Sweden and Denmark
pulling government workloads *off* US public cloud on data-protection grounds, and the
Russian Federation and People's Republic of China, where the big three are absent from
government entirely. That absence is not a gap in this research; it is recorded as 22
explicit `decommissioned`/`laggard` rows.

Two structural findings cut across all three postures. **Sovereignty law is now the primary
force shaping deployment** — data-localisation statutes, ownership-control certification
criteria, and extraterritorial-access fears explain more of the current map than price or
capability. And the **emerging-technology domains** (biotech/genomics, neurotech, municipal
sensing, pandemic infrastructure) sit disproportionately on either public/federated research
infrastructure (EU) or state and vendor-specific platforms (Palantir Foundry across US/UK
health-data integration; Huawei across African government cloud), rather than on
commodity hyperscaler IaaS — a signal that the most sensitive new workloads are exactly
where the sovereignty contest concentrates.

## By geography (highlights; full data in the matrix workbook)

**United States (74 rows + Colorado exemplar, 18).** The deepest estate in the study: JWCC
and the intelligence clouds (C2E, NSA WildAndStormy) put all major vendors into classified
production; AWS anchors civilian mission systems (IRS, FEMA, Login.gov, CBP/ICE) with Azure
second and Palantir dominant at the application layer for DHS enforcement. The mandated
Colorado deep-dive established the study's sharpest legal finding: the Colorado Privacy Act,
even as amended by HB24-1058 to cover neural and biological data, **does not bind state or
local government** — the C.R.S. 6-1-1304(2) carve-out was left untouched — so the
first-in-nation neural-data protections do not constrain police use of biometric or
neuro-derived data. Colorado also shows live municipal-sensing contestation (Denver's Flock
ALPR termination after ICE-search revelations; permanent ShotSpotter incident-audio
retention).

**Europe (UK 30; DE 17; EU 15; FR 8; NL 7; PL 7; DK/SE/NO/FI 13).** The three-posture split
in miniature. The UK is the mature multi-cloud outlier (AWS-led, Google's £400M sovereign
MOD win, Palantir's NHS Federated Data Platform). France and Germany gate hyperscalers behind
SecNumCloud and Delos/StackIT. The Nordics and Netherlands are the clearest documented
pullback — Denmark's DPA blocked Google Workspace in schools; Sweden keeps US cloud out of
core administration; the Netherlands ordered UWV and the SVB off public cloud in July 2026.
EU-wide emerging-tech programs (the Genomic Data Infrastructure, EUCAIM, EBRAINS) run on
federated European public e-infrastructure, hyperscalers absent by design.

**Australia & New Zealand (26; 22).** Australia has the study's most structured sovereignty
regime (Hosting Certification Framework + IRAP) topped by a A$2bn AWS Top Secret Cloud. New
Zealand is pivoting from offshore-capable to genuinely onshore after the 2024–25 Auckland
Azure and AWS region launches; Inland Revenue's onshore-cloud tender for the START tax engine
is the sovereignty bellwether.

**Middle East (SA 15; IL 15; AE 14; QA 10).** The Gulf co-invests with hyperscalers at
enormous scale behind national-champion control layers — Saudi Arabia's Deem + HUMAIN, the
UAE's Core42 "Insight" sovereign cloud on Azure. Qatar is a clean Microsoft-anchored
government build. Israel's Project Nimbus (AWS + Google, $1.2bn) carries a carefully
separated record: the *documented* (a March 2024 Google–MoD landing-zone contract; reporting
that Google widened an IDF unit's AI access after October 2023) is held apart from the
*alleged and contested* (that Nimbus directly powers Gaza targeting systems, which the
contract text does not establish and Google denies).

**Africa (ZA 11; KE/NG/EG/RW).** The most geopolitical contest: only South Africa hosts all
four Western hyperscalers in-country, and even its SITA GovCloud embeds Huawei. Elsewhere the
**Huawei Digital Silk Road is the dominant government-cloud reality** (Kenya's Konza,
concessional-loan financed; Egypt's Cairo region; inside SITA), with Western counter-moves
announced-but-stalled (Microsoft-G42 Olkaria) or edge-based (AWS Outposts Rwanda).

**Americas ex-US (CA/BR/MX).** Three sovereignty models: Brazil state-owned (SERPRO/Dataprev
run the Nuvem de Governo and gov.br for 150M+ users); Canada broker-mediated and
hyperscaler-heavy with a CLOUD Act debate; Mexico hyperscaler-region-driven (all three in
Querétaro, 2024–2026).

**Russia & PRC (23; 51) — the absence.** Post-2022 sanctions plus Decree 166 removed the big
three from Russia, replaced by Gosoblako/GEOP, Cloud.ru, Yandex, and Astra Linux. In China,
xinchuang domestic-substitution plus MLPS 2.0 structurally exclude foreign clouds from
government (AWS via Sinnet, Azure via 21Vianet serve commercial only; Google absent); the
market is Huawei/Alibaba/Tencent/the state telcos/Inspur over the East Data West Compute
backbone. PRC public-security rows (Police Cloud, Sharp Eyes) are sourced to academic and
research-institute work, not speculation.

## Cross-cutting findings

- **Palantir is the study's quiet through-line** — the dominant application layer over
  hyperscaler IaaS for the most sensitive Western government data (US DHS enforcement +
  vaccine allocation; UK NHS FDP; German state police), which makes it a single point of
  concentration that a vendor-only view of "the big three" misses.
- **The COVID emergency→standing pattern recurs everywhere** — front-end apps were
  decommissioned (US VAMS, UK/NZ COVID apps) but the substrate persisted and expanded into
  permanent public-health infrastructure (US Palantir/AWS-GovCloud + IZ Gateway; UK COVID
  Data Store → FDP; NZ CIR → AIR on AWS). This is Prompt 4's natural experiment, seeded here.
- **Emerging-tech maturity is bimodal** — genomics is institutionalised (NIH STRIDES, UK
  Biobank, EU GDI) while neurotech is archive-only and neuro-forensics returned *zero*
  government deployment rows (the US federal record ends at a 2018 NASEM workshop and case
  law excluding fMRI evidence). Muon tomography at borders is R&D, not procurement. Refusing
  to manufacture rows for these is itself a finding.

## What could not be verified (carried into later prompts)

Vendor substrate is undisclosed for several load-bearing systems (NHS FDP-on-AWS is Tier C;
Palantir/Tiberius IaaS Tier B; Colorado Axon/Flock/ShotSpotter per-tenant cloud; Israel's
national genomic DB). Several confirmed programs have no public cloud vendor (US courts,
CISA elections; Australia's My Health Record, Digital ID, AusAlert; EU pandemic cloud).
Russia and PRC per-agency/per-province mappings are indicative, held at visibly lower
confidence by design. And archived-URL capture (Wayback) has not yet run — it is the next
synthesis task before any public use.

---

*Companion artefacts: `prompt1-matrix.xlsx` (the geography×domain and geography×vendor
matrices plus the full row-level data), `seed.sql` and the CSVs in `03-dataset/` (importable
to Supabase), and the six batch briefs in `02-outputs/prompt-1-adoption/`.*

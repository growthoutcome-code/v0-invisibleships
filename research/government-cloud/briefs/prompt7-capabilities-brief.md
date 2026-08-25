# Government Cloud — Prompt 7: Platform Functionality & Capabilities

**73 documented capabilities across 18 vendors/systems and 17 categories · research date
2026-08-17 · 660 sources total.**

*Disclaimer.* Independent research from public sources (vendor service pages, government
accreditation and technical docs), informational only. Capabilities are described factually;
for surveillance/enforcement tools the function is stated neutrally. Vendor marketing claims
(e.g., time-savings percentages) are flagged and not treated as verified. © 2026.

## Why this layer exists

The adoption map (Prompt 1) answered *where* government cloud is deployed; this layer answers
*what it actually does*. It catalogues the concrete services and, for each, the plain
technical function plus the government mission use — turning "AWS GovCloud is used by CBP"
into "Rekognition performs face detection/match used for identity verification and watchlist
matching." The register is the reference that lets a reader see the machine behind the
deployment.

## What the platforms do — the shape of it

Capabilities cluster into a clear hierarchy. **AI/ML (14) is the largest category**, followed
by **identity/biometric (10)** and **data-fusion (7)** — which is the real story of the
2024–2026 period: government cloud is no longer primarily storage and compute, it is
increasingly *inference and integration*. Four cross-cutting capabilities now define the
frontier and appear across every hyperscaler:

1. **Classified/air-gapped generative AI.** Azure OpenAI (GPT-class models) runs in the
   Secret and Top Secret clouds; Google's Gemini for Government runs fully air-gapped on
   Google Distributed Cloud; AWS Bedrock is in the Top Secret cloud; Oracle and IBM (watsonx)
   offer sovereign LLM access. Frontier AI now operates inside classified enclaves.
2. **Confidential computing.** AWS Nitro/Enclaves, Azure Confidential Computing, and GDC's
   hardware TEEs protect data *in use* and, in the Nitro case, cryptographically bar the
   provider itself from accessing running workloads — the technical answer to the sovereignty
   anxieties in Prompt 3.
3. **Data fusion / lakehouse.** Microsoft Fabric, AWS Lake Formation, Oracle's AI Data
   Platform, IBM watsonx.data, and — at the application layer — Palantir Foundry's ontology
   all do the same job: break agency silos into one queryable model. This is the capability
   that makes cross-agency targeting and analytics possible.
4. **Identity & biometric.** Face match (Rekognition, Azure Face, NEC, DataWorks Plus,
   Clearview), plus national digital-identity stacks (gov.br, Nafath/Absher, GOV.UK One Login,
   RealMe, Aadhaar) that authenticate citizens and gate service delivery.

## The two layers, and where the sensitive functions live

**Hyperscaler layer (AWS 14, Google 10, Azure 9, Oracle 5, IBM 4)** supplies the primitives:
compute, storage, confidential compute, AI/ML, analytics, security (SIEM), edge/satellite.
These are dual-use — the same Rekognition that verifies a passport can match a face against a
watchlist; the same Transcribe that captions a meeting can transcribe an intercept. The
register states the function; the use is set by the operator.

**Application/ISV layer** is where the mission-specific and most contested functions live.
Palantir (7) is the connective tissue — Foundry's ontology and Gotham's link analysis fuse
data and drive targeting; ImmigrationOS explicitly profiles and prioritizes removals; the NHS
FDP coordinates care. Axon (3) runs digital evidence and AI report-writing (Draft One). The
sensing tools — ShotSpotter (acoustic gunshot detection), Flock (ALPR network + audio),
Clearview (face search against scraped images) — are catalogued with precise function, and
these are exactly the systems that recur in the litigation layer. **The capability register
and the litigation register describe the same tools from two angles: what they do, and what
they've been sued over.**

## Sovereign and e-government platforms

Core42 Insight (UAE), Delos Cloud (Germany), Gosoblako/GEOP (Russia), Huawei Cloud Stack /
KonzaCloud, and Brazil's SERPRO/Dataprev are catalogued as *sovereign control planes* — they
provide the same IaaS/PaaS but wrap it in residency, cleared-staff operation, and compliance
tooling. The e-government identity platforms (gov.br, Nafath/Absher, One Login, RealMe,
Aadhaar) are the citizen-facing edge: authentication, verified identity, and service delivery
at national scale.

## What could not be verified

Availability of specific services at the Secret/Top Secret tiers is often not publicly
enumerated (those catalogues aren't public), so a few AWS AI services' presence above IL5 is
inferred and flagged. Azure GPT model-version and per-tier accreditation dates move quickly.
Vendor time-savings figures (Draft One, Flock) are marketing, not validated. Face-API
government/law-enforcement availability is gated (Limited Access) and not fully specified.
Several identity-platform descriptions rest on prior knowledge plus official sites rather than
fetched spec pages. All flagged in the dataset's UNVERIFIED notes.

*Companion: `capabilities.csv` / `seed.sql` (eleven tables) and the Capabilities tab in the
dashboard, filterable by category.*

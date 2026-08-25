# Government Cloud — Prompt 3: Sovereignty, Regulation & the Rights Frontier

**Consolidated brief · research date 2026-08-16 · 99 regulatory instruments · 29
geographies · 44 with data-localisation mandates · 8 covering neural/biological data ·
466 sources total.**

*Disclaimer.* Independent research from public/primary legal sources, informational only,
not legal advice. Instruments are described as of the research date; applicability dates —
especially the EU AI Act's — remain politically contested and may change. References imply
no affiliation or endorsement. Tier B/C are not established fact. © 2026.

## The one-sentence finding

Across 29 jurisdictions, **sovereignty law has become the binding constraint on government
cloud** — 44 of 99 instruments now compel in-country data residency or domestic
ownership/control — and it is bifurcating the world into a data-residency-by-default bloc
(Russia, China, the Gulf, and a fast-hardening Europe) and a still-permissive-but-nervous
bloc (US allies wrestling with US extraterritorial reach), while a genuinely new legal
category — neural and biological data — is being written in real time with no common
definition.

## The EU as a legislative system, not a rule

Europe is the densest regime (35 instruments, 16 with localisation force) and the one moving
fastest. The base layer is GDPR, whose real sovereignty pressure point is the **EU–US Data
Privacy Framework adequacy decision (2023)** — fragile, under Schrems-style challenge, and
the single biggest variable in the whole map: if it falls, every US-hyperscaler government
deployment in Europe is exposed at once. On top sit function-specific instruments with
staggered live dates: the **Data Act** (applicable Sept 2025; free cloud switching from Jan
2027), the **AI Act** — whose high-risk obligations were **deferred by the Digital Omnibus
to December 2027** (Annex III) and August 2028 (Annex I), a change that is enacted but
politically contested and flagged as such on every row — the **European Health Data Space**
(genomic secondary-use rules phasing to 2031), **NIS2/DORA/CRA** for cyber-resilience, and,
critically, the **still-unadopted EU cloud certification scheme (EUCS)**, deadlocked
precisely over whether the top assurance tier carries ownership-control "sovereignty"
criteria. Because EUCS stalled, the Commission's **Cloud Sovereignty Framework (SEAL levels,
Nov 2025)** now shapes procurement by soft law instead. Member states are hardening ahead of
Brussels: France's SecNumCloud demands immunity from extra-EU law, Germany added explicit
sovereignty criteria (BSI C3A), and the Netherlands **blocked a US acquisition of a cloud
provider** (Kyndryl/Solvinity, May 2026) — the first such veto.

## Extraterritoriality: the problem the whole map orbits

The **US CLOUD Act** — compelling US-headquartered providers to produce data regardless of
where it sits — is the anxiety that explains most of the non-US regulatory activity in this
dataset. It is why Canada debates a sovereign cloud despite Protected-B residency rules, why
Sweden's tax agency and Denmark's DPA moved public bodies off Microsoft, and why the Gulf
and Europe insist on local-operator control layers. The vendors' engineered answers —
SecNumCloud-qualified subsidiaries, Delos/Bleu/S3NS JVs, Core42's Insight overlay — are all
attempts to place a legal firebreak between the workload and US jurisdiction; whether they
actually sever CLOUD Act reach or only mitigate the perception is the contested question a
full sovereignty analysis has to hold open, not resolve.

## The rights frontier: neural and biological data

Eight instruments now reach neural data, and their **definitional incoherence is itself the
finding**. Colorado (HB24-1058, 2024) folds biological and neural data into a comprehensive
privacy act — but its government carve-out (C.R.S. 6-1-1304(2)) means the protections do not
bind Colorado's own agencies or police, the exact bodies most likely to acquire neuro-derived
data. California (SB 1223) bolts neural data onto the CCPA's sensitive-data list; Montana (SB
163) attaches it to genetic-privacy law. Three states, three legal vehicles, three
definitions, and no federal floor — because the proposed federal moratorium on state AI
regulation was stripped from OBBBA in July 2025, leaving the patchwork intact. Internationally,
Chile leads with a constitutional neurorights amendment and an apex-court deletion order
(Girardi v. Emotiv), and the **UNESCO Recommendation on the Ethics of Neurotechnology
(Nov 2025)** is the first global standard — but soft law. For government cloud the
architectural question is unanswered: none of the hyperscalers has shipped a neural-data
compliance control, so the burden sits entirely with the customer, and the Colorado carve-out
means in the one place it is regulated, the government is exempt.

## Certification as trade barrier

Several regimes function as much as market-access gates as security controls: EUCS's
sovereignty tier, France's immunity requirement, Australia's Certified-Strategic
ownership-control test, and China's MLPS 2.0 + xinchuang, which together make government
accreditation structurally unavailable to foreign clouds. Where a scheme encodes
ownership/nationality rather than a testable security property, it forecloses the big three
by construction — the regulatory mirror of the procurement exclusions seen in Prompt 2.

## The hard-localisation bloc

Russia (152-FZ residency since 2015; Decree 166's foreign-software use-ban from Jan 2025;
the Sovereign Internet Law) and China (CSL/DSL/PIPL + MLPS 2.0 + xinchuang) are the
strictest — total domestic-residency-and-control regimes that make the big three's absence a
matter of law, not competition. The Gulf (Saudi CCRF + PDPL, UAE health-data localisation)
and a widening set of African states (Rwanda's default in-country rule; Nigeria's Aug-2026
Sovereign Cloud framework; Kenya's Cabinet-Secretary localisation power) sit close behind —
residency-by-default, with foreign vendors admitted only through local structures.

## Structured judgments (for the scenario work in later synthesis)

The dataset supports a few calibrated reads, stated with confidence separate from
probability. *High confidence:* localisation intensity is rising almost everywhere, and the
neural-data category will keep fragmenting before it converges. *Moderate confidence, high
stakes:* EU–US adequacy is the highest-leverage single point of failure — its annulment
would do more to reshape the map than any new statute. *Contested:* whether EU sovereignty
requirements harden into outright hyperscaler exclusion (the EUCS-sovereignty-tier path) or
settle into the accommodation the current sovereign-JV model represents — the evidence today
least-disconfirms accommodation, but the Dutch veto and the C3A/SEAL trajectory keep the
exclusion hypothesis alive.

## What could not be verified

RU and PRC instruments rest on secondary/translated sources and carry lower confidence by
design. Several dates (the AI Act sub-deadlines, C3A publication, various commencement SIs)
are amended-and-contested or approximate. UNESCO/OECD instruments are global soft law (coded
`INTL`). California and Montana are coded `US` (the schema's only US subnational slug is
`US-CO`); Chile and Spain were added as geographies this run. EU–US adequacy is listed
in-force but is under active legal challenge.

*Companion: `regulations.csv` / `seed.sql` in `03-dataset/` (now seven populated tables,
1,212 inserts). Prompt 4 will place these instruments on the master timeline against vendor
releases and deployments.*

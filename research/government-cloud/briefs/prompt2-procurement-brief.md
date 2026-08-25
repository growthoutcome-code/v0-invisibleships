# Government Cloud — Prompt 2: Procurement, Contracts & Competitive Position

**Consolidated brief · research date 2026-08-16 · 90 award/vehicle rows · 23 geographies ·
~$102.8B in disclosed or estimated value · 6 emergency/sole-source · 368 sources total.**

*Disclaimer.* Independent research from public sources, informational only, not procurement
or investment advice. Dollar figures are disclosed contract values, published investment
pledges, or labelled estimates — many government awards disclose no value, shown as blank
rather than guessed. References imply no affiliation or endorsement. Tier B/C are not
established fact. © 2026.

## How to read the money

The ~$102.8B total is a **mixed aggregate and must not be quoted as a single "market
size"** — it combines true contract ceilings (JWCC $9B, NSA WildAndStormy $10B), multi-year
national *investment pledges* that are capex commitments rather than government contracts
(Oracle–Saudi $14B, AWS–Israel $7.2B, AWS–Mexico $5B), and a few vendor-projected *savings*
figures (the GSA OneGov deals). The `value_basis` column on every row records which kind it
is; the honest headline is not a number but a **shape**: government cloud money now moves
through five distinct mechanisms, and which one a country uses is the real finding.

## Five procurement mechanisms

**1. Enterprise multi-award IDIQs (the US model).** JWCC ($9B, AWS/Azure/Google/Oracle,
2022) and its successor Unified Cloud Marketplace, the IC's C2E, NSA's $10B sole-award, and
DHS Cumulus ($2.5B, AWS first, 2026). Layered on top since 2025 are the **GSA OneGov**
enterprise-discount agreements (AWS, Microsoft, Google, Oracle) — pricing vehicles, not
fixed awards. The defining trait is competition preserved via multi-award, with task orders
allocating the real spend.

**2. Whole-of-government volume agreements (UK/Australia/NZ).** The UK's G-Cloud framework
plus vendor MoUs (AWS OGVA, Microsoft SPA24) and discrete mega-awards (Google's £400M MOD
sovereign cloud; the HMRC £473M single-bidder AWS deal — a cited procurement failure after
rivals walked). Australia's DTA sourcing (AWS to 2028; Microsoft VSA6 from July 2026) topped
by the A$2bn sole-source AWS Top Secret Cloud. New Zealand's evergreen framework agreements
(AWS/Microsoft/Google + sovereign Catalyst/Datacom).

**3. Sovereign-gated frameworks (EU/France/Germany).** The EU's €180M April-2026 framework
awarded to four all-European consortia with US hyperscalers excluded as operators; France's
SecNumCloud-gated UGAP vehicles (S3NS, Bleu); Germany's Delos Cloud. Admission is conditional
on ownership/operating-control criteria, not just price.

**4. Sovereign-fund and diplomacy-timed capex (the Gulf).** Saudi (Oracle $14B, AWS $5.3B
region + HUMAIN $5B AI Zone, all PIF-anchored and announced around state visits), the UAE
(Microsoft's $1.5B G42 stake, Core42's AED13bn Abu Dhabi mandate, Stargate UAE). These are
co-investments, frequently announced outside open tender.

**5. State-operated and loan-financed sovereign clouds (Brazil, Africa, Russia, China).**
Brazil's Nuvem de Governo run by state firms SERPRO/Dataprev (hyperscalers resold *through*
them, sidestepping the contested federal pregão); the **Chinese concessional-loan mechanism**
in Africa, where an Eximbank loan is tied to a Huawei EPC contract (Kenya's Konza, ~$173–185M)
— financing and vendor selection bundled outside competition; Russia's Gosoblako under
import-substitution; and the PRC's xinchuang single-source provincial tenders (e.g. Huawei's
CNY287M Changsha win). In the last two, the big three win nothing — the ledger records their
exit (Russia) and structural exclusion (China) as findings.

## Appropriation-to-award: the OBBBA cluster

The clearest funding-to-award trace in the dataset runs from the **One Big Beautiful Bill Act
(H.R.1, enacted 4 July 2025)** — which appropriated roughly $170.7B for immigration and border
enforcement through FY2029, including ~$6.2B for border technology — to the FY25–26
enforcement-analytics buys: Palantir's ImmigrationOS ($30M prototype + $29.9M maintenance,
sole-source), the $95.9M ICE Investigative Case Management O&M, the record ~$140M ICE/CBP
hyperscaler spend, and biometric awards (BI2 iris $25M, Clearview facial recognition). These
are flagged `emergency` and are the ledger's direct feed into Prompt 4's enforcement-output
study. Project 2025 is recorded as a non-binding blueprint, distinct from this enacted law.

## Re-compete calendar (next 36 months) and Three Horizons

Only three dated re-competes fall inside the window — France's Health Data Hub SecNumCloud
migration (end-2026, repeatedly slipped), the ICE BI2 biometric contract (mid-2027), and
Australia's DTA AWS renewal (Feb 2028) — because most large vehicles were awarded 2022–2026
with 5–10 year terms, so the wave of re-competes lands in **Horizon 3 (2028+)**: JWCC's UCM
transition, the UK OGVA/HMRC terms, and the EU sovereign framework's 2032 expiry. Horizon 1
(0–12mo) is dominated by the OneGov discount agreements bedding in and DHS Cumulus adding its
non-AWS awardees. Horizon 2 (12–36mo) is the sovereign-framework build-out in Europe and the
Gulf capex landing as live capacity.

## Competitive position (from the ledger)

AWS holds the widest award footprint and the classified-tier anchors (JWCC, NSA, GCHQ, ASD
Top Secret, Nimbus). Azure leads productivity-estate and sovereign-overlay deals (Core42,
Delos, Qatar, UK MoU). Google's position is narrower but strategically placed at the top tier
(UK MOD sovereign, Nimbus co-primary). Oracle rides the multi-award vehicles and the largest
single pledge (Saudi). Palantir is the highest-value *application-layer* incumbent
(NHS FDP £330M; the ICE cluster). Local champions (Huawei, SERPRO/Dataprev, Rostelecom,
Core42, S3NS) win precisely where sovereignty law or financing structure closes the door to
the big three.

## What could not be verified

Many awards disclose no value (blank, not guessed) — IC C2E ("tens of billions"), GCHQ/AWS
(£500M–£1bn range), most framework agreements, all RU/PRC values beyond Changsha. The GSA
OneGov figures are projected savings, not contract values. The Cloud II €417.7M row is a
multi-vendor DPS total parked on one row for placement, not a T-Systems award. RU/PRC rows
carry lower confidence by design. Full caveats are in each batch's UNVERIFIED list.

*Companion: `awards.csv` / `seed.sql` in `03-dataset/`, and `prompt2-awards.xlsx` (ledger,
re-compete calendar, funding and geography rollups).*

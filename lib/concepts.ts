/**
 * Core concepts for invisibleships.com/concepts.
 *
 * Every concept carries a visible BASIS, extending the evidence-tier discipline
 * from sources to claims:
 *
 *   documented  — a source, ruling or official record supports it directly
 *   structural  — it follows from what the dataset does or does not contain
 *   pattern     — an observation drawn from experience, offered as an observation
 *
 * A reader who rejects every `pattern` can still rely on every `documented` entry.
 * That separation is the point; never blend two bases inside one concept.
 *
 * Figures below are verified against public/data/tables/*.json.
 */

export type Basis = "documented" | "structural" | "pattern";

export type Concept = {
  id: string;
  basis: Basis;
  title: string;
  body: string;
  /** Short evidence lines. Kept as text where a stable public URL isn't recorded. */
  evidence?: string[];
};

export const BASIS_LABEL: Record<Basis, string> = {
  documented: "Documented",
  structural: "Structural",
  pattern: "Pattern",
};

export const BASIS_NOTE: Record<Basis, string> = {
  documented: "A source, ruling, or official record supports this directly.",
  structural: "This follows from what the dataset does — or does not — contain.",
  pattern: "An observation drawn from experience, offered as an observation.",
};

export const CONCEPTS: Concept[] = [
  {
    id: "no-column-for-you",
    basis: "structural",
    title: "There is no column for you",
    body:
      "This research can describe who sells the technology, who buys it, what they paid, when the contract renews, which law applies and how mature each rollout is. Across eleven tables and 1,922 records, the person a system is used on appears in exactly one place: as someone who sued. Rollout maturity is even measured on a scale that runs from innovator to laggard — the buyer's vocabulary, end to end.",
    evidence: [
      "10 of 1,922 records describe an individual, all of them litigants",
      "0 of 99 regulations record a route to individual review",
      "adoption_stage vocabulary: innovator → early-adopter → early-majority → late-majority → laggard",
    ],
  },
  {
    id: "accountability-not-wired",
    basis: "structural",
    title: "Accountability isn't wired to deployment, even in the schema",
    body:
      "Litigation records carry a vendor, a domain, a court and an outcome — but nothing links a ruling to the specific systems it concerned. A finding and the deployments it should govern cannot be joined. The accountability gap is not only a policy problem; it is visible as a missing relationship in the data model.",
    evidence: [
      "litigation table: no deployment reference on any of 46 records",
      "regulations record which domains are affected, not which systems",
    ],
  },
  {
    id: "findings-dont-stop-deployment",
    basis: "documented",
    title: "A regulator finding does not stop a deployment",
    body:
      "Data-protection authorities in seven countries have each found against the same company for collecting people's biometric data without consent. The operation continues. A ruling, on this record, is a cost rather than a stop.",
    evidence: [
      "Clearview AI: ICO (UK), CNIL (France), Garante (Italy), HDPA (Greece), AP (Netherlands), OAIC (Australia), OPC (Canada)",
      "Additional US actions: In re Clearview AI (BIPA, MDL 2967), ACLU v Clearview AI",
    ],
  },
  {
    id: "emergency-systems-withdrawn",
    basis: "documented",
    title: "Systems built for an emergency get switched off after it",
    body:
      "Ten of the fourteen pandemic-response deployments in this record are decommissioned. The arrival of a capability is not a commitment to maintain it — which matters most for anyone who came to depend on one.",
    evidence: [
      "22 of 399 deployments decommissioned; 10 of those are pandemic-response",
      "By contrast: health 32 deployments (29 live), law enforcement 31 (27 live)",
    ],
  },
  {
    id: "organised-harassment-is-fact",
    basis: "documented",
    title: "Organised covert harassment of individuals is established fact",
    body:
      "Not a theory, and not confined to states. Seven decided or settled cases in this record describe sustained, deniable targeting of named people — by police forces and by corporations. Two further entries are included as context and as a contested case, and are labelled as such rather than counted alongside these.",
    evidence: [
      "Socialist Workers Party v Attorney General — COINTELPRO burglaries, informants, mail-opening",
      "UK Undercover Policing (Spy Cops) — Investigatory Powers Tribunal, ongoing",
      "HP boardroom pretexting — settled with the California Attorney General",
      "eBay cyberstalking of two journalists — settled",
      "Nestlé/Securitas infiltration of Attac — decided, Lausanne",
      "WhatsApp/Meta v NSO Group — Pegasus, on appeal",
    ],
  },
  {
    id: "official-is-not-independent",
    basis: "documented",
    title: "“Official” is not the same as “independent”",
    body:
      "73 of the 87 vendor-published sources in this research carry the top evidence tier. That is defensible for a fact like which company won which contract, and it is not the same as independent confirmation. Stated here because a reader deserves to weigh it, and because the limits of a record are part of the record.",
    evidence: [
      "660 citations across 604 distinct URLs and 389 publishers",
      "Tier A 323 · Tier B 285 · Tier C 52",
      "0 of 660 sources currently hold an archived copy",
    ],
  },
];

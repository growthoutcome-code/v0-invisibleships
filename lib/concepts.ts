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
 * A second, ORTHOGONAL axis records who formed the claim:
 *
 *   ai      — derived by AI analysis of the dataset
 *   author  — Sean's own observation, from experience
 *
 * The two axes are independent: an AI analysis can be documented or structural,
 * and an author's observation is usually — but not necessarily — a pattern.
 *
 * Figures below are verified against public/data/tables/*.json.
 */

export type Basis = "documented" | "structural" | "pattern";
export type Origin = "ai" | "author";
export type Verification = "unverified" | "partially_verified" | "verified";

export type Concept = {
  id: string;
  origin: Origin;
  basis: Basis;
  title: string;
  body: string;
  /** Short evidence lines. Kept as text where a stable public URL isn't recorded. */
  evidence?: string[];
  /** Open questions the concept does NOT answer. Shown to the reader. */
  questions?: string[];
  /** External or internal references, with how they relate. */
  references?: { label: string; href: string }[];
  /** How the references relate — prevents a contextual link reading as proof. */
  referencesNote?: string;
  /** Independent verification state. Rendered whenever it is not "verified". */
  verification?: Verification;
  /** Scope limit shown beneath the concept. Verbatim, never paraphrased. */
  disclaimer?: string;
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  unverified: "Not independently verified",
  partially_verified: "Partially verified",
  verified: "Independently verified",
};

export const BASIS_LABEL: Record<Basis, string> = {
  documented: "Documented",
  structural: "Structural",
  pattern: "Pattern",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  ai: "AI analysis",
  author: "Author's observation",
};

export const ORIGIN_NOTE: Record<Origin, string> = {
  ai: "Derived by AI analysis of the research dataset.",
  author: "The author's own observation, drawn from experience.",
};

export const BASIS_NOTE: Record<Basis, string> = {
  documented: "A source, ruling, or official record supports this directly.",
  structural: "This follows from what the dataset does — or does not — contain.",
  pattern: "An observation drawn from experience, offered as an observation.",
};

export const CONCEPTS: Concept[] = [
  {
    id: "no-column-for-you",
    origin: "ai",
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
    origin: "ai",
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
    origin: "ai",
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
    origin: "ai",
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
    origin: "ai",
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
    origin: "ai",
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
  {
    id: "fined-in-europe-hired-in-america",
    origin: "ai",
    basis: "documented",
    title: "Fined in Europe, hired in America",
    body:
      "One facial-recognition company has been fined roughly €90 million by four European regulators for collecting people's faces without asking, and ordered to delete data in Australia and Canada. Over the same period, US Immigration and Customs Enforcement paid it $12.75 million — one of those the largest facial-recognition purchase ICE has made. Its American class-action settlement was paid in company shares rather than cash. One arm of government is penalising what another arm is buying, and nothing in this record shows the two ever meeting.",
    evidence: [
      "Clearview AI appears in 15 of the 46 litigation records — the most of any single company",
      "Fines: Italy, France, Greece and the Netherlands totalling about €90.5m, plus a €5.2m penalty for non-payment",
      "ICE awards recorded FY25 $9m and FY26 $3.75m",
      "US settlement paid as roughly 23% of company equity, not cash",
    ],
  },
  {
    id: "local-law-does-not-mean-local",
    origin: "ai",
    basis: "structural",
    title: "A law saying “keep it local” doesn’t keep it local",
    body:
      "Twenty countries in this record have rules requiring government data to stay within their borders. In ten of the countries where we can see actual deployments, most government workloads still run on American companies anyway. The only places where that genuinely changes are the ones that shut those companies out altogether — and even there, the few remaining records are exits rather than operations.",
    evidence: [
      "44 of 99 regulations carry a localisation requirement, across 20 geographies",
      "US-headquartered vendors still hold the majority in 10 of them — Australia 25 of 26, Israel 15 of 15, Netherlands 7 of 7, Denmark 4 of 4",
      "Displacement only under explicit exclusion: China 3 of 28, Russia 3 of 23 — and all three Russian records are decommissioned",
      "34 of 107 vendors are US-based, but they hold 273 of 399 deployments",
    ],
  },
  {
    id: "headline-spending-is-not-spending",
    origin: "ai",
    basis: "structural",
    title: "The headline spending figure is not what governments spent",
    body:
      "Add up every value in this dataset and you get about $102.8 billion. Roughly a third of that is not government money at all — it is companies announcing their own investments: a data-centre expansion in Saudi Arabia, a stake bought in another firm. And one $9 billion US defence contract is counted four separate times, once for each supplier on it. We are pointing this out about our own dataset because anyone quoting the total as government spending would be wrong.",
    evidence: [
      "About $34.3bn of the $102.8bn total is vendor capital expenditure or regional pledges",
      "Includes Oracle’s $14bn Saudi expansion and Microsoft’s $1.5bn equity stake in G42 — the buyer field reads “Microsoft (equity into G42)”",
      "The JWCC $9bn ceiling appears four times, once per awarded vendor",
      "47 of 90 awards record no value at all, including the UK intelligence-community contract",
    ],
  },
  {
    id: "sequence-cannot-be-proven",
    origin: "ai",
    basis: "structural",
    title: "We cannot prove which came first, the law or the system",
    body:
      "The timeline shows laws and deployments together, and it is tempting to read cause into the order they appear. The data does not support that reading. The fields built to link one event to another were never filled in, and the deployment records carry no date at all. Thirty-two events are tagged with labels like “law follows capability”, but those tags point at nothing. Treat the timeline as two stories shown side by side, not as one causing the other.",
    evidence: [
      "milestones.linked_milestone_id: empty in all 311 rows",
      "milestones.lag_days: empty in all 311 rows",
      "32 of 311 milestones carry a relationship label with no target",
      "The deployments table has no date field of any kind",
    ],
  },
  {
    id: "has-an-attack-happened",
    origin: "author",
    basis: "pattern",
    title: "Has an attack happened?",
    body:
      "The author reports experiences interpreted as possible unconsented-to auditory or neurological communication, along with perceived coercive messages, including messages related to self-harm. The author does not know the mechanism and raises possible explanations only as hypotheses. This is a dated record of reported experience, not evidence that any particular technology, transmission infrastructure, person, organization, or coordinated campaign is responsible. No conclusion should be drawn without independent technical testing, corroboration, and reliable records.",
    questions: [
      "What independently verifiable evidence would distinguish an external event from other possible explanations?",
      "Are there original recordings, contemporaneous notes, technical measurements, or witnesses that can be evaluated independently?",
      "Is there reliable evidence identifying a specific technology, person, or organization?",
      "Does any verified data collection or processing meet the legal definition of neural data under Colorado law?",
      "What official inquiry, technical assessment, or corroborating record would be needed before drawing a conclusion?",
    ],
    references: [
      { label: "Journal entry — 27 Feb 2025", href: "/journal/is-j01-20250227-entry" },
      { label: "The Guardian — military AI surveillance (context only)", href: "https://www.theguardian.com/world/2025/mar/06/israel-military-ai-surveillance" },
      { label: "Colorado HB24-1058 — neural data", href: "https://leg.colorado.gov/bills/hb24-1058" },
    ],
    referencesNote:
      "The journal is an unverified first-person report. The Guardian article is context about surveillance elsewhere and is not evidence of a connection. Colorado law is relevant only if qualifying data collection or processing is established.",
    verification: "unverified",
    disclaimer:
      "This concept records reported experience and open questions. It does not establish an attack, technology, responsible party, organization, or coordinated campaign.",
  },
];

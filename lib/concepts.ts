/**
 * Core concepts for invisibleships.com/concepts.
 *
 * Every concept carries a visible BASIS, extending the evidence-tier discipline
 * from sources to claims:
 *
 *   documented  — a source, ruling or official record supports it directly
 *   structural  — it follows from what the dataset does or does not contain
 *   pattern     — an observation drawn from experience, offered as an observation
 *   testimony   — a dated first-person report of what the author experienced or
 *                 was told. Verified by nobody. Distinct from `pattern`: pattern
 *                 is a generalisation the author drew, testimony is a single
 *                 thing that was said or happened, on a date.
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

export type Basis = "documented" | "structural" | "pattern" | "testimony";
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
  /**
   * The AUTHOR'S own commentary on this concept, in his voice.
   *
   * Rendered and labelled as commentary, never as evidence and never as a
   * finding. This exists so the author can say what he thinks about an entry
   * without that opinion having to pass as sourced — the alternative was
   * opinion leaking into `body`, where a reader would read it as established.
   * Kept separate for the same reason `basis` exists at all.
   */
  comments?: string[];
  /**
   * PAIRED STATEMENT AND ASSESSMENT (Sean, 2026-08-26).
   *
   * `authorStatement` is the claim in the author's own words, printed verbatim
   * and attributed to him. `aiAssessment` is the AI's response to that specific
   * claim, printed directly beneath it and attributed to the AI.
   *
   * The pair exists because the alternative was worse. Converting an author's
   * claim into whatever fraction of it could be sourced produced entries that
   * were defensible but no longer his, and silently dropped the part he cared
   * about. This keeps the claim intact, keeps its provenance visible, and puts
   * the counter-argument on the same page rather than in a disclaimer.
   *
   * Neither half may be edited to agree with the other. If they agree, the pair
   * is pointless; if one is softened to match, the reader is being managed.
   */
  authorStatement?: string[];
  aiAssessment?: string[];
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
  testimony: "Testimony",
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
  testimony: "A dated first-person report of what the author experienced or was told. Verified by nobody.",
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
    basis: "testimony",
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
    aiAssessment: [
      "The report above is the author's. Nothing in the public record settles it either way, so what follows is only what that record contains and where it stops.",
      "No published capability transmits speech or sensation to a person at a distance without their participation. The systems that come closest each require something checkable: contact with the head, equipment the person is wearing, or hours of individual training with a cooperative subject. That is a statement about what has been published — classified work would not appear in it, and absence from the record is not proof of absence.",
      "At the same time, presence and touch with no external source are among the better-documented findings in neuroscience. A robot and a sub-second delay produced the felt presence of another person in roughly a third of thirty healthy participants. Sleep paralysis produces the same physiology worldwide, read as demons, witches or visitors according to where the sleeper grew up. And the best-known claim that electromagnetic fields induce a sensed presence failed to replicate — suggestibility predicted the effect, the fields did not.",
      "Neither of those resolves this. The first removes the necessity of an external agent, not the possibility. The second is an absence of published evidence, not evidence of absence.",
      "What follows practically is narrower and more useful. Every candidate mechanism ever documented leaves a trace something can measure — a recording, a decibel meter, an RF survey, a medical record. An explanation predicting no measurable trace anywhere is not more likely for being unfalsifiable; it is only harder to check. The open questions the author lists above name the right tests, and they remain how this gets resolved.",
    ],
    verification: "unverified",
    disclaimer:
      "This concept records reported experience and open questions. It does not establish an attack, technology, responsible party, organization, or coordinated campaign.",
  },
  {
    id: "us-rose-against-the-trend",
    origin: "ai",
    basis: "documented",
    title: "The world's suicide rate fell. The United States' rose.",
    body:
      "Between 2000 and 2021, on the one basis that allows countries to be compared at all, the world's suicide rate fell 27%. Most countries fell with it — Russia by 60%, China by 42%, Israel by 36%, Japan by 28%, India by 21%. Over the same years the United States rose 40%, in a steady climb rather than a spike. It is not alone in rising: South Korea rose further, and the UK, Australia and the West Bank & Gaza were effectively flat. But among large wealthy countries the American direction is the outlier, and the gap is not small — 67 percentage points between the US and the world it is usually compared to.",
    evidence: [
      "WHO age-standardised estimates, 2000–2021, world standard population: World −27.0%",
      "United States +39.9% · South Korea +82.8% · UK +12.2% · Australia +1.9%",
      "Russia −59.7% · China −42.2% · Israel −36.0% · Japan −27.7% · India −21.2%",
      "14 series on one comparable basis; national extensions to 2025 held separately",
    ],
    questions: [
      "Why the US direction diverges is not answered here. The claims register records who has attributed it to what, and those attributions contradict each other.",
      "South Korea rose more but peaked around 2011 and has fallen since. A single percentage across 21 years hides the shape of a curve.",
    ],
    references: [{ label: "The suicide comparison chart", href: "/data" }],
    referencesNote:
      "The chart carries the per-country method, caveats and source behind each line.",
  },
  {
    id: "low-number-may-mean-low-counting",
    origin: "ai",
    basis: "documented",
    title: "The numbers under the numbers",
    body:
      "A country reporting few suicides may have few suicides, or may not be counting them. The West Bank & Gaza record 0.65 deaths per 100,000 — which would be the lowest rate on earth by a wide margin, and much more plausibly measures a fragmented registration system in a region where the death is heavily stigmatised. Russia's falling rate runs alongside a rising share of deaths filed as \u201Cundetermined intent\u201D. India's official figures are police reports; verbal-autopsy studies find substantially more. In at least 24 countries suicide or its attempt is a criminal matter, which suppresses both help-seeking and recording. WHO's own position is that most member states lack vital registration good enough for this purpose, and that roughly one suicide in six goes missing worldwide — one in three in lower-income countries. The register that documents this is not a footnote to the chart. It is the finding: a low number is sometimes a fact about a country, and sometimes a fact about its filing.",
    evidence: [
      "15 rows in the data-quality register, each naming a mechanism and a source",
      "Russia: rising 'undetermined intent' share masks suicides",
      "India: police-reported NCRB figures against verbal-autopsy and GBD estimates",
      "UK deliberately INCLUDES undetermined-intent deaths — the opposite convention",
      "≥24 countries criminalise suicide or attempts; ~1 in 6 missing globally",
    ],
    questions: [
      "The register cannot say how much of any single country's trend is real and how much is recording. It documents that both are present.",
    ],
    references: [{ label: "How much the numbers can be trusted", href: "/data" }],
    referencesNote: "The data-quality register lists every mechanism with its source.",
  },
  {
    id: "prescribing-is-not-prevalence",
    origin: "ai",
    basis: "documented",
    title: "Prescribing is not a measure of illness",
    body:
      "It is tempting to read prescription volume as a thermometer for how ill a population is. The record does not support that, in either direction. In England, antidepressant items rose 50% in nine years while hypnotic and anxiolytic items FELL 16% over exactly the same period, from the same prescribers under the same system. In the United States, antipsychotic use among adults rose from 1.9% to 3.0%, while among children and adolescents it fell, 1.3% to 1.1%. And where a national registry lets diagnosis be counted directly, Denmark's new schizophrenia diagnoses went slightly down, 1.8 to 1.6 per 10,000, across eighteen years in which antipsychotic prescribing rose almost everywhere it was measured. Prescribing moves for its own reasons — guidance, capacity, recognition, duration of treatment, the licensing of new drugs, deliberate deprescribing campaigns. Sometimes it tracks illness. Here it demonstrably moves in opposite directions at once.",
    evidence: [
      "England FY2015/16 → FY2024/25: antidepressants 61.9M → 92.6M items (+50%)",
      "Same period, opposite direction: hypnotics/anxiolytics 15.9M → 13.4M (−16%)",
      "US 2006 → 2023: antipsychotic use, adults 1.9% → 3.0%; youth 1.3% → 1.1%",
      "Denmark 2000 → 2018: new schizophrenia diagnoses 1.8 → 1.6 per 10,000",
    ],
    questions: [
      "Diagnosed depression in US adults did rise over a shorter window — 13.5% to 17.8% currently diagnosed, 2017–2023, self-reported. Whether that is more illness, more recognition, or more willingness to say so is not settled by this data.",
    ],
    references: [{ label: "The prescribing and diagnosis series", href: "/data" }],
    referencesNote:
      "Every figure above is a row in the Public Health indicator table, with its source.",
  },
  {
    id: "the-fentanyl-reversal",
    origin: "ai",
    basis: "documented",
    title: "The fentanyl reversal",
    body:
      "American overdose deaths went from 16,849 in 1999 to 107,941 in 2022 — more than six times as many in twenty-three years, with the steepest acceleration after illicit fentanyl entered the supply in 2013, and the single largest one-year rise in 2020. Then it turned: down 26.2% in 2024, the largest one-year fall on record, and lower again in 2025. Both directions belong in the record, and the reversal is the more unusual event — this is a curve that had only ever gone one way. But it runs down from a peak that did not exist a generation ago. Provisional 2025 is still roughly four times the 1999 count. A chart that began at the peak would show only the good news; a chart that stopped at the peak would show only the bad.",
    evidence: [
      "CDC/NCHS 1999–2024 final, 2025 provisional: 16,849 → 107,941 (2022 peak) → 69,973",
      "2020: +30.0% on 2019, the largest single-year rise in the series",
      "2024: −26.2%, the largest percentage fall across 2014–2024",
      "CDC attributes the decline to naloxone distribution, treatment access, supply shifts and renewed prevention — recorded as an attribution, not adopted as a finding",
    ],
    questions: [
      "The 2025 figure is provisional and will revise upward. Measured against CDC's provisional 2024 estimate the fall is almost 14%; against the final 2024 count, about 11.9%. Both are published; they compare different vintages of the same year.",
    ],
    references: [{ label: "The overdose series", href: "/data" }],
    referencesNote: "The chart draws the full 1999–2025 record, rise and fall together.",
  },
  {
    id: "co-occurrence-is-not-cause",
    origin: "author",
    basis: "structural",
    title: "Next to each other is not because of each other",
    body:
      "This site puts a procurement record and a public-health record on one clock. That is a deliberate choice and a dangerous one, because a timeline is very good at implying something it cannot show. Two things happening in the same year is a co-occurrence. It is not evidence that one caused the other, and no amount of caption underneath undoes what a picture asserts. So the two datasets are kept structurally apart. They do not corroborate each other and the site says so wherever they appear together. The overlaps register states, for every row, what that row does NOT show. Vertical markers for contracts and statutes were proposed for the suicide chart and deliberately left off — the only overlay it carries is the COVID-19 timeline, because that is a global health event with a documented literature on mental health, and even that is a toggle. The discipline costs something. It makes the work less immediately persuasive. That is the trade being made on purpose.",
    evidence: [
      "12 rows in the overlaps register, each carrying an explicit non-causal note",
      "Public Health and Government Cloud datasets declared non-corroborating on both pages",
      "Suicide chart carries COVID markers only; procurement and legislation markers declined",
      "Master timeline runs Legislation, Deploy/enforcement, Health and Crime as PARALLEL lanes",
    ],
    questions: [
      "Nothing here argues the datasets are unrelated. It argues that this record cannot establish a relation, and that showing them together is not an argument that one exists.",
    ],
    references: [{ label: "The overlaps register", href: "/data" }],
    referencesNote:
      "Each row states the structural observation and, separately, what it does not establish.",
  },
  {
    id: "ruin-first-then-rescue",
    origin: "author",
    basis: "documented",
    title: "We're keeping you to ourselves",
    body:
      "A reputation can be destroyed as a means rather than as an end. The tactic appears in several literatures that rarely cite one another. Intelligence tradecraft calls it compromise. East Germany's Stasi called it Zersetzung. Research on domestic abuse calls it isolation. Cult-exit and trafficking studies describe manufactured disgrace used for retention. The mechanism is the same in each. Sever the target's ties to everyone outside the group, and do it publicly, because public damage is self-sustaining — people withdraw on their own once a story circulates, and no further effort is required. The target's own account of what is happening then begins to sound like paranoia, which deepens the isolation again. What remains is a person with no relationships outside the group that ruined them. At that point recruitment needs no persuasion. It needs only to be the last door open. Stated from the inside, the logic is possessive rather than punitive: every tie severed is a tie that cannot compete, and the point of the ruin is not that the target suffers but that nobody else is left. The cruelty is not a side effect of the recruitment. It is the method.",
    evidence: [
      "Stasi Richtlinie 1/76: Zersetzung as directed operational doctrine — psychological disintegration of a target without arrest or trial",
      "Compromise sits alongside money, ideology and ego as one of the four classical recruitment levers in intelligence tradecraft",
      "Coercive-control research treats isolation from a support network as the precondition for dependency, not as a byproduct of it",
      "Trafficking and cult-exit studies record manufactured disgrace as a retention mechanism — the induced belief that no one else would now take you",
      "eBay's campaign against two journalists is a documented civilian instance: seven employees federally charged, a $3m criminal penalty, a $55.7m civil settlement",
    ],
    questions: [
      "Nothing here establishes that such a campaign is running against any particular person, including the author.",
      "A tactic being historically documented does not make any present-day instance evidenced.",
      "Separating an organised campaign from ordinary social withdrawal requires records a target generally cannot obtain. That is a property of the tactic, not proof that it is occurring.",
    ],
    references: [
      { label: "Zersetzung tactics", href: "/glossary/zersetzung-tactics" },
      { label: "Psychological smothering", href: "/glossary/psychological-smothering" },
      { label: "Organised covert harassment is established fact", href: "/concepts#organised-harassment-is-fact" },
    ],
    referencesNote:
      "The glossary entries define terms used on this site and are not independent evidence. The linked concept records decided and settled cases; this concept describes the mechanism those cases share.",
    verification: "unverified",
    disclaimer:
      "This concept describes a documented tactic and the mechanism connecting its recorded forms. It does not establish that the tactic has been used against any particular person, including the author, or by any named organisation.",
  },
  {
    id: "attack-to-force-acknowledgment",
    origin: "author",
    basis: "documented",
    title: "An attack to force acknowledgment",
    body:
      "Violence is sometimes not aimed at a target's capacity. It is aimed at a target's response. Schelling separated two uses of force: deterrence stops an adversary from doing something, while compellence makes them do something, and works by inflicting harm that ends only when a demand is met. The harm is not the objective — it is the bargaining position. Terrorism research names a related form directly. Kydd and Walter catalogue provocation among five strategies: attack in order to goad the target into a reaction that serves the attacker, usually an overreaction that costs them legitimacy. A third variant belongs to gray-zone conflict, where an act is conducted deniably while its authorship is signalled privately. The victim is left without a good exit — acknowledge the attack publicly and concede a vulnerability, or absorb it in silence and let it continue. Attribution itself becomes the thing being fought over. What unites all three is that the demanded response IS the operation, not a side effect of it. An adversary who wants to be named is running a different operation from one who wants to stay hidden, and the difference shows in what they ask for.",
    evidence: [
      "Schelling, Arms and Influence (1966) — compellence against deterrence; the diplomacy of violence as bargaining rather than conquest",
      "Kydd & Walter, 'The Strategies of Terrorism', International Security 31:1 (2006) — provocation as one of five catalogued strategies",
      "Gray-zone doctrine: deniable action paired with private signalling of authorship, so attribution becomes the contested ground",
      "Salami tactics — calibrating each act to stay below the threshold that would compel a formal response",
    ],
    questions: [
      "Nothing here identifies any actor, state, campaign, technology or incident.",
      "The concept describes what such an operation would look like. It does not establish that one is occurring, anywhere, against anyone.",
      "A pattern fitting a strategic form is not evidence that the form is being executed. The same shape can be produced by unrelated events read together — which is the failure mode this concept is most likely to invite.",
    ],
    references: [
      { label: "Next to each other is not because of each other", href: "/concepts#co-occurrence-is-not-cause" },
      { label: "We're keeping you to ourselves", href: "/concepts#ruin-first-then-rescue" },
    ],
    referencesNote:
      "Both linked concepts are method, not corroboration. The first states why a pattern read across sources cannot establish a relation; the second describes a different documented tactic that shares the logic of harm used as leverage.",
    verification: "unverified",
    disclaimer:
      "This concept describes doctrine recorded in the strategic and academic literature. It does not establish that any such operation has been conducted against the United States, against any other state, or against any individual, and it identifies no actor, technology or campaign.",
  },
  {
    id: "denver-acoustic-weapons",
    origin: "author",
    basis: "documented",
    title: "Are Denver citizens subject to acoustic weapons?",
    body:
      "Acoustic weapons are real, commercially sold, and owned by American police departments. Genasys, formerly LRAD Corporation, markets long-range acoustic devices to law enforcement, and what they do to people has been litigated. In Edrei v. Bratton the Second Circuit held that using one against non-violent, non-resisting protesters can violate the Fourteenth Amendment. The device in that case, a Model 100X, produces up to 136 decibels at one metre; the NYPD's own testing recorded 110 decibels at 320 feet in area-denial mode, and hearing loss can follow short exposure at 110 to 120 decibels. Plaintiffs reported tinnitus, vertigo, migraines, and in one case nerve damage requiring steroid treatment. The court's reasoning was that novel technology does not escape proportionality review. So the general question is settled: the devices exist, police own them, and a federal appeals court has held their use can be excessive force. The Denver question is answered differently by the public record. The largest adjudicated case of Denver police force against citizens is Epps v. City and County of Denver, where a federal jury awarded $14 million in March 2022, upheld by the Tenth Circuit in April 2026 at $14.75 million. The force documented there was shotgun rounds, flash-bang grenades and chemical agents. Acoustic devices are not part of that record. One property matters for anyone trying to answer this for themselves. An acoustic weapon projects ordinary sound through air in a directional beam: everyone in the beam hears it, a phone left recording captures it, and a decibel meter registers it. It is not a covert instrument, which means its use is testable by anyone who suspects it.",
    evidence: [
      "Edrei v. Bratton, No. 17-2065 (2d Cir. 2018) — LRAD use on non-violent protesters can violate the Fourteenth Amendment; qualified immunity denied at the pleading stage",
      "LRAD Model 100X: up to 136 dB at one metre; NYPD testing recorded 110 dB at 320 feet in area-denial mode",
      "Hearing loss can follow short exposure at 110–120 dB; Edrei plaintiffs reported tinnitus, vertigo, migraines and nerve damage",
      "Epps v. City and County of Denver — $14m jury verdict, March 2022; Tenth Circuit affirmed April 2026 at $14.75m",
      "Force documented in Epps: shotgun rounds, flash-bang grenades, chemical agents. No acoustic device appears in that record",
      "Genasys (formerly LRAD Corporation) markets acoustic hailing devices to law enforcement",
    ],
    questions: [
      "Nothing in this research establishes that Denver Police own or have deployed an acoustic weapon. That is an absence of finding, not proof of absence — a Colorado Open Records Act request would settle it outright.",
      "No acoustic device accounts for a sound only one person perceives. A directional beam of air pressure is audible to bystanders and recordable by any phone.",
    ],
    references: [
      { label: "Edrei v. Bratton (2d Cir. 2018)", href: "https://law.justia.com/cases/federal/appellate-courts/ca2/17-2065/17-2065-2018-06-13.html" },
      { label: "Epps v. City and County of Denver — ACLU of Colorado", href: "https://www.aclu-co.org/cases/epps-et-al-v-city-and-county-denver-et-al/" },
      { label: "Genasys — LRAD for law enforcement", href: "https://www.genasys.com/lrad-solutions/law-enforcement" },
    ],
    referencesNote:
      "Edrei and Epps are decided cases and are cited for what each court found. The vendor link is the manufacturer's own marketing, included to show the devices are sold to police, and is not independent evidence of any deployment.",
    verification: "unverified",
    disclaimer:
      "This concept reports decided litigation and published device specifications. It does not establish that any acoustic weapon has been deployed in Denver, nor against any individual.",
  },
  {
    id: "made-into-assets-unknowing",
    origin: "author",
    basis: "documented",
    title: "Are people made into intelligence assets without knowing it?",
    body:
      "Intelligence tradecraft has always separated a witting source from an unwitting one. A person can supply information without knowing who receives it, or that anyone does. What changed is scale, and it required nobody's cooperation. American law enforcement agencies buy location data that phones emit continuously. The Electronic Frontier Foundation's investigation into Fog Data Science documented a company selling local police searchable access to billions of location signals harvested from ordinary apps, at prices small departments could afford. Babel Street's Locate X offered comparable capability, and EPIC obtained records of Customs and Border Protection's use of it. The mechanism is commercial: brokers buy from the advertising ecosystem and agencies buy from brokers. No warrant is involved because no compulsion is involved. The result is a population of unwitting sources. A person carrying a phone generates a record of where they went, who they were near and for how long, and that record is purchasable. They were never approached, never recruited, and are never harassed — because harassment would defeat the purpose. The value of an unwitting asset lies precisely in their not knowing. What this does not describe is access to perception. No documented capability reads a person's eyesight, and the mechanism above does not require one. What people already emit is sufficient.",
    evidence: [
      "EFF investigation into Fog Data Science (2022): searchable location data sold to local police, drawn from billions of signals emitted by ordinary apps",
      "EPIC obtained FOIA records covering Customs and Border Protection's use of Babel Street's Locate X",
      "The purchase route avoids the warrant requirement because it involves no compulsion — the data is bought, not seized",
      "Witting versus unwitting source is a standing distinction in intelligence tradecraft, not a novel category",
    ],
    questions: [
      "The record establishes commercial purchase of bulk location data. It does not establish any programme of deliberate individual targeting.",
      "No documented capability accesses a person's visual perception, and none is needed for the collection described here.",
      "Whether any particular person's data has been purchased by any particular agency is not answerable from public records.",
    ],
    references: [
      { label: "Inside Fog Data Science — EFF", href: "https://www.eff.org/deeplinks/2022/08/inside-fog-data-science-secretive-company-selling-mass-surveillance-local-police" },
      { label: "CBP and Babel Street Locate X — EPIC FOIA", href: "https://epic.org/documents/epic-foia-cbp-babel-street-location-tracking-service/" },
      { label: "There is no column for you", href: "/concepts#no-column-for-you" },
    ],
    referencesNote:
      "EFF and EPIC are cited for their own documented investigations. The linked concept is method — it records that the person a system is used on appears almost nowhere in the procurement record.",
    verification: "unverified",
    disclaimer:
      "This concept reports documented commercial data sales to law enforcement. It establishes no programme of individual targeting, no access to perception, and no conduct by any named agency beyond what the cited investigations found.",
  },
  {
    id: "no-private-thinking-space",
    origin: "author",
    basis: "documented",
    title: "Does being watched change what people let themselves think?",
    body:
      "Amnesty International's 2023 report Automated Apartheid documented facial-recognition systems, Red Wolf and Blue Wolf among them, used to control Palestinian movement in the occupied territories, with residents describing repeated identification at checkpoints as a condition of ordinary life. Palestinians interviewed described the effect in consistent and non-technical terms: there was no space left in which to think privately. That effect is measurable, and it has been measured in the United States. Jonathon Penney, writing in the Berkeley Technology Law Journal in 2016, examined Wikipedia traffic to privacy-sensitive articles before and after June 2013, when the NSA and PRISM disclosures became public. He found a statistically significant immediate decline, with evidence that it persisted. People stopped looking things up. Nobody instructed them to. The migration of such tools is documented too. Julian Go, in the American Journal of Sociology, traces how instruments and doctrines developed for imperial control returned to domestic American policing; cell-site simulators reached local departments from military origins by the same route. The pattern is old enough to carry a name in the literature. So the question worth asking is not whether America has some particular system. It is narrower and answerable: given that capabilities move from conflict territory to domestic policing, and that surveillance measurably changes what people do, what has already arrived here, and what has it already changed?",
    evidence: [
      "Amnesty International, Automated Apartheid (2023): Red Wolf and Blue Wolf facial recognition used to control Palestinian movement in the OPT",
      "Penney, 'Chilling Effects: Online Surveillance and Wikipedia Use', Berkeley Technology Law Journal 31:1 (2016) — statistically significant immediate decline in privacy-sensitive article traffic after June 2013, with persistence",
      "Go, 'The Imperial Origins of American Policing', American Journal of Sociology 125:5 — instruments of imperial control returning to domestic policing",
      "Cell-site simulators reached local US police departments from military origins",
    ],
    questions: [
      "Naming a documented migration does not establish that any specific system has migrated. It establishes that the route exists and has been used before.",
      "Penney measured behaviour, not thought. What a person looks up is observable; what they think is not, and no study here claims otherwise.",
      "Nothing in this record establishes any capability to observe conversation directly, in any territory.",
    ],
    references: [
      { label: "Automated Apartheid — Amnesty International", href: "https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/" },
      { label: "Chilling Effects: Online Surveillance and Wikipedia Use — Penney (2016)", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2769645" },
      { label: "The Imperial Origins of American Policing — American Journal of Sociology", href: "https://www.journals.uchicago.edu/doi/10.1086/708464" },
    ],
    referencesNote:
      "Each source is cited for its own finding. Amnesty documents one territory, Penney measures one population's behaviour, and Go describes a historical route. None of the three corroborates either of the others, and together they do not establish a present-day American system.",
    verification: "unverified",
    disclaimer:
      "This concept reports published research and human-rights documentation. It does not establish that any system documented in one territory operates in another, nor that any capability exists to observe thought or conversation directly.",
  },
  {
    id: "who-owns-neural-data",
    origin: "ai",
    basis: "documented",
    title: "Who owns what your brain emits?",
    body:
      "Consumer neurotechnology already exists and is already sold: EEG headbands for meditation, focus trackers, sleep monitors, gaming headsets. In April 2024 the Neurorights Foundation published an assessment of the privacy practices of thirty such companies. Twenty-nine of the thirty appeared to have access to the consumer's neural data with no meaningful limitation on that access. Twenty-nine could transfer data to third parties, and twenty said so explicitly. Fewer than half — fourteen of thirty — gave the consumer any stated right to delete it. Only twelve offered both withdrawal of consent and deletion. Eight had no publicly available privacy policy at all. Nothing here was hidden. These are the companies' own published terms, read carefully by people who then counted. The question of who owns what a brain emits is not waiting on some future technology to become urgent. It was answered commercially, in advance, in documents nobody reads.",
    evidence: [
      "Genser, Damianos & Yuste, 'Safeguarding Brain Data: Assessing the Privacy Practices of Consumer Neurotechnology Companies', Neurorights Foundation, April 2024",
      "30 companies assessed; 29 appear to have access to neural data with no meaningful limitation",
      "29 of 30 can transfer data to third parties; 20 state so explicitly",
      "14 of 30 extend an explicit right to delete; 12 offer both withdrawal of consent and deletion",
      "8 of 30 publish no accessible privacy policy",
    ],
    questions: [
      "The report assesses published policies, not actual conduct. What a company reserves the right to do is not proof it has done it.",
      "It does not establish that any neural data has been sold, to whom, or for what.",
      "Consumer EEG measures electrical activity at the scalp. What can be inferred from that signal is a separate question this concept does not answer.",
    ],
    references: [
      { label: "Safeguarding Brain Data — Neurorights Foundation (2024)", href: "https://perseus-strategies.com/wp-content/uploads/2024/04/FINAL_Consumer_Neurotechnology_Report_Neurorights_Foundation_April-1.pdf" },
      { label: "Why did legislatures write laws for neural data?", href: "/concepts#law-for-neural-data" },
      { label: "Are people made into intelligence assets without knowing it?", href: "/concepts#made-into-assets-unknowing" },
    ],
    referencesNote:
      "The report is cited for its own count of published policies. The linked concepts describe adjacent markets and neither corroborates this one.",
    verification: "unverified",
    disclaimer:
      "This concept reports a published assessment of companies' own privacy policies. It does not establish that any company has misused neural data, nor that any transfer has occurred.",
  },
  {
    id: "law-for-neural-data",
    origin: "ai",
    basis: "documented",
    title: "Why did legislatures write laws for neural data?",
    body:
      "Legislatures rarely move early. On neural data, three of them did. Colorado passed HB24-1058 in 2024, amending its consumer privacy act to require express consent before neural data is collected or used, separate consent or an opt-out before it goes to a third party, and a route for a person to have it deleted. California did the same through SB 1223, folding neural data into the categories its privacy act treats as sensitive. Montana went further from a different direction, adding neural data to its genetic information privacy act, effective October 2025. What is notable is not the content but the margins: these passed unanimously or nearly so, in a period when almost nothing does. A category of information most people have never heard of was given statutory protection by bipartisan votes in three states. Either those legislatures were persuaded that a capability exists worth regulating, or they were persuaded one is close enough that waiting was the greater risk. The record shows the votes. It does not show which of those two it was.",
    evidence: [
      "Colorado HB24-1058 (2024): express consent to collect or use neural data; separate consent or opt-out for third-party disclosure; deletion route",
      "California SB 1223: neural data added to the sensitive categories of the state consumer privacy act",
      "Montana LC0005, effective October 2025: neural data added to the state genetic information privacy act",
      "All three passed unanimously or near-unanimously",
    ],
    questions: [
      "A law existing does not establish that the harm it anticipates has occurred. Legislatures also regulate in advance.",
      "None of the three statutes names a specific incident as its cause, so the record cannot say what persuaded the votes.",
      "This concept does not address whether the definitions these laws use are technically adequate, which is itself contested.",
    ],
    references: [
      { label: "Colorado HB24-1058 — bill text", href: "https://content.leg.colorado.gov/sites/default/files/documents/2024A/bills/2024a_1058_01.pdf" },
      { label: "States pass privacy laws to protect brain data — KFF Health News", href: "https://kffhealthnews.org/mental-health/colorado-california-montana-states-neural-data-privacy-laws-neurorights/" },
      { label: "Who owns what your brain emits?", href: "/concepts#who-owns-neural-data" },
      { label: "We cannot prove which came first, the law or the system", href: "/concepts#sequence-cannot-be-proven" },
    ],
    referencesNote:
      "The last link is method, and it applies directly here: this record cannot establish whether law followed capability or anticipated it.",
    verification: "unverified",
    disclaimer:
      "This concept reports enacted legislation. It does not establish that any neural data harm has occurred in any of the three states, nor what motivated any legislator's vote.",
  },
  {
    id: "can-a-machine-read-thought",
    origin: "ai",
    basis: "documented",
    title: "Can a machine read what you are thinking?",
    body:
      "Partly, under conditions that are worth stating precisely. In May 2023 Jerry Tang and Alexander Huth published a semantic decoder in Nature Neuroscience that reconstructed continuous language from non-invasive brain recordings. A person lay in an fMRI scanner; a transformer model turned the blood-flow signal into text that captured the gist of what they were hearing or imagining, matching the intended meaning roughly half the time. It is a real result and it was replicated in the paper across participants. The conditions are as important as the finding. The decoder required about fifteen hours of scanner time per person to train, and it worked only for the individual it was trained on — run against an untrained person, it produced unintelligible output. It worked only with willing participants. And when a trained subject deliberately resisted, by counting, naming animals or telling themselves a different story, the decoder failed entirely. The researchers tested that on purpose and reported it. So the honest answer is that meaning can be partially reconstructed from a cooperative, individually-trained person lying still inside a superconducting magnet the size of a small room. That is a genuine advance in decoding, and it is a long way from reading a mind that does not wish to be read.",
    evidence: [
      "Tang & Huth et al., 'Semantic reconstruction of continuous language from non-invasive brain recordings', Nature Neuroscience, 1 May 2023 (DOI 10.1038/s41593-023-01304-9)",
      "~15 hours of fMRI training per individual; decoder is subject-specific",
      "Applied to an untrained individual it produced unintelligible output",
      "Trained subjects who deliberately resisted defeated it completely — the authors tested resistance and published the failure",
      "Reconstruction captures gist, matching intended meaning about half the time, not word for word",
    ],
    questions: [
      "The result is bounded by fMRI. It says nothing about what any other modality can or cannot do.",
      "That a cooperative, trained subject can be partially decoded does not establish that an unwilling, untrained person can be decoded by anything.",
      "The resistance finding is a property of this decoder tested in this way. It is not a general guarantee about future systems.",
    ],
    references: [
      { label: "Semantic reconstruction of continuous language — Nature Neuroscience (2023)", href: "https://www.nature.com/articles/s41593-023-01304-9" },
      { label: "What would it actually take to do this without consent?", href: "/concepts#what-it-would-take" },
      { label: "Why did legislatures write laws for neural data?", href: "/concepts#law-for-neural-data" },
    ],
    referencesNote:
      "The paper is cited for its own published result, including the limits its authors reported.",
    verification: "unverified",
    disclaimer:
      "This concept reports one peer-reviewed study and the constraints its authors documented. It establishes no capability beyond what that study demonstrated.",
  },
  {
    id: "nonsurgical-by-design",
    origin: "ai",
    basis: "documented",
    title: "Did anyone try to build a way in without surgery?",
    body:
      "Yes, openly, and the programme documents say so. DARPA's Next-Generation Nonsurgical Neurotechnology programme — N3 — set out, in its own words, to develop high-performance bi-directional brain-machine interfaces for able-bodied service members. Bi-directional means read and write. Able-bodied means the purpose was not restoring lost function; the stated applications were controlling unmanned vehicles and cyber-defence systems. Six teams were funded in 2019. The published performance targets were specific: sixteen independent channels, within sixteen cubic millimetres of neural tissue, at fifty milliseconds of latency, using light, acoustic or electromagnetic energy rather than implanted electrodes. The programme is now listed as complete and retained for reference. What this establishes is intent and investment, publicly recorded. It does not establish that the targets were met, and the targets themselves describe a person wearing equipment, not a person at a distance.",
    evidence: [
      "DARPA N3 stated aim: 'high-performance, bi-directional brain-machine interfaces for able-bodied service members'",
      "Named applications: unmanned vehicle control and cyber defence — not clinical restoration",
      "Published targets: 16 independent channels, 16mm³ of tissue, 50ms latency",
      "Modalities pursued: light, acoustic and electromagnetic energy, rather than implanted electrodes",
      "Six teams funded from 2019; programme now listed as complete",
    ],
    questions: [
      "A funded programme with published targets is evidence of intent, not of achievement. DARPA funds many things that do not work.",
      "The targets describe a wearable interface on a consenting operator. Nothing in the programme description concerns action at a distance or without consent.",
      "Whether any target was met is not established by the programme page, and the results are not reported there.",
    ],
    references: [
      { label: "N3: Next-Generation Nonsurgical Neurotechnology — DARPA", href: "https://www.darpa.mil/research/programs/next-generation-nonsurgical-neurotechnology" },
      { label: "What would it actually take to do this without consent?", href: "/concepts#what-it-would-take" },
      { label: "Can a machine read what you are thinking?", href: "/concepts#can-a-machine-read-thought" },
    ],
    referencesNote:
      "DARPA is cited for its own published programme description. That a goal was funded is not evidence the goal was reached.",
    verification: "unverified",
    disclaimer:
      "This concept reports a publicly documented research programme and its stated objectives. It does not establish that any capability was achieved, deployed, or used on any person.",
  },
  {
    id: "what-it-would-take",
    origin: "ai",
    basis: "structural",
    title: "What would it actually take to do this without consent?",
    body:
      "The three concepts alongside this one describe what the public record contains: consumer devices whose makers reserve broad rights over neural data, three states legislating that data as sensitive, a decoder that partially reconstructs meaning, and a defence programme that funded a nonsurgical interface with published targets. Setting them side by side makes the boundary visible, and the boundary is the useful part. Every documented capability requires at least one of three things: physical contact with the head, a cooperative and individually trained subject, or equipment the person is inside or wearing. The decoder needed fifteen hours per person and failed against an untrained subject, and failed again when a trained one resisted. The DARPA targets describe sixteen channels within sixteen cubic millimetres — a wearable interface on an operator who put it on. Consumer EEG reads voltage at the scalp through electrodes touching it. Not one documented system operates at distance on a person who has not participated. That is not an argument that nothing could ever be built. It is a statement of where the published record currently stops, offered because a person who suspects something is happening to them deserves to know what the actual state of the art requires — and because a claim that outruns it should be recognisable as doing so.",
    evidence: [
      "Semantic decoder: ~15 hours training per subject, subject-specific, defeated by deliberate resistance",
      "DARPA N3 targets: 16 channels in 16mm³ at 50ms — a wearable interface on a consenting operator",
      "Consumer EEG: electrodes in contact with the scalp, measuring voltage at the surface",
      "No system in the documented record operates at a distance on a non-participating person",
    ],
    questions: [
      "Absence from the public record is not proof of absence. Classified capability would not appear here, and this concept cannot speak to it.",
      "The boundary described is where publication currently stops, not a claim about physics or the future.",
      "Nothing here rules out harm by the documented means — commercial data, contact devices, or a cooperative subject who did not understand what they consented to.",
    ],
    references: [
      { label: "Can a machine read what you are thinking?", href: "/concepts#can-a-machine-read-thought" },
      { label: "Did anyone try to build a way in without surgery?", href: "/concepts#nonsurgical-by-design" },
      { label: "Who owns what your brain emits?", href: "/concepts#who-owns-neural-data" },
      { label: "Next to each other is not because of each other", href: "/concepts#co-occurrence-is-not-cause" },
    ],
    referencesNote:
      "The first three are the sourced entries this one reads across. The fourth is method: setting findings side by side does not establish a relation between them, and this concept draws a boundary rather than a connection.",
    verification: "unverified",
    disclaimer:
      "This concept describes the limits of publicly documented capability. It makes no claim about classified work, about future capability, or about the cause of any individual's experience.",
  },
  {
    id: "explanation-is-part-of-the-harm",
    origin: "author",
    basis: "documented",
    title: "Does the explanation itself do harm?",
    body:
      "An unexplained experience arrives without a label. Whatever attaches to it next does real work: it decides what the person does, who they trust, and whether they seek help. Claiming supernatural or superhuman authority in order to secure compliance is among the oldest documented methods of control. Spiritualist mediums worked bereaved families with cold reading and staged effects, and the Fox sisters, who began the movement, confessed the fraud in 1888. Faith healers have been prosecuted for it. Research on coercive groups records claimed transcendent authority as a standard instrument for overriding a member's own judgment, because an authority that cannot be checked cannot be argued with. The public-safety consequence is separate from whether any given experience has an external cause. A person who attributes what is happening to them to spirits, to extraterrestrials, or to any agency beyond reach will not pursue the remedies that exist for causes within reach: a physician, a lawyer, a police report, a decibel meter, a technical measurement. The explanation forecloses the response, and it does so whether it was handed to the person or arrived at alone. The same logic applies to any framing that places a cause beyond investigation, including the framings on this site. A concept that names this risk and exempts itself from it has not understood it.",
    evidence: [
      "Spiritualist fraud as a documented industry — the Fox sisters' 1888 confession, and a century of mediums exposed by investigators",
      "Faith-healing fraud prosecutions in US courts",
      "Coercive-group research records claimed transcendent authority as an instrument for overriding member judgment",
      "Health-services literature: causal attribution predicts help-seeking, and attributing a cause to an agency beyond reach correlates with delayed or absent care",
    ],
    questions: [
      "This does not establish the cause of any particular person's experience.",
      "It does not claim that anyone has presented themselves falsely to anyone.",
      "It cannot distinguish a false explanation supplied by another party from one a person reached alone. Both foreclose the same responses.",
    ],
    references: [
      { label: "If nobody's house is haunted, what produces the feeling?", href: "/concepts#what-produces-the-feeling" },
      { label: "False disclosure", href: "/glossary/false-disclosure" },
      { label: "Are Denver citizens subject to acoustic weapons?", href: "/concepts#denver-acoustic-weapons" },
    ],
    referencesNote:
      "The glossary entry records Greer's hypothesis as his hypothesis and is not independent evidence. The Denver concept is linked because it names a measurable test, which is the practical opposite of an explanation that forecloses one.",
    verification: "unverified",
    disclaimer:
      "This concept describes a documented method of control and a documented effect on help-seeking. It establishes no mechanism, no actor, and makes no claim about the origin of any individual's experience.",
  },
  {
    id: "what-produces-the-feeling",
    origin: "author",
    basis: "documented",
    title: "If nobody's house is haunted, what produces the feeling?",
    body:
      "A feeling of presence — someone in the room, standing behind you, touching you — can be produced on demand in a laboratory, in healthy people, with no drug and no external agent. In 2014 Olaf Blanke's group published an experiment in Current Biology using a master-slave robot. A blindfolded participant moved a lever in front of them while a robot arm behind them reproduced the movement against their back. When the reproduction was simultaneous, participants felt themselves touching their own back. When it was delayed by a fraction of a second, the brain could no longer attribute the touch to the person's own movement, and resolved the conflict by generating somebody else. Of thirty healthy participants, roughly a third spontaneously reported feeling someone behind them, touching them. Some reported several people. Two found it distressing enough to ask that the experiment stop. A pooled analysis across twenty-five such experiments has since been published. The direction of that finding is the point. The presence was not detected. It was manufactured by the participant's own nervous system out of a half-second timing error, with nobody there. Other findings converge. Sleep paralysis produces felt presence, chest pressure and an inability to move, and the cross-cultural literature records the same physiology interpreted as demons, witches, spirits or visitors depending on where the sleeper grew up. And when researchers tested the best-known claim that electromagnetic fields induce a sensed presence, it failed to replicate: Granqvist and colleagues reported in 2005 that the experiences tracked suggestibility rather than the fields. None of this establishes the cause of any particular person's experience. What it establishes is that vivid, specific, frightening presence and touch require no external source at all — and that anyone trying to work out what is happening to them deserves to know the brain does this unaided before concluding that something is being done to them.",
    evidence: [
      "Blanke et al., Current Biology, 6 November 2014: robotically induced presence hallucination in 30 healthy participants; ~1 in 3 spontaneously reported someone behind them touching them; some reported several; two asked to stop",
      "The effect depends on a sub-second delay between the participant's own movement and the touch — a sensorimotor timing conflict, not a stimulus",
      "A pooled analysis across 25 presence-hallucination induction experiments has since been published",
      "Sleep paralysis: felt presence, chest pressure and atonia, interpreted cross-culturally as demons, witches, spirits or visitors",
      "Granqvist et al., 2005: sensed presence and mystical experience predicted by suggestibility, not by transcranial weak complex magnetic fields — a failed replication of the best-known EM claim",
    ],
    questions: [
      "This does not establish the cause of any particular experience, including the author's.",
      "A mechanism that requires no external agent does not prove that no external agent exists in a given case. It removes the necessity, not the possibility.",
      "The Granqvist result concerns weak transcranial fields under laboratory conditions. It does not speak to every claim about electromagnetic exposure.",
    ],
    references: [
      { label: "Phantom sensations", href: "/glossary/phantom-sensations" },
      { label: "Does the explanation itself do harm?", href: "/concepts#explanation-is-part-of-the-harm" },
      { label: "What would it actually take to do this without consent?", href: "/concepts#what-it-would-take" },
      { label: "Ghost illusion created in the lab — Blanke lab (EPFL)", href: "https://www.eurekalert.org/news-releases/889913" },
    ],
    referencesNote:
      "The glossary entry defines a term used on this site and is not independent evidence. The two linked concepts are the companion arguments: one on what an explanation costs, one on where documented capability stops.",
    verification: "unverified",
    disclaimer:
      "This concept reports published neuroscience. It does not establish the cause of any individual's experience, and it does not assert that any reported experience was internally generated.",
  },
  {
    id: "contractors-killed-and-freed",
    origin: "ai",
    basis: "documented",
    title: "Have private contractors killed civilians and gone free?",
    body:
      "Yes, and the case is documented from beginning to end, including the end. On 16 September 2007, Blackwater contractors guarding a State Department convoy opened fire in Nisour Square, Baghdad, killing fourteen unarmed Iraqi civilians and wounding others. The United States prosecuted. After years of litigation, four contractors were convicted in federal court — one of first-degree murder, three of voluntary manslaughter and firearms offences. In December 2020 all four were pardoned by presidential act, and the convictions ceased to have effect. United Nations human-rights experts called the pardons an affront to justice and said they violated obligations under international humanitarian law. What makes this worth recording is not that private force killed civilians, which is documented in many places, but the shape of the whole sequence: the killings happened, the justice system worked, and the outcome was undone by an authority the justice system does not reach. Accountability that can be reversed at will is a different thing from accountability, and a reader weighing whether private organisations face consequences has one fully documented answer to work from.",
    evidence: [
      "Nisour Square, Baghdad, 16 September 2007: fourteen unarmed Iraqi civilians killed by Blackwater contractors guarding a State Department convoy",
      "Four contractors convicted in US federal court — one of first-degree murder, three of voluntary manslaughter and firearms offences",
      "All four pardoned by presidential act in December 2020",
      "UN human-rights experts publicly described the pardons as an affront to justice and a violation of obligations under international humanitarian law",
    ],
    questions: [
      "One documented case does not establish a pattern, and this concept does not claim one.",
      "It concerns conduct abroad under a contract with the US government. It says nothing about conduct by private organisations inside the United States.",
      "A pardon extinguishes a conviction. It does not establish that the underlying findings of fact were wrong, and this concept takes no position on that.",
    ],
    references: [
      { label: "Shock and dismay after the Blackwater pardons — NPR", href: "https://www.npr.org/2020/12/23/949679837/shock-and-dismay-after-trump-pardons-blackwater-guards-who-killed-14-iraqi-civil" },
      { label: "UN experts: the pardons are an affront to justice", href: "https://news.un.org/en/story/2020/12/1081152" },
      { label: "Accountability isn't wired to deployment, even in the schema", href: "/concepts#accountability-not-wired" },
    ],
    referencesNote:
      "The news sources are cited for the documented sequence of conviction and pardon. The linked concept is method — it records a structural version of the same gap.",
    verification: "unverified",
    disclaimer:
      "This concept reports a prosecuted and pardoned case. It makes no claim about any other conduct by any private organisation, and none about conduct inside the United States.",
  },
  {
    id: "who-profits-from-a-body",
    origin: "ai",
    basis: "documented",
    title: "Who profits from a body?",
    body:
      "In January 2018 Reuters published an investigation by Brian Grow and John Shiffman into the American body trade. Body brokers — legally, non-transplant tissue banks — acquire bodies donated to science, usually for free, then cut them into parts and sell them. The reporters did not merely describe the market. They entered it: Reuters bought a human cervical spine for three hundred dollars. It had belonged to Cody Saunders, a twenty-four-year-old from Tennessee, whose parents had not known what became of him. Across the investigation, family after family had no idea what happened to the person they donated. The legal position is the part most people find hardest to believe. Federal law prohibits selling body parts for transplant into a living person. Most states say nothing at all about selling body parts for research or education. So the trade is not a black market being policed and failing; it is a lawful market that was never regulated, in which a journalist can buy a spine over the counter and the donating family is told nothing. Whatever a person imagines happens to a body, this is what the record actually documents happening.",
    evidence: [
      "Grow & Shiffman, 'The Body Trade', Reuters, January 2018",
      "Body brokers acquire donated bodies, usually at no cost, then sell the parts",
      "Reuters purchased a human cervical spine for $300 in the course of reporting",
      "The spine belonged to Cody Saunders, 24, of Tennessee; his parents did not know what had become of his body",
      "Federal law bars sale of parts for transplant into a living person; most states are silent on sale for research or education",
    ],
    questions: [
      "The investigation documents a lawful and largely unregulated market. It establishes no criminal conduct beyond the cases it names.",
      "It concerns bodies donated to science. It says nothing about how any person died, and nothing about any death being caused for this purpose.",
      "State law has moved in places since 2018. This concept does not track the current statute in any given state.",
    ],
    references: [
      { label: "The Body Trade — Reuters (2018)", href: "https://ethics.sjmc.wisc.edu/wp-content/uploads/sites/2130/2024/08/reuters_bodytrade.pdf" },
      { label: "Have private contractors killed civilians and gone free?", href: "/concepts#contractors-killed-and-freed" },
      { label: "There is no column for you", href: "/concepts#no-column-for-you" },
    ],
    referencesNote:
      "Reuters is cited for its own investigation. The linked concepts are adjacent arguments about accountability and about the person who appears nowhere in a record; neither corroborates this one.",
    verification: "unverified",
    disclaimer:
      "This concept reports a published investigation into a lawful market. It makes no claim that any death was caused, hastened, or procured for the purpose of supplying it.",
  },
];

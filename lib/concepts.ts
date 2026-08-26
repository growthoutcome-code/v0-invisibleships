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
];

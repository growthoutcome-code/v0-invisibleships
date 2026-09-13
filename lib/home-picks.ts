/**
 * The curated glossary slides for the home page.
 *
 * There is no journal equivalent any more. Sean, 30 August: "do not suggest any
 * journal entries." The journal section leads with the last entry in the record,
 * whatever it happens to be — see latestEntry() in lib/server-corpus.ts. That is
 * a better rule than any curation: the front page shows where the record
 * actually stands, and nobody chooses which face it shows.
 */

/**
 * The glossary terms the home page carries, in the order a stranger needs them.
 *
 * Sean, 9 September: "let's be selective… Zersetzung German disintegration
 * tactics need to be in the list… pick the most relevant terms based on your
 * understanding of the overall corpus, and what improves public safety."
 *
 * The order is the argument, and each one is doing a different job:
 *
 *  1. ZERSETZUNG TACTICS — required, and it belongs first regardless: the hero
 *     uses the word and links here, so a reader arrives already wanting it. It
 *     is also the only term in the set that is historically documented rather
 *     than claimed — the Stasi did this, and it is on the record.
 *  2. GANG STALKING — the vernacular term a reader most likely arrives with,
 *     defined so they can tell it apart from Zersetzung. Its own entry draws
 *     that line: a folk label for a reported pattern, not a documented method.
 *     An archive that will not distinguish itself from its own genre cannot be
 *     trusted to distinguish anything else.
 *  3. MICROWAVE AUDITORY EFFECT — the most publicly useful entry on the page.
 *     A documented physical phenomenon, first reported by Frey in 1961, in
 *     which pulsed radio-frequency energy is genuinely perceived as sound
 *     inside the head. Someone frightened by what they are hearing deserves to
 *     meet the real, published explanation before anything else.
 *  4. VOICE-TO-SKULL — the CLAIMED counterpart to 3, and labelled as claimed.
 *     Placing them adjacent is the whole method of this archive: here is what
 *     is documented, here is what is asserted, and here is the difference.
 *  5. PERCEPTUAL SET — what the site is named after, and the one idea that
 *     makes the rest legible: you do not notice what your experience has not
 *     prepared you to notice.
 *  6. COGNITIVE LIBERTY — the right the whole subject turns on, and the one the
 *     neurotechnology section shows Colorado already legislating for.
 *
 * DROPPED, and why. `obedience experiment` has no definition in the glossary at
 * all — six characters — so it would have rendered an empty slide. `telepathy`
 * and `brain-computer interface` are both already carried by the
 * neurotechnology section above. `chilling effect` is a strong entry and the
 * first candidate if this ever goes to seven.
 */
export const GLOSSARY_PICKS: string[] = [
  "zersetzung-tactics",
  "gang-stalking",
  "microwave-auditory-effect",
  "voice-to-skull",
  "perceptual-set",
  "cognitive-liberty",
];

/**
 * The five concepts the home page carries.
 *
 * Sean, 10 September, consolidating what were two sections — "What can the
 * technology actually do?" and "What would this technology be worth if people
 * consented to it?" — into one. Both drew on the concepts register; neither
 * said so. His split: two constructive, three challenging.
 *
 * CONSTRUCTIVE
 *  1. what-produces-the-feeling  — the only concept of the 35 written for a
 *     household rather than an investigator. "Your house is not haunted" is the
 *     section's lead line and this is the slide under it.
 *  2. law-for-neural-data        — the consent future already becoming law.
 *
 * CHALLENGING
 *  3. can-a-machine-read-thought — what is actually documented, and its limits.
 *  4. organised-harassment-is-fact — adjudicated, not asserted. The historical
 *     ground under Zersetzung, and the set's best answer to a sceptic.
 *  5. why-isnt-this-in-the-news  — Sean, 10 September: "turn that into a news
 *     media acknowledgment question." Replaced `what-it-would-take`, and it is
 *     the better slide: it meets the suppression assumption head-on and answers
 *     it with 3,500 closed newspapers rather than a motive.
 *
 * NOT HERE, and worth fixing next: nothing in the register covers beneficial
 * neurotechnology — zero mentions of Neuralink, speech restoration or
 * prosthesis across all 35. The VOICE trial and the bilingual neuroprosthesis
 * were authored slides in the old section and are lost in this consolidation.
 * Shipping without them was a deliberate call to keep moving; the fix is to
 * write that concept, where it belongs on its own merits.
 */
export const CONCEPT_PICKS: string[] = [
  // CONSTRUCTIVE FIRST, and deliberately four of them. Sean, 10 September: "we
  // need these incredible ideas for the future of law enforcement to be there."
  // The register held 35 concepts and not one described a system worth
  // building; two were written that day to fix that.
  "what-produces-the-feeling",   // his required first slide — neuro-engagement
  "prevention-as-the-product",   // new: prevention paid for, and the consent problem
  "whose-eyesight-is-it",        // new: a citizen's own camera, and AWS's footprint
  "law-for-neural-data",         // the law that already exists under both of them
  // THEN THE CHALLENGING THREE. Documented every one, which is what earns the
  // two arguments above the right to be on the same carousel.
  "organised-harassment-is-fact",
  "can-a-machine-read-thought",
  "why-isnt-this-in-the-news",
];

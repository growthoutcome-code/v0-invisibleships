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
 * Five glossary terms, in the order a stranger needs them.
 *
 * perceptual set first because it is what the site is named after and it is the
 * one idea that makes the rest legible. Then the word the transcripts use most,
 * then the right the whole subject turns on, then the machine that would have to
 * exist, and last the effect that explains why so few people say any of this out
 * loud.
 */
export const GLOSSARY_PICKS: string[] = [
  "perceptual-set",
  "telepathy",
  "cognitive-liberty",
  "braincomputer-interface-bci",
  "chilling-effect",
];

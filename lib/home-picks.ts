/**
 * The curated home-page slides. Chosen by hand, for reasons written down.
 *
 * WHY THESE ARE NOT DERIVED. "/" is ungated. 89 of 438 journal documents open
 * with euthanasia, self-harm or violence language inside their first 220
 * characters, including two of the eight most recent. Any rule that picks
 * passages automatically — newest, longest, most-linked — eventually puts one of
 * those on the front page in front of somebody who arrived from a link with no
 * warning ahead of it. There is no filter safe enough. A person chooses, and the
 * reason each was chosen is recorded beside it so the next person can disagree.
 *
 * WHAT WAS CHOSEN FOR. Not the most dramatic passages — the ones that show what
 * kind of record this is. Two of the five have the author questioning his own
 * perception in his own words, one describes the method, one is him standing at
 * an intersection telling strangers to go and read the EU AI Act, and the last
 * is the record running out. A reader who meets those five understands the
 * archive better than any summary of it would manage.
 *
 * EVERY QUOTE IS VERIFIED against its entry at render time by featuredEntry()
 * in lib/server-corpus.ts. Whitespace is normalised on both sides — nothing
 * else. If an entry is edited and a quote stops matching, the build fails
 * rather than shipping a misquote of the archive's own primary source.
 */

export type JournalPick = { id: string; quote: string; why: string };

export const JOURNAL_PICKS: JournalPick[] = [
  {
    id: "IS-J01-20250413-ENTRY",
    // The question mark is the reason. The author is doing to himself what the
    // archive asks of everyone else, in the record, six weeks in.
    quote:
      "Ears are still sensitive from a possible continued fluctuating use of a sound weapon and or experiencing my past exposure to something technological?",
    why: "He questions his own perception, in the entry, and leaves the question mark in.",
  },
  {
    id: "IS-J01-20250818-ENTRY",
    // What this actually looks like from outside: a man on a corner with a
    // piece of cardboard. Nothing about it is abstract.
    quote:
      "Upon arrival at the intersection, I stand with my cardboard sign, recording the impact of the breaching process on myself and the community. It’s a very common suggestion that the vehicles are tormented with the statement “Do not support this person!”.",
    why: "The archive at street level: a man, a corner, a piece of cardboard.",
  },
  {
    id: "IS-J04-20251121-ENTRY",
    // He is not asking anyone to believe him. He is asking them to go and read
    // a piece of European legislation.
    quote:
      "My sign at the intersection read “Google the battle for your brain and the E.U. A.I. Act, Anything helps.”",
    why: "What he asked passing strangers to do was look up a law and check.",
  },
  {
    id: "IS-J04-20260210-ENTRY",
    // The best single sentence in the corpus for what this archive is: a test,
    // performed on himself, written down whichever way it came out.
    quote:
      "Im laying in bed in the Evergreen dormitory surrounded by approximately 150 people in a warehouse setting with 25-30ft ceilings. I checked my ears and the sound is outside of me, echoing through the building.",
    why: "A test he ran on himself, in a shelter dormitory, written down either way.",
  },
  {
    id: "IS-J04-20260406-ENTRY",
    // The record stopping is part of the record. Ending the carousel anywhere
    // else would imply it is still being kept.
    quote:
      "I have not yet received any contact via email from any source of support financially or regarding an explanation as to what the city of Denver, CO. is going through. I am without a phone plan and a functional laptop. There most likely will not be any more updates to the Invisible Ships document series without life saving support.",
    why: "The last entry. The record running out is part of the record.",
  },
];

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

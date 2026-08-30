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
 * kind of record this is. Newest first, so the section opens on where the record
 * actually stands. One has the author testing his own perception and writing
 * down the result either way; one is him at an intersection asking strangers to
 * go and read a European law; one is the series nearly stopping. A reader who
 * meets these five understands the archive better than any summary would manage.
 *
 * EVERY QUOTE IS VERIFIED against its entry at render time by featuredEntry()
 * in lib/server-corpus.ts. Whitespace is normalised on both sides — nothing
 * else. If an entry is edited and a quote stops matching, the build fails
 * rather than shipping a misquote of the archive's own primary source.
 */

export type JournalPick = { id: string; quote: string; why: string };

export const JOURNAL_PICKS: JournalPick[] = [
  {
    // NEWEST FIRST, at Sean's instruction — and this is the newest entry there
    // is. The quote starts mid-entry on purpose: the sentence before it names
    // coerced euthanasia, and this page is ungated. What is quoted is the only
    // note of possible change anywhere in the record, which is a truer opening
    // than either the danger or the despair.
    id: "IS-J04-20260506-ENTRY",
    quote:
      "The life threatening out-loud or publicly accessible conversation continues, however public outcry and more importantly public participation may be influencing a state or federal sponsored life saving change.",
    why: "The newest entry, and the first line in the record that says something may be changing.",
  },
  {
    id: "IS-J04-20260406-ENTRY",
    quote:
      "I have not yet received any contact via email from any source of support financially or regarding an explanation as to what the city of Denver, CO. is going through. I am without a phone plan and a functional laptop. There most likely will not be any more updates to the Invisible Ships document series without life saving support.",
    why: "A month earlier: no contact, no phone, and the series nearly stopping.",
  },
  {
    // The best single passage in the corpus for what kind of record this is: a
    // test, run on himself, written down whichever way it came out.
    id: "IS-J04-20260210-ENTRY",
    quote:
      "Im laying in bed in the Evergreen dormitory surrounded by approximately 150 people in a warehouse setting with 25-30ft ceilings. I checked my ears and the sound is outside of me, echoing through the building.",
    why: "A test he ran on himself, in a shelter dormitory, written down either way.",
  },
  {
    // He is not asking anyone to believe him. He is asking them to go and read
    // a piece of European legislation.
    id: "IS-J04-20251121-ENTRY",
    quote:
      "My sign at the intersection read “Google the battle for your brain and the E.U. A.I. Act, Anything helps.”",
    why: "What he asked passing strangers to do was look up a law and check.",
  },
  {
    // Six weeks in, the author is already doing to himself what this archive
    // asks of everyone else. The question mark is the reason it is here.
    id: "IS-J01-20250413-ENTRY",
    quote:
      "Ears are still sensitive from a possible continued fluctuating use of a sound weapon and or experiencing my past exposure to something technological?",
    why: "Early on, he questions his own perception — and leaves the question mark in.",
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

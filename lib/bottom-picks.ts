/**
 * The candidates the bottom sections choose from. The home page does not use
 * this file: its picks stay in lib/home-picks.ts and lib/home-quotes.ts.
 *
 * Sean, 1 Oct 2026: "Let's randomize the content that shows in the bottom
 * sections… I don't think we need to pull from the entire library… four to six
 * selections for each bottom section… I don't want this work to impact the
 * sections on the home page."
 *
 * HOW THE RANDOM PICK WORKS. Each list below is a vetted pool. Every time a
 * page's bottom sections load, components/BottomSections.tsx shows the whole of
 * each pool in a random order, and one research chart of three. A reader moving
 * from page to page meets a different order, and a different chart, each time.
 *
 * WHY A POOL AND NOT THE WHOLE LIBRARY. Most of the library cannot be shown
 * cold. The journal is the clearest case: the home page's quotation rules
 * (lib/home-quotes.ts) exclude passages centred on suicide, self-harm or
 * euthanasia, anything naming a private individual, and anything accusing a
 * named company or agency, and a random journal excerpt would break one of
 * those rules most of the time. Some glossary entries are broken as slides
 * (`mosquito-device` and `brain-data-as-a-service…` open mid-sentence). A pool
 * keeps "random" and "looks okay" both true.
 *
 * NO OVERLAP WITH THE HOME PAGE. Nothing here is on the home page, so a reader
 * who has seen the home page always meets something new at the bottom.
 */


/**
 * Glossary. Checked as rendered slides: `sampling-limit` is left out because
 * its summary is cut at a decimal point ("05 kHz"), and `mosquito-device` and
 * `brain-data-as-a-service…` because theirs open mid-sentence.
 */
export const BOTTOM_GLOSSARY: string[] = [
  // Twelve, all shown in a random order (Sean, 1 Oct 2026: "pick 10 terms for
  // the carousel… a variety", then Zersetzung for presbycusis, then dumping
  // syndrome and tinnitus added). Every glossary topic is represented.
  "braincomputer-interface-bci",   // Technology · Neuroscience
  "electroencephalogram",          // Technology · Neuroscience
  "zersetzung-tactics",            // Military & intelligence · Psychology
  "parametric-array",              // Technology · Physics & signals
  "directed-energy",               // Military & intelligence · Physics & signals
  "no-touch-torture",              // Military & intelligence · Ethics & human rights
  "chilling-effect",               // Ethics & human rights
  "obedience-experiment",          // Ethics & human rights · Psychology
  "neuro-engagement",              // Neuroethics
  "nuremberg-code",                // Ethics & human rights
  "dumping-syndrome",              // Health & symptoms
  "tinnitus",                      // Neuroscience · Health & symptoms
];

/**
 * Concepts. Practical and documented: what "only I can hear it" means, what
 * can be recorded, who owns neural data, how an explanation can itself do
 * harm, what happens to the people around a target, and why two things on one
 * timeline are not cause and effect. Checked as rendered slides:
 * `how-protected-is-your-medical-record` stopped one sentence before its point,
 * so it was left out.
 */
export const BOTTOM_CONCEPTS: string[] = [
  // The first six, chosen 1 Oct 2026.
  "only-you-can-hear-it",
  "can-you-record-it",
  "who-owns-neural-data",
  "explanation-is-part-of-the-harm",
  "co-occurrence-is-not-cause",
  "everyone-around-a-target",
  // Fourteen more (Sean, 1 Oct 2026: "pick 20 concepts to randomize"). Each body
  // runs past 900 characters, so it fills a full-width square; the shorter
  // concepts would leave the card half empty. None is on the home page.
  "the-neurotech-bullhorn",
  "low-number-may-mean-low-counting",
  "prescribing-is-not-prevalence",
  "ruin-first-then-rescue",
  "attack-to-force-acknowledgment",
  "denver-acoustic-weapons",
  "made-into-assets-unknowing",
  "no-private-thinking-space",
  "nonsurgical-by-design",
  "what-it-would-take",
  "contractors-killed-and-freed",
  "who-profits-from-a-body",
  "children-wearables-and-rf",
  "how-protected-is-your-medical-record",
];

/**
 * Journal: ten, all shown, one at a time, in a random order (Sean, 1 Oct
 * 2026). Five threatening statements, two on being typed as they speak, and
 * three on the technology.
 *
 * Built by lib/bottom-quotes.ts, which says how a slide is laid out. Each
 * passage is pinned by an anchor in the live corpus exactly like the home
 * page's quotations; no quoted text is stored here. `meta` is the time and
 * place, taken from the entry's header or the recording itself.
 *
 * QUESTIONS COME FROM THE RECORD FIRST (Sean): the entry's or the recording's
 * own where it asks one, grammar tidied at most; otherwise Sean's wording.
 *
 * This set deliberately includes passages the home page's rules exclude (the
 * euthanization list, threats). Sean chose them for the bottom sections; a
 * critical-disclaimer link sits under every slide.
 */
export type BottomPassage = { anchor: string; chars: number; min?: number };
export type BottomQuotePick = {
  id: string;
  meta: string;
  blocks: { from: "distance" | "author"; passages: BottomPassage[] }[];
  question: string;
  /**
   * WORDING SEAN HAS APPROVED FOR THE SLIDE ONLY, where it differs from the
   * transcript. Applied after the passage is cut; the entry page and the
   * corpus keep the original. Each `from` must appear in the cut text or the
   * build fails, so a re-cut can never silently drop or misapply one.
   */
  edits?: { from: string; to: string; approved: string }[];
};

export const BOTTOM_QUOTES: BottomQuotePick[] = [
  // ------------------------------------------------ threatening statements
  {
    id: "IS-J01-20250227-ENTRY",
    meta: "Between 3 and 5pm · Near St Mark's Coffee Shop, Denver, CO",
    blocks: [
      { from: "distance", passages: [{ anchor: "This is a terrorist attack on America", chars: 40 }] },
      { from: "author", passages: [{ anchor: "Someone claimed to be from the Saudi Royal Family", chars: 444 }] },
      { from: "distance", passages: [{ anchor: "(paraphrasing) “America did this", chars: 80 }] },
    ],
    // The home page's question (Sean: "I like the question we have on the homepage").
    question:
      "Was this really the Saudi Royal Family, or someone from the Zersetzung disintegration-tactics community claiming to be from the Saudi Royal Family?",
  },
  {
    id: "IS-J02-20250823-R06",
    meta: "2:57pm · Intersection of Colorado and 8th, Denver",
    blocks: [
      { from: "author", passages: [{ anchor: "Okay, so it is 2:57 p.m.", chars: 307 }] },
      { from: "distance", passages: [{ anchor: "Yes, according to our protocol", chars: 130 }] },
      { from: "author", passages: [{ anchor: "That makes three for today.", chars: 40 }] },
    ],
    // Sean's wording, 1 Oct 2026.
    question: "What organization was communicating here? Are they American?",
  },
  {
    id: "IS-J01-20250527-ENTRY",
    meta: "1:25 to 2:00pm · Tattered Cover Bookstore, Denver, CO",
    blocks: [
      // Then the reactions a few lines on; the author's note between is skipped.
      { from: "distance", passages: [
        { anchor: "I release you from your suffering. I release", chars: 515 },
        { anchor: "This is unacceptable people.", chars: 149 },
        // Skipping the line naming an agency.
        { anchor: "This is fucking incredible people. Why won’t anybody help him?", chars: 70 },
      ] },
    ],
    // Sean's wording, 1 Oct 2026.
    question: "Is this evidence of counterterrorism attacking to prompt acknowledgment?",
  },
  {
    // Recording 5's audio file is 20250717-140744, the one the day's entry cites
    // for the nuclear threat, so the time given is the file's.
    id: "IS-J01-20250717-R05",
    meta: "About 2:07pm · Intersection of 8th and Colorado Blvd, Denver",
    blocks: [
      { from: "distance", passages: [
        { anchor: "We are going to nuclear strike America very soon.", chars: 226 },
        { anchor: "Okay, so what was the point of saying that?", chars: 172 },
      ] },
      { from: "author", passages: [
        { anchor: "how how should we interpret this, right?", chars: 140 },
        { anchor: "I don't think you can summon a nuclear strike", chars: 149 },
      ] },
    ],
    // From the recording, seconds later.
    question: "Is it an actual terrorist threat?",
  },
  {
    // The morning only (Sean: "work with that first time frame"), in time order.
    // Nothing in the entry answers the 8:09am line directly.
    id: "IS-J01-20250304-ENTRY",
    meta: "6:30 to 8:09am · Cirrus Apartments, Denver, CO",
    blocks: [
      // The author's own 6:30am note opens the morning.
      { from: "author", passages: [{ anchor: "Possible use of sound weapon another very strong", chars: 473 }] },
      { from: "distance", passages: [
        { anchor: "Stop taking notes", chars: 20 },
        { anchor: "I need to explain something. We're here to punish", chars: 90 },
      ] },
    ],
    // Sean's wording, 1 Oct 2026.
    question: "Is this evidence of Zersetzung practitioners at the Cirrus Apartments?",
  },

  // ------------------------------- typing what is said, and what follows
  // Sean, 1 Oct 2026: "Stop fucking typing what I'm saying… with a death
  // threat", and the one that "mentions Moderna… 'Do you see this?'… the
  // document is updating as I speak… Can you be my witness?"
  {
    // Header: "Tues 6/11/25 1:24pm-5:30pm The Denver Public Library". The entry
    // notes it was first titled The Gathering Place and corrected mid-entry.
    id: "IS-J01-20250611-2-ENTRY",
    meta: "1:24 to 5:30pm · The Denver Public Library, Downtown Denver",
    blocks: [
      { from: "distance", passages: [
        { anchor: "Do not accept euthanization.”", chars: 32 },
        { anchor: "Is the voice filter not working?", chars: 304 },
        // The line between names the author mid-sentence and is skipped.
        { anchor: "I know what happened. These teams switch", chars: 196 },
      ] },
    ],
    // The entry's own, from its Questions & Comments.
    question: "Why are people surprised I can hear them?",
  },
  {
    // The manual entry at 3:45am. The entry's scene is downtown Denver; Sean
    // places this one at the 48th Street shelter (1 Oct 2026). A different
    // passage from the one the home page quotes ("Can you zoom in a little").
    id: "IS-J03-20251106-ENTRY",
    meta: "3:45am · 48th Street shelter, Denver",
    blocks: [
      { from: "distance", passages: [
        { anchor: "This document is accurate. I also thought that", chars: 402 },
        { anchor: "You’re scaring the living shit out of people at Monsanto", chars: 118 },
      ] },
    ],
    // From the record, a few lines later: "Are you my witness for this?"
    question: "Are you my witness for this?",
  },

  // -------------------------------------------------- the technology
  {
    // The line between the two passages names a private person and is skipped.
    id: "IS-J01-20250529-ENTRY",
    meta: "10:30am to 12:15pm · The Gathering Place, Denver, CO",
    blocks: [
      { from: "distance", passages: [
        { anchor: "This is not technology people!", chars: 33 },
        { anchor: "Please do not take me to prison over this", chars: 170 },
        { anchor: "Are you seriously showing us a speaker right now?", chars: 440, min: 380 },
      ] },
    ],
    // Sean's wording, 1 Oct 2026.
    question: "Is this evidence of the telepathic experience being technological?",
  },
  {
    id: "IS-J02-20250909-R03",
    meta: "11:17am · 48th Street shelter, Denver",
    blocks: [
      { from: "author", passages: [
        { anchor: "How might we bring consent to this unconsented", chars: 170 },
        { anchor: "So a technology, you have top down initiatives", chars: 110 },
        { anchor: "How might we bring life-saving consent", chars: 503 },
      ] },
    ],
    // Sean's wording, 1 Oct 2026.
    question: "Is the current implementation of this technology bottlenecking investments?",
  },
  {
    id: "IS-J01-20250710-R02",
    meta: "5:38pm · Intersection of 8th Ave & Colorado Blvd, Denver",
    blocks: [
      { from: "author", passages: [{ anchor: "I mean I grew up with alternative spirituality", chars: 713, min: 653 }] },
    ],
    // Sean, 1 Oct 2026: "Let's consolidate the initial sentences." The one
    // slide that reads differently from the transcript.
    edits: [{
      from: "telepathy. And I was going to be executed for it. I I couldn't believe it.",
      to: "telepathy and I was going to be executed for it, I couldn't believe it.",
      approved: "Sean, 1 Oct 2026",
    }],
    // Sean's wording, 1 Oct 2026.
    question: "Is this some kind of military deployment? If so, whose military, and is it evidence of an attack on America?",
  },
];

/**
 * Research. One chart per visit. Each is a chart the Research pages already
 * publish, with the heading written as its plain finding and the one caveat
 * a reader needs under it.
 */
export type BottomChart = "suicide" | "homicide" | "breakins";
export const BOTTOM_CHARTS: BottomChart[] = ["suicide", "homicide", "breakins"];

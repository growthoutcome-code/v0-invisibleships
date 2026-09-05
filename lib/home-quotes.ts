/**
 * The journal moments the home page rotates through.
 *
 * Sean, 5 September: "find five to ten journal entries that are meaningful…
 * we include the first journal entry… at least two good strong Zersetzung
 * entries… evidence of eyesight, someone opening the journal and I type what
 * they say, and they don't have an explanation for this."
 *
 * THIRTEEN SLIDES, IN AN ARC, not a shuffle. Origin, then the speakers
 * noticing they are being written down, then the mechanism they let slip, then
 * the tactic and what it costs, then the process named, then the future the
 * same voices describe. A reader who watches three slides gets a different
 * archive depending on WHICH three, so the order carries the argument: it
 * opens on the first day and closes on the case for the technology.
 *
 * WHAT WAS EXCLUDED, and it was a lot. Every candidate whose quotable portion
 * centred on suicide, self-harm or euthanasia. Anything naming a private
 * individual. Anything accusing a named company or agency of wrongdoing — the
 * archive cites adjudicated findings, it does not make claims. Roughly twenty
 * otherwise strong passages went out on those three rules.
 *
 * HOW THE TEXT IS PINNED. A slice is never stored here, only an `anchor`: a
 * phrase that must appear in that document's body. The excerpt is cut from the
 * live corpus at build time and the build FAILS if an anchor stops matching.
 * An excerpt therefore cannot drift from the entry it claims to quote, and
 * editing the journal can never leave a stale quotation on the home page.
 *
 * Two anchors below also occur in a second, later document where Sean repeats
 * himself. That is fine: the lookup is scoped by `id` first, so the anchor only
 * has to be unique WITHIN its own document.
 */

export type HomeQuotePick = {
  /** Document id in the corpus. */
  id: string;
  /** Must appear verbatim in that document's body_markdown, or the build fails. */
  anchor: string;
  /** Characters to take from the opening quotation mark. Trimmed back to the
   *  last closing mark so a slide never ends mid-sentence. */
  chars: number;
  /** Do not end the excerpt before this many characters. Without it the
   *  boundary rule stops at the first closing quote, which on a slide whose
   *  opening line is a short quotation leaves one line where two were wanted. */
  min?: number;
  /** One line under the quote saying why this one is here. */
  note: string;
};

export const HOME_QUOTES: HomeQuotePick[] = [
  // ---------------------------------------------------------------- origin
  {
    // The first entry in the archive, and the only one carrying a Questions &
    // Comments block written specifically to sit under an accusation.
    id: "IS-J01-20250227-ENTRY",
    anchor: "This is a terrorist attack on America",
    chars: 300,
    min: 240,
    note: "The first entry in the record.",
  },

  // --------------------------------------------------- they notice the typing
  {
    id: "IS-J01-20250304-ENTRY",
    anchor: "is he actually writing something",
    chars: 110,
    note: "Taunting to pleading, inside one sentence.",
  },
  {
    id: "IS-J01-20250529-ENTRY",
    anchor: "Stop typing what we say",
    chars: 200,
    note: "A demand, a description of the activity, and guilt — in one breath.",
  },
  {
    id: "IS-J01-20250611-2-ENTRY",
    anchor: "Please stop writing what we",
    chars: 150,
    note: "The politeness against the content, and a cover story losing its author.",
  },
  {
    id: "IS-J01-20250711-R01",
    anchor: "believe this person is just recording us",
    chars: 260,
    note: "Method, in their own words: they ran projections, and bet on stigma.",
  },

  // ------------------------------------------------------------- the eyesight
  {
    // Sean, 5 September: "someone opening the journal and I type what they say,
    // and they don't have an explanation for this."
    id: "IS-J03-20251106-ENTRY",
    anchor: "Can you zoom in a little",
    chars: 330,
    note: "“Can you zoom in a little” only makes sense if someone is reading the screen.",
  },

  // -------------------------------------------------------------- Zersetzung
  {
    id: "IS-J01-20250717-R02",
    anchor: "Make them look like a crazy person",
    chars: 130,
    note: "The objective, stated plainly.",
  },
  {
    id: "IS-J04-20260205-ENTRY",
    anchor: "spilling popcorn everywhere",
    chars: 330,
    note: "A fabrication built on just enough truth to be unfalsifiable. Someone else lost their workspace.",
  },
  {
    id: "IS-J02-20250924-R01",
    anchor: "destroyed this person's reputation in the city of Denver",
    chars: 230,
    note: "First person plural. The outcome, described by the people producing it.",
  },

  // ------------------------------------------------------------------ diving
  {
    id: "IS-J04-20251119-R05",
    anchor: "have become muscle memory",
    chars: 430,
    note: "Diving, described in the first person. The glossary definition, performed.",
  },

  // ------------------------------------------------------------- the future
  {
    id: "IS-J02-20250928-R05",
    anchor: "mother of all police brutality events",
    chars: 415,
    note: "This archive is not an argument against law enforcement.",
  },
  {
    id: "IS-J04-20251206-R03",
    anchor: "stand in defense of law enforcement 200%",
    chars: 285,
    note: "Said after ten months of it, and still said.",
  },
  {
    id: "IS-J02-20250823-R01",
    anchor: "imagine this with me for a moment",
    chars: 250,
    note: "Consent first. The future the same voices describe.",
  },
];

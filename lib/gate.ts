// First-visit gate memory.
//
// Backed by localStorage under a VERSIONED key (Sean, 30 Sep 2026: "make the
// gate only show up on the first visit"):
//   • Passing the gate is remembered on the device, across browser sessions —
//     a returning reader goes straight to the page they were sent to.
//   • Earlier (20 Aug to 30 Sep) it lasted one browser session, so every new
//     session met the full gate again. What that bought: a shared computer
//     showed the warning to the next person. That is what this gives up.
//   • Bump the _v suffix whenever the gate wording changes materially, so
//     returning visitors meet the updated terms once more.
//   • A reader who passed it under the session rule this session is carried
//     over, so nobody sees it twice on the day this ships.
//
// Falls back to the in-memory flag when storage is unavailable (private mode /
// storage denied), which re-shows the gate on refresh there. All storage access
// is wrapped, so this module is SSR-safe: on the server `window` is undefined
// and hasEntered() reports false.

export const GATE_VERSION = "v2";  // v2: the merged three-step gate, 15 Sep 2026

const KEY = `is_gate_entered_${GATE_VERSION}`;

/**
 * The options on the gate's optional "who is reading" question.
 *
 * Lives here rather than in the component because the server route that logs
 * the answer validates against this list — an allowlist, so a crafted request
 * cannot write arbitrary text into the database, and so the stored values stay
 * comparable with each other. A route may not import a client component, which
 * is the other reason this is not in EntryGate.tsx.
 *
 * Changing this list changes what past answers mean. Bump GATE_VERSION with it.
 */
export const ROLES = [
  "Law enforcement",
  "Government or policy",
  "Journalist or researcher",
  "This is happening to me, or someone I know",
  "Just curious",
  "Prefer not to say",
] as const;

export type VisitorRole = (typeof ROLES)[number];

let entered = false;

export function hasEntered(): boolean {
  if (entered) return true;
  try {
    if (window.localStorage.getItem(KEY) === "1") return true;
    // passed under the old once-per-session rule: remember it on the device now
    if (window.sessionStorage.getItem(KEY) === "1") { markEntered(); return true; }
    return false;
  } catch {
    return entered;
  }
}

export function markEntered(): void {
  entered = true;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* private mode: in-memory flag above still covers this visit */
  }
}

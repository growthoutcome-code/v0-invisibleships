// Gate memory: first visit, then once every 30 days.
//
// Sean, 4 Oct 2026: "make sure the gate only fires the first time you visit.
// And maybe every week thereafter." Then, the same day: "make sure the gate
// only opens once every 30 days." Decision record 0018.
//   • Passing the gate stores the time it was passed, on the device
//     (localStorage, under a VERSIONED key). For GATE_REPEAT_DAYS after that a
//     returning reader goes straight to the page they were sent to; after it,
//     the gate shows once more and the clock restarts.
//   • Before this (30 Sep to 4 Oct) a pass was remembered forever, and from
//     3 Oct the home page showed it on every visit as a temporary measure.
//     Devices that passed under the old rule stored "1" with no date; they meet
//     the gate once more, then follow the 30-day rule.
//   • Bump the _v suffix whenever the gate wording changes materially, so every
//     returning visitor meets the updated terms at once rather than within 30 days.
//   • The gate is mandatory (4 Oct 2026): nothing closes it except entering;
//     see components/EntryGate.tsx.
//
// Falls back to the in-memory flag when storage is unavailable (private mode /
// storage denied), which re-shows the gate on refresh there. All storage access
// is wrapped, so this module is SSR-safe: on the server `window` is undefined
// and hasEntered() reports false.

export const GATE_VERSION = "v2";  // v2: the merged three-step gate, 15 Sep 2026

const KEY = `is_gate_entered_${GATE_VERSION}`;

/** How long a pass lasts on a device before the gate shows again. */
export const GATE_REPEAT_DAYS = 30;  // was 7 (weekly) until 4 Oct 2026
const REPEAT_MS = GATE_REPEAT_DAYS * 24 * 60 * 60 * 1000;

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
    // A number is the time of the last pass. Anything else ("1" from the old
    // rule, or nothing) means the gate shows.
    const passed = Number(window.localStorage.getItem(KEY));
    if (!Number.isFinite(passed) || passed < 1e12) return false;
    const age = Date.now() - passed;
    // A clock set backwards gives a negative age; show the gate rather than
    // trusting a pass from the future.
    return age >= 0 && age < REPEAT_MS;
  } catch {
    return entered;
  }
}

export function markEntered(): void {
  entered = true;
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* private mode: in-memory flag above still covers this visit */
  }
}

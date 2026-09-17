// Session-persistent gate memory.
//
// Backed by sessionStorage under a VERSIONED key:
//   • Passing the gate lasts the whole browser session — refreshes and deep
//     links no longer re-show it (Sean, 2026-08-20: the opening animation now
//     lives in the glossary, so the front door doesn't need to replay).
//   • A new browser session (or a new device) still meets the full gate:
//     the content warning, the perceptual-set note, and the terms keep doing
//     their work. (There is no age attestation any more; it went on 30 August.)
//   • Bump the _v suffix whenever the gate wording changes materially, so
//     returning visitors meet the updated terms once more.
//
// Falls back to the old in-memory flag when storage is unavailable (private
// mode / storage denied), which simply restores re-gate-on-refresh there.
// All storage access is wrapped, so this module is SSR-safe: on the server
// `window` is undefined and hasEntered() reports false.

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
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return entered;
  }
}

export function markEntered(): void {
  entered = true;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* private mode: in-memory flag above still covers this visit */
  }
}

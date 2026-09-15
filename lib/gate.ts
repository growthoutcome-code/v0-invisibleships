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

const KEY = "is_gate_entered_v2";  // v2: the merged three-step gate, 15 Sep 2026

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

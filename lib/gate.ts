// In-memory gate memory for the MVP.
//
// This intentionally lives at MODULE scope (not sessionStorage / localStorage):
//   • It survives client-side route navigation — the SPA keeps this module
//     loaded, so moving between /, /journal/[id] and /glossary/[slug] within a
//     single visit does NOT re-show the gate.
//   • It resets on a full page reload — a browser refresh tears down the JS
//     context, so `entered` goes back to false and the gate shows again.
//
// That combination is the desired MVP behavior: the gate re-appears on every
// browser refresh, but navigating around inside one visit does not re-gate.
//
// When we later want a longer-lived "remember me", reintroduce persistence
// HERE, in this one place, instead of scattering storage reads/writes across
// page.tsx, ItemGate.tsx and AccessGate.tsx (which is what kept regressing).

let entered = false;

export function hasEntered(): boolean {
  return entered;
}

export function markEntered(): void {
  entered = true;
}

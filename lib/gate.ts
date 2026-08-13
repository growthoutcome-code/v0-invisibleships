// In-memory gate memory.
//
// Lives at MODULE scope (not sessionStorage / localStorage):
//   • Survives client-side tab navigation within one visit (no re-gate).
//   • Resets on a full page reload — a refresh tears down the JS context, so
//     `entered` returns to false and the gate shows again.
//
// Paired with GatedApp's reset-to-root effect, every browser refresh returns to
// the root URL ("/") and re-shows the gate: a clean front-door start each time.

let entered = false;

export function hasEntered(): boolean {
  return entered;
}

export function markEntered(): void {
  entered = true;
}

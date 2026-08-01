// Gate memory.
//
// While building, the homepage shows the gate on every NEW visit
// (REMEMBER_ENABLED = false). But once a visitor passes the gate, they can move
// between pages and item routes — and back — within that same browser session
// without being re-gated. This is what makes the real per-item routes usable.
//
// At launch, flip REMEMBER_ENABLED = true to also remember across sessions for
// 30 days (so returning visitors skip the gate).
export const REMEMBER_ENABLED = false;
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_KEY = "is_gate_session";
const REMEMBER_KEY = "is_gate_ok";

export function markGateEntered() {
  // Session flag: survives navigation + reloads within this tab, cleared when
  // the browsing session ends.
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
  // Timestamp: used only when REMEMBER_ENABLED (cross-session, 30-day).
  try { localStorage.setItem(REMEMBER_KEY, String(Date.now())); } catch { /* ignore */ }
}

export function hasEnteredGate(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return true;
  } catch { /* ignore */ }
  if (REMEMBER_ENABLED) {
    try {
      const ts = Number(localStorage.getItem(REMEMBER_KEY) || 0);
      if (ts && Date.now() - ts < REMEMBER_MS) return true;
    } catch { /* ignore */ }
  }
  return false;
}

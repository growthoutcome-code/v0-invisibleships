// Gate memory, persisted per browser tab session.
//
// Persistence lives HERE in one place (not scattered across page.tsx /
// AccessGate.tsx). We use sessionStorage so:
//   • Client-side navigation between section routes stays past the gate.
//   • A full browser refresh KEEPS you past the gate (fixes losing your place).
//   • A brand-new tab or a closed/reopened browser re-shows the gate — the
//     right behavior for an age gate (per-session consent).
//
// For a longer-lived "remember me", swap sessionStorage -> localStorage below.

const KEY = "is_gate_entered";

export function hasEntered(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markEntered(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore (private mode / storage disabled) */
  }
}

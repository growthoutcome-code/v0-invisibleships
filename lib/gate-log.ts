import { isCounting } from "@/lib/analytics";
import { GATE_VERSION } from "@/lib/gate";

/**
 * Client half of the gate log: one keepalive POST per step, alongside the
 * PostHog event that already fires.
 *
 * `keepalive` because the last of these goes out as the gate closes and the
 * reader starts navigating; an ordinary fetch can be cancelled by the
 * navigation that follows it, which would lose precisely the step that matters
 * most. Errors are swallowed on purpose — a logging failure must not surface in
 * front of somebody reading a consent screen.
 *
 * It respects the same exclusions as analytics (local dev, automation, the
 * standing ?analytics=off opt-out) by asking the analytics module rather than
 * repeating the test, so the two can never drift apart. The route checks again
 * server-side regardless.
 */
export function logGate(event: string, visitorRole?: string) {
  if (typeof window === "undefined" || !isCounting()) return;
  try {
    void fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        visitor_role: visitorRole,
        gate_version: GATE_VERSION,
        path: location.pathname,
      }),
    }).catch(() => {
      /* never surfaces to the reader */
    });
  } catch {
    /* no-op */
  }
}

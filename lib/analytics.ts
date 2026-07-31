import posthog from "posthog-js";

// Public PostHog project key (phc_) — safe for client-side use. Env vars override if set.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_oztF87Ru2kLa9YGd56zpBonGRFfoyUoF75ao9imrxeT3";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let inited = false;

export function initAnalytics() {
  if (inited || typeof window === "undefined" || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  inited = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // PostHog
  if (KEY) {
    try { posthog.capture(event, props); } catch { /* no-op */ }
  }
  // Google Analytics 4 (gtag) — forward the same event
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof g === "function") {
    try { g("event", event, props || {}); } catch { /* no-op */ }
  }
}

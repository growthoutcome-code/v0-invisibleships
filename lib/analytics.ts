import posthog from "posthog-js";

let inited = false;
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export function initAnalytics() {
  if (inited || typeof window === "undefined" || !KEY) return; // graceful no-op without a key
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  inited = true;
}

type Gtag = (command: string, event: string, params?: Record<string, unknown>) => void;

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // PostHog (no-op without a key)
  if (KEY) {
    try {
      posthog.capture(event, props);
    } catch {
      /* no-op */
    }
  }
  // Google Analytics (gtag) — dual-write when GA is present on the page
  try {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (typeof gtag === "function") gtag("event", event, props);
  } catch {
    /* no-op */
  }
}

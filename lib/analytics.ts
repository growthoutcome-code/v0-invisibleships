import posthog from "posthog-js";

let inited = false;
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-VXMCM15XTH";

function initGoogleAnalytics() {
  if (!GA_ID || typeof window === "undefined") return;
  const w = window as unknown as { gtag?: unknown };
  if (w.gtag) return; // already loaded
  const loader = document.createElement("script");
  loader.async = true;
  loader.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(loader);
  const initScript = document.createElement("script");
  initScript.innerHTML =
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" +
    GA_ID +
    "');";
  document.head.appendChild(initScript);
}

export function initAnalytics() {
  if (inited || typeof window === "undefined") return;
  if (KEY) {
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }
  initGoogleAnalytics();
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

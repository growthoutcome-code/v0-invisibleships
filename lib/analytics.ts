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

function initVercelAnalytics() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __vercelInsights?: boolean };
  if (w.__vercelInsights) return; // already loaded
  w.__vercelInsights = true;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
}

/**
 * Who does NOT get counted.
 *
 * Until 27 August 2026, nobody was excluded. AnalyticsInit sits in the root
 * layout, so a pageview fired on every load — before the age gate, before a
 * reader had agreed to anything — from any browser at all. That included:
 *
 *   - the author's own machine, every time he opened his own site
 *   - `npm run dev` on localhost, because GA_ID carries a hardcoded default and
 *     fires with no environment variable set at all
 *   - Chrome driven by automation, every time the site was opened to be built,
 *     checked or QA'd
 *
 * An archive whose entire claim is that its numbers resolve to a named source
 * cannot report a traffic number that counts its own authors. These three
 * exclusions are the cheapest honest fix, and none of them can be tripped by a
 * real reader arriving at the published site.
 *
 * Returns the reason for exclusion, or null to count this visit.
 */
function excluded(): string | null {
  const h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local")) {
    return "local development";
  }
  // Chrome sets navigator.webdriver whenever the browser is under automation —
  // Playwright, Puppeteer, or an AI assistant driving the page. It is never set
  // for a person browsing normally.
  if (navigator.webdriver) return "browser automation";
  // A standing per-device opt-out. Set it on any device, phone included, by
  // visiting any page with ?analytics=off — see below.
  try {
    if (localStorage.getItem(OPT_OUT) === "1") return "opted out on this device";
  } catch {
    // Private mode denies storage. Not knowing is not a reason to skip somebody.
  }
  return null;
}

const OPT_OUT = "is:no-analytics";

/** ?analytics=off stops counting this device for good; ?analytics=on resumes. */
function applyOptOutParam() {
  try {
    const v = new URLSearchParams(location.search).get("analytics");
    if (v === "off") localStorage.setItem(OPT_OUT, "1");
    else if (v === "on") localStorage.removeItem(OPT_OUT);
  } catch {
    /* no-op */
  }
}

/** Set once excluded, so track() stays silent too rather than half-reporting. */
let disabled = false;

export function initAnalytics() {
  if (inited || typeof window === "undefined") return;
  applyOptOutParam();
  const why = excluded();
  if (why) {
    // Say so out loud. A silent exclusion is how a metric quietly becomes wrong
    // in the other direction, and nobody notices that either.
    console.info(`[analytics] not counting this visit — ${why}`);
    disabled = true;
    inited = true;
    return;
  }
  if (KEY) {
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }
  initGoogleAnalytics();
  initVercelAnalytics();
  inited = true;
}

type Gtag = (command: string, event: string, params?: Record<string, unknown>) => void;

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || disabled) return;
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

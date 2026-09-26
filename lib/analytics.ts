import posthog from "posthog-js";

let inited = false;
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

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
 * GOOGLE ANALYTICS WAS REMOVED on 26 September, deliberately.
 *
 * It gave nothing PostHog did not: the gate's role answer never reached it (no
 * custom dimension was ever registered), the server-side download event never
 * reached it at all, and its numbers disagreed with PostHog's because it has none
 * of the author exclusions. Against that, it carried the real costs — Google's
 * own terms require consent from EEA and UK visitors, and an archive about being
 * watched loading an advertising vendor's tag is a contradiction a reader can see
 * in the network tab. Historical GA data stays in the Google account; nothing is
 * deleted by this, and re-adding it is one commit.
 *
 * Who does NOT get counted.
 *
 * Until 27 August 2026, nobody was excluded. AnalyticsInit sits in the root
 * layout, so a pageview fired on every load — before the age gate, before a
 * reader had agreed to anything — from any browser at all. That included:
 *
 *   - the author's own machine, every time he opened his own site
 *   - `npm run dev` on localhost, because the GA id used to carry a hardcoded
 *     default and fired with no environment variable set at all (GA is gone now)
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
  // Chrome sets navigator.webdriver under WebDriver-protocol automation —
  // Playwright, Puppeteer, Selenium. Cheap to check and never set for a person.
  //
  // It does NOT catch an assistant driving the browser through an extension.
  // Measured 28 August in Claude in Chrome: navigator.webdriver === false, and
  // the user agent is an ordinary Chrome string. The first version of this
  // comment claimed otherwise and was wrong.
  //
  // That turns out not to matter, because an extension-driven assistant IS the
  // author's own browser, on the author's own profile and network. There is no
  // separate traffic to detect: whatever excludes the author excludes it too.
  // The durable exclusion is the project-level filter in PostHog (author's home
  // /64, the AT&T range, the VPN exits, and any host that is not production),
  // set 28 August. This function is the cheap first line, not the guarantee.
  if (navigator.webdriver) return "browser automation";
  // A standing per-device opt-out. Set it on any device, phone included, by
  // visiting any page with ?analytics=off — see below.
  if (cookie(OPT_OUT_COOKIE) === "1") return "opted out on this device";
  try {
    if (localStorage.getItem(OPT_OUT) === "1") return "opted out on this device";
  } catch {
    // Private mode denies storage. Not knowing is not a reason to skip somebody.
  }
  return null;
}

const OPT_OUT = "is:no-analytics";
/**
 * The same opt-out as a cookie.
 *
 * localStorage alone was fragile in two ways: clearing site data silently
 * re-enrolls the device, and a SERVER route cannot read it — which is how the
 * download counter counted its own author for a month. Both flags are written
 * and either one is honoured.
 */
const OPT_OUT_COOKIE = "is_no_analytics";
const AUTHOR_COOKIE = "is_author";

function cookie(name: string): string | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Ten years, path-wide, lax: a standing preference rather than a session. */
function setCookie(name: string, value: string, maxAge = 315360000) {
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch {
    /* no-op */
  }
}

/** ?analytics=off stops counting this device for good; ?analytics=on resumes. */
function applyOptOutParam() {
  try {
    const v = new URLSearchParams(location.search).get("analytics");
    if (v === "off") {
      localStorage.setItem(OPT_OUT, "1");
      setCookie(OPT_OUT_COOKIE, "1");
    } else if (v === "on") {
      localStorage.removeItem(OPT_OUT);
      setCookie(OPT_OUT_COOKIE, "", 0);
    }
  } catch {
    /* no-op */
  }
}

/**
 * ?author=1 marks this device as the author's, ?author=0 unmarks it.
 *
 * A cookie rather than localStorage, because the server routes are what write the
 * rows and a server cannot read localStorage. Ten years, lax, path-wide: this is
 * a preference, not a session.
 *
 * What it does NOT do is stop anything being recorded. Rows still arrive, marked,
 * so the write path can be tested by the one person who can test it; the public
 * views exclude them. ?analytics=off remains the full opt-out.
 */
function applyAuthorParam() {
  try {
    const v = new URLSearchParams(location.search).get("author");
    if (v === "1") {
      setCookie(AUTHOR_COOKIE, "1");
      console.info("[analytics] this device is marked as the author — its rows stay out of public numbers");
    } else if (v === "0") {
      setCookie(AUTHOR_COOKIE, "", 0);
      console.info("[analytics] author marking removed from this device");
    }
  } catch {
    /* no-op */
  }
}

/** Set once excluded, so track() stays silent too rather than half-reporting. */
let disabled = false;

export function initAnalytics() {
  if (inited || typeof window === "undefined") return;
  applyOptOutParam();
  applyAuthorParam();
  const why = excluded();
  if (why) {
    // Say so out loud. A silent exclusion is how a metric quietly becomes wrong
    // in the other direction, and nobody notices that either.
    console.info(`[analytics] not counting this visit — ${why}`);
    disabled = true;
    inited = true;
    // Belt and braces: PostHog's own opt-out persists in its storage and also
    // stops session replay, which the localStorage flag alone does not. Safe to
    // call before init — posthog-js records the preference and honours it.
    if (KEY) {
      try {
        posthog.opt_out_capturing();
      } catch {
        /* no-op */
      }
    }
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
  initVercelAnalytics();

  // The author marker rides on every event from a marked device. This is the
  // backstop for the leak the audit found: an author session from a network the
  // IP filter does not know about — a hotel, a hotspot, a new VPN exit — used to
  // count as a reader. A cookie follows the device instead of the address, and
  // the project's internal-traffic filter now excludes `is_author`.
  if (cookie(AUTHOR_COOKIE) === "1") {
    registerVisitorProps({ is_author: true });
    console.info("[analytics] marked as the author — excluded from reported numbers");
  }

  inited = true;
}

/**
 * Whether this visit is being counted at all.
 *
 * Exported so other loggers (lib/gate-log.ts) can honour the same exclusions —
 * local development, browser automation, and the standing ?analytics=off
 * opt-out — by asking rather than by repeating the test, which is how two
 * copies of a rule drift apart. Reads false before initAnalytics() has run.
 */
export function isCounting(): boolean {
  return inited && !disabled;
}

/**
 * Attach a property to EVERY subsequent event this session, in PostHog and GA.
 *
 * This is how the gate's optional "who is reading" answer becomes useful: the
 * count itself means little (the professionals least likely to answer honestly
 * are precisely the ones worth knowing about), but a super property turns every
 * later funnel and page metric into a segmentable one.
 *
 * Super properties, NOT a person property: PostHog runs here with
 * `person_profiles: "identified_only"`, so a person property would not stick —
 * and identifying a reader of this archive is exactly what we will not do.
 * Nothing here is written to a profile and nothing is written to storage we own.
 */
export function registerVisitorProps(props: Record<string, unknown>) {
  if (typeof window === "undefined" || disabled) return;
  if (KEY) {
    try {
      posthog.register(props);
    } catch {
      /* no-op */
    }
  }
}

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
}

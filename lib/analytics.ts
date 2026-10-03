import posthog from "posthog-js";

let inited = false;
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/**
 * RESTORED 28 September 2026, at Sean's instruction, after I removed it on the 26th
 * without being asked to. The removal commit was a206fce; the reasoning I gave then
 * is in decision 0001 and one of its planks does not survive scrutiny — "an archive
 * about being watched loading an advertising vendor's tag" is exactly the conflation
 * of page views with the archive's subject that Sean corrected the following day.
 *
 * The falsy-default id is deliberate and is how this behaved before: there is no
 * NEXT_PUBLIC_GA_ID in Vercel, so without it GA would be silently absent in
 * production. It is safe here because initAnalytics() only reaches this after the
 * exclusion check, so localhost, automation and opted-out devices never load it.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-VXMCM15XTH";

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

function initGoogleAnalytics() {
  if (!GA_ID || typeof window === "undefined") return;
  const w = window as unknown as { gtag?: unknown };
  if (w.gtag) return; // already loaded
  const loader = document.createElement("script");
  loader.async = true;
  loader.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(loader);
  const inline = document.createElement("script");
  inline.innerHTML =
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" +
    GA_ID +
    "');";
  document.head.appendChild(inline);
}

/**
 * GOOGLE ANALYTICS WAS REMOVED on 26 September and RESTORED on the 28th.
 *
 * The removal was mine and Sean did not ask for it. He asked whether GA was wired
 * up; I checked, found it live, and took it out in the same commit that rebuilt
 * /insights (a206fce). That was a product decision dressed up as tidying.
 *
 * Two of the reasons I gave still hold and are worth knowing:
 *   - GA is BLIND to two things PostHog sees. The gate's role answer never reached
 *     it, because no custom dimension was ever registered for it; and the corpus
 *     download is captured server-side from /api/corpus, which GA cannot receive.
 *   - GA HAS NO AUTHOR EXCLUSION. PostHog's project-level internal-traffic filter
 *     is what makes 141 sessions read as 22. GA has no equivalent, so its numbers
 *     count the author, previews and development traffic silently. This is the
 *     whole of the discrepancy Sean found between the two dashboards; neither tool
 *     is wrong. registerVisitorProps now sends is_author to GA as a user property
 *     so the same exclusion can be rebuilt there as an audience or report filter.
 *
 * One reason I gave does NOT hold: that an archive about being watched should not
 * load an advertising vendor's tag. That is the conflation of ordinary page-view
 * counting with the archive's subject matter that Sean corrected the next day, and
 * it should not have been an argument for removing anything.
 *
 * GA's EEA/UK consent obligation is real and unchanged. It has not bitten because
 * there have been no EU visitors. It becomes live the day there are.
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

type Gtag = (command: string, event: string, params?: Record<string, unknown>) => void;

/** Set once excluded, so track() stays silent too rather than half-reporting. */
let disabled = false;

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
 * Read and write the standing per-device opt-out.
 *
 * Exported because the control on /insights is the only opt-out the site offers
 * a reader who is not typing query strings, and it must not keep its own copy of
 * the rule. It used to: the dialog wrote the cookie and the localStorage key
 * itself, which is two copies of a preference that `excluded()` above reads a
 * third way, and the comment on isCounting() already says what happens to rules
 * kept in two places.
 *
 * setDeviceOptOut also tells posthog-js immediately rather than waiting for the
 * next page load. Without that call the dialog said "nothing about your visits
 * is recorded" while the already-initialised instance carried on capturing the
 * rest of the page. The cheapest way to make a privacy control honest is for it
 * to be true at the moment it is clicked.
 */
export function readDeviceOptOut(): boolean {
  if (typeof window === "undefined") return false;
  if (cookie(OPT_OUT_COOKIE) === "1") return true;
  try {
    return localStorage.getItem(OPT_OUT) === "1";
  } catch {
    return false;
  }
}

export function setDeviceOptOut(next: boolean) {
  if (typeof window === "undefined") return;
  setCookie(OPT_OUT_COOKIE, next ? "1" : "", next ? undefined : 0);
  try {
    if (next) localStorage.setItem(OPT_OUT, "1");
    else localStorage.removeItem(OPT_OUT);
  } catch {
    /* no-op */
  }
  disabled = next;
  if (KEY) {
    try {
      if (next) posthog.opt_out_capturing();
      else posthog.opt_in_capturing();
    } catch {
      /* no-op */
    }
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
    // Belt and braces: PostHog's own opt-out persists in its own storage, so it
    // survives a later init that this early return skips. Safe to call before
    // init — posthog-js records the preference and honours it. This used to be
    // justified by replay, which the localStorage flag alone could not stop;
    // replay is off now, and the call is kept because two independent records of
    // the same refusal is the right number for a refusal.
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
      // "history_change", not true (3 Oct 2026). The site is a single-page app:
      // moving between sections changes the address without reloading, and
      // `true` counts only full page loads. PostHog was therefore missing most
      // page views that Google Analytics, whose enhanced measurement counts
      // address changes by default, was recording. This is part of why GA read
      // so much higher; the rest is the internal-traffic filter, by design.
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
      // Session replay is off, deliberately, and this line is the reason it
      // stays off. The PostHog project setting is also off (26 Sep 2026), but a
      // project setting is a checkbox someone can tick in a browser months from
      // now without reading anything; this is in the repo, where changing it is
      // a commit. Replay is the one measurement on this site that records what a
      // reader did rather than which page they opened, and the archive is read
      // by people who have reason to care about that difference. If it ever goes
      // back on it needs consent asked for first, which the site does not ask
      // for, because nothing here currently needs it.
      disable_session_recording: true,
    });
  }
  initVercelAnalytics();
  initGoogleAnalytics();

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
  // GA carries is_author too, so the author can be segmented out in GA4 with an
  // audience or a report filter. GA has no equivalent of PostHog's project-level
  // internal-traffic filter, so without this its numbers count the author silently.
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("set", "user_properties", props);
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
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", event, props);
}

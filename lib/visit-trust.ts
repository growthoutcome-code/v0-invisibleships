/**
 * Was this visit actually from the place it appears to be from?
 *
 * THE MECHANISM, because it is not obvious and the whole file depends on it:
 * PostHog records two independent location signals on every page view.
 *
 *   $geoip_time_zone  — derived from the IP address. Where the NETWORK exits.
 *   $timezone         — reported by the browser, from the device's own OS clock.
 *                       Where the DEVICE is.
 *
 * A VPN changes the first and not the second. So when they disagree across zones,
 * the city PostHog reports is a relay's, not a reader's.
 *
 * Measured on this project's own 470 page views (27 Sep 2026): Ypsilanti 75, Los
 * Angeles 24, Belleville 21, Chicago 17 and Miami 5 all reported a browser timezone
 * of America/Denver — one Denver device behind exits elsewhere. The "engaged Los
 * Angeles reader" reported in earlier sessions was the author on a VPN. Without this
 * check the dashboard would have kept saying otherwise.
 *
 * WHAT THIS CANNOT DO, stated because it bounds every label below:
 *
 *   - It cannot recover the real city behind a relay. Nothing can, from a request.
 *     For a relayed visit the honest answer is the device's TIME ZONE, which is
 *     coarser than a city and true, rather than a city which is precise and false.
 *   - It only catches relays that CROSS a time zone. VPN clients default to the
 *     nearest server, which usually lands in the user's own zone — so agreement is
 *     corroboration, never proof. Closing that gap needs network (ASN) data and is
 *     deliberately not this file's job.
 *   - The browser clock is self-reported and can be changed.
 *
 * It follows that `confirmed` is the only value that may be read as a statement
 * about where a person was, and it is deliberately hard to earn.
 */

/** A visit's trustworthiness, in the four words the page uses. */
export type Confidence = "confirmed" | "probable" | "relay" | "automated" | "unknown";

/** The raw signals, exactly as PostHog stores them. Any may be missing. */
export type VisitSignals = {
  city: string | null;
  country: string | null;
  region: string | null;
  /** $geoip_time_zone — from the IP. */
  ipTimeZone: string | null;
  /** $timezone — from the browser. */
  browserTimeZone: string | null;
  /** $geoip_accuracy_radius, in km. */
  accuracyKm: number | null;
};

export type VisitTrust = {
  confidence: Confidence;
  /** What the page prints. A place when one can be stood behind, a zone when not. */
  place: string;
  /** One line of plain English, for the audit view behind the measurement link. */
  why: string;
};

/**
 * Above this many km the city is a guess even with nothing relaying.
 * PostHog reports 20 for a typical fixed line and 200+ for mobile or a carrier
 * pool — 200 km covers most of a US state, which is not a city.
 */
const PRECISE_KM = 50;

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "Confirmed",
  probable: "Probable",
  relay: "Relay detected",
  automated: "Automated",
  unknown: "Unknown",
};

/**
 * A time zone rendered for a human: "America/Denver" becomes "US Mountain time".
 *
 * Deliberately NOT turned into a city. Converting America/Denver to "Denver" for a
 * relayed visit would re-invent exactly the precision the relay removed, which is
 * the mistake this whole module exists to avoid.
 */
const ZONE_NAMES: Record<string, string> = {
  "America/New_York": "US Eastern time",
  "America/Detroit": "US Eastern time",
  "America/Chicago": "US Central time",
  "America/Denver": "US Mountain time",
  "America/Phoenix": "US Mountain time (no DST)",
  "America/Los_Angeles": "US Pacific time",
  "America/Anchorage": "US Alaska time",
  "Pacific/Honolulu": "Hawaii time",
  "Europe/London": "UK time",
  UTC: "UTC",
};

export function zoneLabel(tz: string | null): string {
  if (!tz) return "an unknown time zone";
  return ZONE_NAMES[tz] ?? tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

/** "Denver, Colorado, US" from the parts that are actually present. */
function placeName(s: VisitSignals): string | null {
  const parts = [s.city, s.region, s.country].filter(
    (p): p is string => Boolean(p) && p !== "Unknown",
  );
  return parts.length ? Array.from(new Set(parts)).join(", ") : null;
}

export function classifyVisit(s: VisitSignals): VisitTrust {
  const place = placeName(s);

  // No browser clock means the strongest signal is absent. Never guess upward.
  if (!s.browserTimeZone || !s.ipTimeZone) {
    return {
      confidence: "unknown",
      place: place ? `${place} (unverified)` : "Unknown",
      why: "The browser did not report a time zone, so the location could not be corroborated.",
    };
  }

  // A UTC browser clock on a non-UTC network is the headless-browser default.
  //
  // CAVEAT WORTH KEEPING IN VIEW: Tor Browser and hardened Firefox also report UTC
  // deliberately, to defeat fingerprinting — and on this site those are plausibly
  // real readers rather than crawlers. Time zones alone cannot separate the two;
  // only network data can, by recognising a Tor exit. Until that exists this label
  // reads "Automated", which will be wrong for some genuine readers. That is a known
  // inaccuracy, recorded rather than hidden.
  if (s.browserTimeZone === "UTC" && s.ipTimeZone !== "UTC") {
    return {
      confidence: "automated",
      place: "Unknown",
      why: "The browser reported UTC, which is the default for headless browsers used by crawlers. Some privacy-hardened browsers also report UTC, so a real reader can land here.",
    };
  }

  // The finding. Two clocks in different zones: the IP is not where the device is.
  if (s.ipTimeZone !== s.browserTimeZone) {
    return {
      confidence: "relay",
      place: `${zoneLabel(s.browserTimeZone)} — city masked`,
      why: place
        ? `The address places this visit in ${place}, but the device's own clock is set to ${zoneLabel(s.browserTimeZone)}. A VPN or proxy changes the address and not the clock, so the reported city belongs to the relay. The time zone is what can be stood behind.`
        : `The address and the device's clock disagree, so the reported location belongs to a relay rather than the reader.`,
    };
  }

  // Clocks agree. Now precision decides whether a city may be named.
  const precise = s.accuracyKm !== null && s.accuracyKm <= PRECISE_KM;
  if (!place) {
    return {
      confidence: "unknown",
      place: "Unknown",
      why: "The clocks agree, but no place was resolved from the address.",
    };
  }
  if (!precise) {
    return {
      confidence: "probable",
      place: `${place} (approximate)`,
      why: `The device's clock agrees with the address, so nothing appears to be relaying. The address resolves only to about ${
        s.accuracyKm === null ? "an unknown radius" : `${Math.round(s.accuracyKm)} km`
      }, which is a region rather than a city.`,
    };
  }
  return {
    confidence: "confirmed",
    place,
    why: `The device's clock agrees with the address and the address resolves to about ${Math.round(
      s.accuracyKm as number,
    )} km, so the visit came from this place. Note this detects relays that cross a time zone; a VPN exit inside the reader's own zone would still look like this.`,
  };
}

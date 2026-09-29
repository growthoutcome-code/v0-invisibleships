/**
 * Which analytics tool the /insights page is showing.
 *
 * A PLAIN MODULE, NOT A CLIENT ONE, and that is the whole reason this file exists.
 * These lived in components/InsightsControls.tsx, which carries "use client". Next
 * replaces a client module's exports with client references across the server
 * boundary, so the type imported fine — types are erased — and the *function* did not:
 * the page threw "toSource is not a function" at request time, after `tsc --noEmit`
 * had passed clean. A shared constant used on both sides of the boundary belongs in a
 * module that takes no side.
 *
 * GOOGLE FIRST AND BY DEFAULT, and there is no "Both". Sean, 28 September: "we cannot
 * have a two-line chart that says both... let's lead with Google Analytics in the tabs,
 * and then PostHog separate." The two-line version invited a comparison the numbers do
 * not support — GA reports several times PostHog's figure, and almost all of that gap
 * is the author rather than a dispute about arithmetic.
 *
 * This leads with the LESS accurate number, deliberately. GA cannot exclude the author:
 * its Data API cannot read our author cookie, and its internal-traffic filter works on
 * IP addresses, which a rotating VPN exit defeats. It leads anyway because it will not
 * silently drop real readers the way an over-eager filter can, and because it is the
 * figure anyone else will quote back. The cost is paid in captions: every GA number
 * that includes the author says so where it is shown, since there is no longer a
 * page-level line saying it once.
 *
 * "Google" rather than "Google Analytics" is Sean's wording, and short enough to sit
 * beside "PostHog" without the tab row wrapping on a phone.
 */
export const SOURCES = [
  { key: "ga", label: "Google" },
  { key: "posthog", label: "PostHog" },
] as const;

export type SourceKey = (typeof SOURCES)[number]["key"];

/** Shown when ?source is absent, unrecognised, or a retired value like the old `both`. */
export const DEFAULT_SOURCE: SourceKey = "ga";

export function toSource(raw?: string): SourceKey {
  return SOURCES.some((s) => s.key === raw) ? (raw as SourceKey) : DEFAULT_SOURCE;
}

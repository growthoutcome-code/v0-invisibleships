import { DISCLAIMER_STANDING, DISCLAIMER_TITLE } from "@/lib/disclaimer";
import DisclaimerLink from "@/components/DisclaimerLink";

/**
 * The standing notice, under every page of content.
 *
 * WHY EVERY PAGE AND NOT JUST THE GATE. The gate is met on a first visit and
 * then once every 30 days (lib/gate.ts), and only by somebody who arrives at the site. Most readers of a
 * journal entry will arrive at that entry — 438 of them are in the sitemap and
 * every one is a shareable URL. Before this, a person landing on a transcript
 * from a search result or a forwarded link read a verbatim recording with names
 * in it and met no disclaimer at all unless they scrolled to the footer and
 * chose to open a dialog.
 *
 * Sean, 19 September: "it's so important for the visitor of the website to
 * understand this."
 *
 * The words come from lib/disclaimer.ts, which is also what the corpus footer is
 * built from, so a file lifted out of the download and this page say the same
 * thing. The full text stays one click away rather than inline: the short form
 * is what a reader will actually read, and a wall of terms under every entry
 * gets scrolled past, which is how a disclaimer stops working.
 *
 * Quiet by design — small, muted, ruled off above. It is a condition on the
 * page, not an interruption of it.
 */
export default function StandingDisclaimer({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label={DISCLAIMER_TITLE}
      className={`mx-auto max-w-3xl border-t border-edge px-5 py-6 text-[13px] leading-relaxed text-muted sm:px-6 ${className}`}
    >
      <p className="m-0">
        <span className="font-display uppercase tracking-[0.14em] text-[11px] text-muted">
          {DISCLAIMER_TITLE}
        </span>
        <br />
        {DISCLAIMER_STANDING}{" "}
        <DisclaimerLink from="standing">Read the full disclaimer</DisclaimerLink>.
      </p>
    </aside>
  );
}

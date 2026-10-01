"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import CardShare from "@/components/CardShare";

/**
 * One concept tile, as the Concepts page shows it (ConceptsView.tsx), and as the
 * Concepts bottom section shows it two across (Sean, 1 Oct 2026: "use 2 up cards
 * from the concepts page in the concepts bottom section carousel… make the cards
 * square and include some top and bottom negative space").
 *
 * One component for both, so the bottom cards cannot drift from the page's.
 * Takes plain strings rather than a Concept, so the bottom sections can send the
 * few fields a tile needs instead of shipping the whole register to every page.
 */
export type ConceptTileData = {
  id: string;
  /** Position in the register, shown as "01". */
  n: number;
  origin: string;   // ORIGIN_LABEL, already resolved
  basis: string;    // BASIS_LABEL, already resolved
  title: string;
  body: string;
  topics: string[]; // THEMES labels, already resolved, at most three
};

export default function ConceptTile({ c, from, square = false, onOpen }: {
  c: ConceptTileData;
  /** For the concept_opened event: "tile" on the Concepts page. */
  from: string;
  /**
   * A fixed card with the text filling it (Sean, 1 Oct 2026: "use the full width
   * of the page and increase the amount of text to fill the square"; then "they
   * can be rectangular"). 3:2 from tablet up, a fixed 480px on a phone, where a
   * square left room for two lines under a long title. The body
   * takes whatever height the square has left after the labels, title and
   * topics, and is clamped to the whole lines that fit, so it ends on an
   * ellipsis rather than a cut line, at any width. The bottom carousel uses
   * this; the Concepts page grid does not, because there the tiles size to
   * their row.
   */
  square?: boolean;
  onOpen?: () => void;
}) {
  const roomRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  // Fit the body to the card: measure the room it has, then clamp to the whole
  // lines that fit AND cap its height at exactly those lines. The cap matters:
  // with the clamp alone, the top of the next line showed under the ellipsis.
  useLayoutEffect(() => {
    const room = roomRef.current, el = bodyRef.current;
    if (!square || !room || !el) return;
    const fit = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 26;
      const n = Math.max(2, Math.floor(room.clientHeight / lh));
      el.style.webkitLineClamp = String(n);
      el.style.maxHeight = `${n * lh}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(room);
    return () => ro.disconnect();
  }, [square]);
  return (
    <div className="relative flex h-full w-full">
      <Link href={`/concepts/${c.id}`}
        onClick={() => { track("concept_opened", { id: c.id, from }); onOpen?.(); }}
        className={`group flex flex-col w-full border border-edge p-6 pr-14 hover:border-foreground transition-colors ${
          square ? "h-[480px] md:h-auto md:aspect-[3/2] md:p-8 md:pr-16" : ""}`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-4">
          <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted tabular-nums">
            {String(c.n).padStart(2, "0")}
          </span>
          <span className="text-[12px] uppercase tracking-[0.08em] font-semibold text-background bg-foreground px-2 py-0.5">
            {c.origin}
          </span>
          <span className="text-[12px] uppercase tracking-[0.08em] font-semibold text-foreground">
            {c.basis}
          </span>
        </div>
        <h3 className="font-display font-semibold text-foreground text-[22px] md:text-[24px] leading-tight mb-3 group-hover:underline underline-offset-4">
          {c.title}
        </h3>
        {square ? (
          <div ref={roomRef} className="mb-5 min-h-0 flex-1 overflow-hidden">
            <p ref={bodyRef}
              className="m-0 overflow-hidden text-[17px] leading-[1.55] text-foreground/80"
              style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 6 }}>
              {c.body}
            </p>
          </div>
        ) : (
          <p className="text-[17px] leading-[1.55] text-foreground/80 line-clamp-3 m-0 mb-5">{c.body}</p>
        )}
        {/* Pinned to the bottom of the tile, in both forms. */}
        <div className={`mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.06em] text-muted`}>
          {c.topics.map((t) => <span key={t}>{t}</span>)}
          <span className="ml-auto normal-case tracking-normal text-[14px] text-foreground">Read &rarr;</span>
        </div>
      </Link>
      <CardShare title={c.title} path={`/concepts/${c.id}`} className="absolute top-3 right-3" />
    </div>
  );
}

"use client";

/**
 * The indeterminate processing state.
 *
 * Sean, 10 September: "we need a processing state for loading the corpus...
 * an indeterminate processing state that we can use that is desktop and mobile
 * friendly." Then 15 September, after a 3px sweep bar had been doing the job:
 * "let's come up with something that is really relevant to the body of work...
 * align it with the background motifs", and "we build all three in a randomizer
 * to select based on each page. It just grabs randomly which one."
 *
 * WHAT IT REPLACED, TWICE. First a line of grey text reading "Loading
 * corpus..." - static, indistinguishable from a page that had finished loading
 * and simply had nothing in it. Then a two-phase sweep bar, which moved but
 * said nothing about what was arriving.
 *
 * THREE DRAWINGS, ONE AT RANDOM. See the note in globals.css for what each one
 * is. They are cousins of the section motifs and hold the same rules - line
 * only, no fill, no colour - and break exactly one: motifs move on scroll,
 * driven by --motif-p, and a loader has nothing to scroll.
 *
 * WHY INDETERMINATE. The dataset is sixteen JSON shards fetched in parallel.
 * The browser cannot say how much is done, so a percentage would be invented.
 * Each drawing fills, holds, clears, restarts.
 *
 * WHY THE PICK HAPPENS IN AN EFFECT AND NOT IN RENDER. Math.random() during
 * render runs once on the server and again on the client, the two disagree, and
 * React throws a hydration mismatch. The effect runs after mount, which is also
 * when this component is on screen at all, so nothing flashes.
 *
 * ACCESSIBILITY. `role="status"` with `aria-live="polite"` announces the label
 * once without interrupting; the drawing is aria-hidden because it carries
 * nothing the label does not. Reduced motion freezes a composed mid-frame
 * rather than removing the drawing - the state must stay visible to a reader
 * who asked for less movement.
 *
 * MOBILE. Each drawing is one viewBox SVG with no fixed dimensions and
 * non-scaling strokes, so a 1.6px line stays 1.6px at 64px wide and at 400.
 * The wrapper caps width and centres; nothing here carries a pixel size.
 */
import { useEffect, useState } from "react";

/** The three drawings, as viewBox children. Kept here so the CSS stays generic. */
const DRAWINGS = {
  /* Six lines arrive from off-frame at one point. lattice, reversed. */
  converge: (
    <g>
      <path className="pstroke gx" pathLength="100" d="M 8 14 L 196 56" style={{ animationDelay: "0s" }} />
      <path className="pstroke gx" pathLength="100" d="M 8 34 L 196 56" style={{ animationDelay: ".11s" }} />
      <path className="pstroke gx" pathLength="100" d="M 8 52 L 196 56" style={{ animationDelay: ".22s" }} />
      <path className="pstroke gx" pathLength="100" d="M 8 68 L 196 56" style={{ animationDelay: ".33s" }} />
      <path className="pstroke gx" pathLength="100" d="M 8 86 L 196 56" style={{ animationDelay: ".44s" }} />
      <path className="pstroke gx" pathLength="100" d="M 8 102 L 196 56" style={{ animationDelay: ".55s" }} />
      <circle className="pring" cx="200" cy="56" r="11" style={{ animationDelay: ".55s" }} />
      <circle className="pdot" cx="200" cy="56" r="5" style={{ animationDelay: ".55s" }} />
    </g>
  ),

  /* A branch grows from the lower left and forks outward, stroke tapering. */
  branch: (
    <g>
      <line className="pstroke g0" pathLength="100" x1="22" y1="98" x2="72" y2="74" style={{ animationDelay: "0s" }} />
      <line className="pstroke g1" pathLength="100" x1="72" y1="74" x2="110" y2="44" style={{ animationDelay: ".34s" }} />
      <line className="pstroke g1" pathLength="100" x1="72" y1="74" x2="118" y2="84" style={{ animationDelay: ".34s" }} />
      <line className="pstroke g2" pathLength="100" x1="110" y1="44" x2="152" y2="20" style={{ animationDelay: ".68s" }} />
      <line className="pstroke g2" pathLength="100" x1="110" y1="44" x2="160" y2="52" style={{ animationDelay: ".68s" }} />
      <line className="pstroke g2" pathLength="100" x1="118" y1="84" x2="168" y2="96" style={{ animationDelay: ".68s" }} />
      <line className="pstroke g2" pathLength="100" x1="118" y1="84" x2="176" y2="70" style={{ animationDelay: ".68s" }} />
      <line className="pstroke g3" pathLength="100" x1="152" y1="20" x2="204" y2="10" style={{ animationDelay: "1.02s" }} />
      <line className="pstroke g3" pathLength="100" x1="160" y1="52" x2="212" y2="44" style={{ animationDelay: "1.02s" }} />
      <line className="pstroke g3" pathLength="100" x1="176" y1="70" x2="222" y2="64" style={{ animationDelay: "1.02s" }} />
      <line className="pstroke g3" pathLength="100" x1="168" y1="96" x2="216" y2="100" style={{ animationDelay: "1.02s" }} />
      {/* The called-out node sits a generation past the fork, at the centre of
          the spread - the growth happens around it rather than from it. */}
      <circle className="pring" cx="160" cy="52" r="11" style={{ animationDelay: ".68s" }} />
      <circle className="pdot" cx="22" cy="98" r="2.4" style={{ animationDelay: "0s" }} />
      <circle className="pdot" cx="72" cy="74" r="2.8" style={{ animationDelay: "0s" }} />
      <circle className="pdot" cx="110" cy="44" r="2.6" style={{ animationDelay: ".34s" }} />
      <circle className="pdot" cx="118" cy="84" r="2.6" style={{ animationDelay: ".34s" }} />
      <circle className="pdot" cx="152" cy="20" r="2.2" style={{ animationDelay: ".68s" }} />
      <circle className="pdot" cx="160" cy="52" r="4.8" style={{ animationDelay: ".68s" }} />
      <circle className="pdot" cx="168" cy="96" r="2.2" style={{ animationDelay: ".68s" }} />
      <circle className="pdot" cx="176" cy="70" r="2.2" style={{ animationDelay: ".68s" }} />
      <circle className="pdot" cx="204" cy="10" r="1.9" style={{ animationDelay: "1.02s" }} />
      <circle className="pdot" cx="212" cy="44" r="1.9" style={{ animationDelay: "1.02s" }} />
      <circle className="pdot" cx="222" cy="64" r="1.9" style={{ animationDelay: "1.02s" }} />
      <circle className="pdot" cx="216" cy="100" r="1.9" style={{ animationDelay: "1.02s" }} />
    </g>
  ),

  /* A signal threads the network one edge at a time, left to right. */
  lattice: (
    <g>
      <line className="pstroke gx" pathLength="100" x1="16" y1="56" x2="86" y2="56" style={{ animationDelay: "0s" }} />
      <line className="pstroke gx" pathLength="100" x1="86" y1="56" x2="150" y2="24" style={{ animationDelay: ".16s" }} />
      <line className="pstroke gx" pathLength="100" x1="150" y1="24" x2="212" y2="12" style={{ animationDelay: ".32s" }} />
      <line className="pstroke gx" pathLength="100" x1="86" y1="56" x2="150" y2="56" style={{ animationDelay: ".48s" }} />
      <line className="pstroke gx" pathLength="100" x1="150" y1="56" x2="212" y2="46" style={{ animationDelay: ".64s" }} />
      <line className="pstroke gx" pathLength="100" x1="86" y1="56" x2="150" y2="88" style={{ animationDelay: ".8s" }} />
      <line className="pstroke gx" pathLength="100" x1="150" y1="88" x2="212" y2="78" style={{ animationDelay: ".96s" }} />
      <line className="pstroke gx" pathLength="100" x1="150" y1="88" x2="212" y2="102" style={{ animationDelay: "1.12s" }} />
      <circle className="pdot" cx="16" cy="56" r="3.2" style={{ animationDelay: "0s" }} />
      <circle className="pdot" cx="86" cy="56" r="2.6" style={{ animationDelay: ".14s" }} />
      <circle className="pdot" cx="150" cy="24" r="2.2" style={{ animationDelay: ".3s" }} />
      <circle className="pdot" cx="150" cy="56" r="2.2" style={{ animationDelay: ".46s" }} />
      <circle className="pdot" cx="150" cy="88" r="2.2" style={{ animationDelay: ".78s" }} />
    </g>
  ),
} as const;

const NAMES = Object.keys(DRAWINGS) as (keyof typeof DRAWINGS)[];

export default function Processing({
  label = "Loading the corpus",
  /** `block` fills its column and centres; `inline` is for a narrow panel. */
  variant = "block",
  className = "",
}: {
  label?: string;
  variant?: "block" | "inline";
  className?: string;
}) {
  const inline = variant === "inline";

  // See the note above on why this is an effect. NAMES[0] renders on the server
  // and for the first client frame; the pick lands immediately after.
  const [pick, setPick] = useState<keyof typeof DRAWINGS>(NAMES[0]);
  useEffect(() => {
    setPick(NAMES[Math.floor(Math.random() * NAMES.length)]);
  }, []);

  return (
    <div role="status" aria-live="polite" className={`${inline ? "py-6" : "py-16"} ${className}`}>
      <div
        className={
          inline
            ? "max-w-[180px]"
            : "mx-auto w-full max-w-[min(280px,70vw)] px-5"
        }
      >
        <svg
          className="proc-svg text-foreground"
          viewBox="0 0 230 112"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {DRAWINGS[pick]}
        </svg>
        <p className={`m-0 mt-5 text-[15px] text-muted ${inline ? "" : "text-center"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}

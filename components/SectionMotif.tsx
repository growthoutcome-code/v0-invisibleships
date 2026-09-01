"use client";

/**
 * SectionMotif — the named, repeatable background motion for a site section.
 *
 * Sean, 1 September: "we need everything to move, and we need it to be
 * repeatable and named using tailwind CSS and shadcn. So I can tell you how to
 * use it. Where to use it?"
 *
 * So: one component, one prop. Every motif is a name. To put motion behind a
 * section you write motif="drift" on <SiteSection> and nothing else.
 *
 * HOW THE MOTION WORKS. There is no animation library and no keyframes. A
 * single CSS custom property, --motif-p, runs 0 → 1 as the section crosses the
 * viewport; every moving part is a Tailwind arbitrary value reading that one
 * number. Nothing moves on a timer, so nothing moves unless the reader scrolls.
 *
 * REDUCED MOTION. If the reader asks for less motion we pin --motif-p at 0.5
 * and never update it. Each motif then renders its mid-state — composed, still,
 * no special-case styling anywhere.
 *
 * WEIGHT. The drawings sit at 14% grey (18% on dark) and around 60% scale.
 * They are a wash behind the text, never a picture beside it. Per-path opacity
 * attributes are floored at 0.70 on purpose: container opacity MULTIPLIES with
 * per-element opacity, and lower values disappear entirely.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const MOTIFS = [
  "carry",
  "ledger",
  "drift",
  "lattice",
  "bloom",
  "room",
  "recede",
] as const;

export type MotifName = (typeof MOTIFS)[number];

/** What each name does, and the question it was drawn for. */
export const MOTIF_NOTES: Record<MotifName, { motion: string; use: string }> = {
  carry: {
    motion: "Arc wavefronts travel sideways at three rates.",
    use: "The journal. Sound leaving a source and crossing a street.",
  },
  ledger: {
    motion: "Columns grow from a baseline, staggered.",
    use: "Government cloud. Anything whose subject is money or volume.",
  },
  drift: {
    motion: "Two trend lines draw in from the left and pull apart as you scroll.",
    use: "The data section. Use it where the point is that two things diverge.",
  },
  lattice: {
    motion: "A signal leaves one node and branches outward, lighting each path in turn.",
    use: "Neurotechnology. Anything about capability, relay or reach.",
  },
  bloom: {
    motion: "Concentric arcs open outward from a low centre.",
    use: "The consented-future section. The one motif that opens rather than converges.",
  },
  room: {
    motion: "Three depth planes move at three rates — true parallax.",
    use: "Contribute. A place with a floor, a wall and a near edge.",
  },
  recede: {
    motion: "A floor plane drifts toward its vanishing point.",
    use: "Hero and long wash sections. The quietest of the seven.",
  },
};

/* --------------------------------------------------------------------------
   Progress: one number, written straight to the DOM node.
   -------------------------------------------------------------------------- */

function useMotifProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--motif-p", "0.5");
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || 1;
      const p = (h - r.top) / (h + r.height);
      el.style.setProperty("--motif-p", String(Math.min(1, Math.max(0, p))));
    };

    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", request, { passive: true });
          measure();
        } else {
          window.removeEventListener("scroll", request);
        }
      },
      { rootMargin: "160px 0px" },
    );

    io.observe(el);
    measure();
    window.addEventListener("resize", request, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

/* --------------------------------------------------------------------------
   The drawings. Every one is 1200 x 620 and slices to fill.
   -------------------------------------------------------------------------- */

const SVG =
  "h-full w-full [&_path]:[vector-effect:non-scaling-stroke] [&_circle]:[vector-effect:non-scaling-stroke] [&_rect]:[vector-effect:non-scaling-stroke]";

function Carry() {
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      className={cn(SVG, "origin-[0%_78%] scale-[0.60]")}
    >
      <g className="[transform:translateX(calc((var(--motif-p)_-_0.5)_*_44%))]">
        <path d="M-40 310 m 90 -60 a 60 60 0 0 1 0 120" />
        <path d="M-40 310 m 190 -104 a 104 104 0 0 1 0 208" opacity="0.80" />
      </g>
      <g className="[transform:translateX(calc((var(--motif-p)_-_0.5)_*_62%))]">
        <path d="M-40 310 m 320 -150 a 150 150 0 0 1 0 300" opacity="0.70" />
        <path d="M-40 310 m 470 -196 a 196 196 0 0 1 0 392" opacity="0.70" />
      </g>
      <g className="[transform:translateX(calc((var(--motif-p)_-_0.5)_*_84%))]">
        <path d="M-40 310 m 640 -244 a 244 244 0 0 1 0 488" opacity="0.70" />
        <path d="M-40 310 m 830 -292 a 292 292 0 0 1 0 584" opacity="0.70" />
      </g>
      <path d="M0 470 L1200 470" opacity="0.70" />
    </svg>
  );
}

function Recede() {
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden="true"
      className={cn(SVG, "origin-[50%_100%] scale-[0.58]")}
    >
      <g className="[transform-box:fill-box] origin-bottom [transform:scale(calc(1_+_var(--motif-p)_*_0.22))]">
        <path d="M600 40 L-120 600" />
        <path d="M600 40 L60 600" opacity="0.85" />
        <path d="M600 40 L260 600" opacity="0.70" />
        <path d="M600 40 L440 600" opacity="0.70" />
        <path d="M600 40 L600 600" opacity="0.70" />
        <path d="M600 40 L760 600" opacity="0.70" />
        <path d="M600 40 L940 600" opacity="0.70" />
        <path d="M600 40 L1140 600" opacity="0.85" />
        <path d="M600 40 L1320 600" />
        <path d="M-120 600 L1320 600" />
        <path d="M170 420 L1030 420" opacity="0.70" />
        <path d="M360 268 L840 268" opacity="0.70" />
        <path d="M470 168 L730 168" opacity="0.70" />
      </g>
    </svg>
  );
}

function Room() {
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      className={cn(SVG, "origin-[50%_50%] scale-[0.58]")}
    >
      <g className="[transform:translateY(calc(var(--motif-p)_*_-26px))]">
        <path d="M120 96 L740 40 L740 470" />
        <path d="M740 40 L1180 96" />
      </g>
      <g className="[transform:translateY(calc(var(--motif-p)_*_-54px))]">
        <path d="M740 470 L120 528" />
        <path d="M740 470 L1180 528" />
        <path d="M150 190 L520 168 L520 372 L150 356 Z" />
        <path d="M170 206 L502 186 L502 356 L170 342 Z" opacity="0.70" />
      </g>
      <g className="[transform:translateY(calc(var(--motif-p)_*_-92px))]">
        <path d="M96 428 L560 404 L560 462 L96 490 Z" />
        <path d="M330 416 L330 476" opacity="0.70" />
      </g>
    </svg>
  );
}

/**
 * DRIFT — "Is anything moving in the data?"
 *
 * The motif answers its own heading. Two trend lines draw in from the left as
 * the section rises, then pull apart from each other: one falling, one
 * climbing. It is the shape of the crime section's actual finding — recorded
 * crime down, enforcement arrests up — drawn rather than argued.
 */
function Drift() {
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      className={cn(SVG, "origin-[50%_50%] scale-[0.62]")}
    >
      {/* the plot floor and its tick field, arriving before the lines */}
      <g className="[opacity:calc(0.45_+_var(--motif-p)_*_0.55)]">
        <path d="M60 540 L1140 540" opacity="0.80" />
        <path d="M180 528 L180 552" opacity="0.70" />
        <path d="M360 528 L360 552" opacity="0.70" />
        <path d="M540 528 L540 552" opacity="0.70" />
        <path d="M720 528 L720 552" opacity="0.70" />
        <path d="M900 528 L900 552" opacity="0.70" />
        <path d="M1080 528 L1080 552" opacity="0.70" />
      </g>

      {/* falling series — draws, then settles downward */}
      <g className="[transform:translateY(calc(var(--motif-p)_*_20px))]">
        <path
          d="M80 190 C 300 252, 520 296, 760 356 S 1040 428, 1140 458"
          pathLength={1}
          strokeDasharray={1}
          className="[stroke-dashoffset:calc(1_-_min(1,var(--motif-p)_*_1.45))]"
        />
      </g>

      {/* climbing series — draws a beat later, then lifts away */}
      <g className="[transform:translateY(calc(var(--motif-p)_*_-24px))]">
        <path
          d="M80 472 C 320 456, 520 422, 760 330 S 1040 214, 1140 148"
          pathLength={1}
          strokeDasharray={1}
          opacity="0.85"
          className="[stroke-dashoffset:calc(1_-_min(1,max(0,var(--motif-p)_-_0.12)_*_1.7))]"
        />
      </g>

      {/* the gap between them, stated once */}
      <path
        d="M1108 168 L1108 438"
        opacity="0.70"
        pathLength={1}
        strokeDasharray={1}
        className="[stroke-dashoffset:calc(1_-_min(1,max(0,var(--motif-p)_-_0.55)_*_2.4))]"
      />
    </svg>
  );
}

/**
 * LATTICE — "What can the technology actually do?"
 *
 * A signal leaves a single node and branches outward, each order of branch
 * lighting after the one before it. Reach, drawn as reach. The terminals fade
 * up last so the eye lands at the right edge, where the copy begins.
 */
function Lattice() {
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      className={cn(SVG, "origin-[50%_50%] scale-[0.58]")}
    >
      <circle cx="170" cy="310" r="9" opacity="0.85" />

      {/* first order */}
      <g className="[stroke-dashoffset:calc(1_-_min(1,var(--motif-p)_*_2.1))]">
        <path d="M170 310 C 300 310, 340 220, 470 210" pathLength={1} strokeDasharray={1} />
        <path d="M170 310 C 300 310, 340 400, 470 415" pathLength={1} strokeDasharray={1} />
      </g>

      {/* second order */}
      <g
        opacity="0.85"
        className="[stroke-dashoffset:calc(1_-_min(1,max(0,var(--motif-p)_-_0.22)_*_2.1))]"
      >
        <path d="M470 210 C 600 200, 640 120, 790 110" pathLength={1} strokeDasharray={1} />
        <path d="M470 210 C 610 230, 660 290, 800 285" pathLength={1} strokeDasharray={1} />
        <path d="M470 415 C 600 400, 640 352, 790 345" pathLength={1} strokeDasharray={1} />
        <path d="M470 415 C 610 425, 650 500, 800 505" pathLength={1} strokeDasharray={1} />
      </g>

      {/* third order, out to the terminals */}
      <g
        opacity="0.70"
        className="[stroke-dashoffset:calc(1_-_min(1,max(0,var(--motif-p)_-_0.44)_*_2.4))]"
      >
        <path d="M790 110 L1010 92" pathLength={1} strokeDasharray={1} />
        <path d="M800 285 L1030 300" pathLength={1} strokeDasharray={1} />
        <path d="M790 345 L1010 358" pathLength={1} strokeDasharray={1} />
        <path d="M800 505 L1020 530" pathLength={1} strokeDasharray={1} />
      </g>

      <g className="[opacity:calc(max(0,var(--motif-p)_-_0.62)_*_2.4)]">
        <circle cx="1010" cy="92" r="5" />
        <circle cx="1030" cy="300" r="5" />
        <circle cx="1010" cy="358" r="5" />
        <circle cx="1020" cy="530" r="5" />
      </g>
    </svg>
  );
}

/**
 * LEDGER — "Who bought the systems, and for how much?"
 *
 * Columns grow from a baseline at staggered rates. Deliberately not a chart:
 * no axis, no labels, nothing a reader could mistake for a figure. The real
 * numbers are in the section, sourced.
 */
function Ledger() {
  const bars: Array<[number, number, number]> = [
    // x, height, rate
    [120, 120, 1.9],
    [260, 210, 1.6],
    [400, 96, 2.2],
    [540, 300, 1.4],
    [680, 164, 1.8],
    [820, 380, 1.25],
    [960, 244, 1.6],
  ];
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      className={cn(SVG, "origin-[50%_100%] scale-[0.60]")}
    >
      <path d="M60 540 L1140 540" opacity="0.80" />
      {bars.map(([x, h, rate], i) => (
        <rect
          key={x}
          x={x}
          y={540 - h}
          width={90}
          height={h}
          opacity={i % 2 === 0 ? "0.85" : "0.70"}
          className="[transform-box:fill-box] origin-bottom"
          style={{
            transform: `scaleY(calc(0.06 + min(1, var(--motif-p) * ${rate}) * 0.94))`,
          }}
        />
      ))}
    </svg>
  );
}

/**
 * BLOOM — "What would this technology be worth if people consented to it?"
 *
 * The one motif that opens. Recede converges on a vanishing point; this does
 * the opposite, and it is the only section on the page making a positive case.
 * The geometry should agree with the argument.
 */
function Bloom() {
  const arcs: Array<[number, number, string]> = [
    [120, 1.0, "0.85"],
    [200, 1.14, "0.80"],
    [290, 1.28, "0.75"],
    [390, 1.42, "0.70"],
    [500, 1.56, "0.70"],
    [620, 1.70, "0.70"],
  ];
  return (
    <svg
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className={cn(SVG, "origin-[50%_100%] scale-[0.60]")}
    >
      {arcs.map(([r, rate, op]) => (
        <path
          key={r}
          d={`M${600 - r} 560 A ${r} ${r} 0 0 1 ${600 + r} 560`}
          opacity={op}
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            transform: `scale(calc(0.82 + var(--motif-p) * ${0.3 * rate}))`,
          }}
        />
      ))}
      <path d="M60 560 L1140 560" opacity="0.80" />
    </svg>
  );
}

const ART: Record<MotifName, () => JSX.Element> = {
  carry: Carry,
  ledger: Ledger,
  drift: Drift,
  lattice: Lattice,
  bloom: Bloom,
  room: Room,
  recede: Recede,
};

/* --------------------------------------------------------------------------
   The component
   -------------------------------------------------------------------------- */

export default function SectionMotif({
  name,
  className,
}: {
  name: MotifName;
  className?: string;
}) {
  const ref = useMotifProgress<HTMLDivElement>();
  const Art = ART[name];

  return (
    <div
      ref={ref}
      data-motif={name}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 select-none overflow-hidden",
        "text-foreground opacity-[0.14] dark:opacity-[0.18]",
        "[--motif-p:0]",
        className,
      )}
    >
      <Art />
    </div>
  );
}

/** Wrap any block in a motif without touching SiteSection. */
export function MotifStage({
  name,
  className,
  children,
}: {
  name: MotifName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <SectionMotif name={name} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

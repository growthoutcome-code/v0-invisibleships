"use client";

import GateAnimation from "@/components/GateAnimation";
import { track } from "@/lib/analytics";
import { useEffect } from "react";

/**
 * Per-term glossary illustrations — a code registry keyed by slug, so terms can
 * gain artwork without schema changes. First entry: the homepage (gate)
 * animation, homed on "neuro-engagement" — the headset scene is that concept.
 *
 * When the animation renders as content (here) rather than decoration (the
 * gate), it carries a real image role + label. Reduced-motion handling lives
 * in globals.css (.gate-anim holds the final scene statically).
 */
const REGISTRY: Record<string, { alt: string }> = {
  "neuro-engagement": {
    alt: "Line-drawing scenes of a person wearing a head-mounted device in a living room, crossfading through the site's four opening illustrations.",
  },
};

export default function GlossaryIllustration({ slug }: { slug: string }) {
  const entry = REGISTRY[slug];
  useEffect(() => {
    if (entry) track("glossary_illustration_viewed", { slug });
  }, [slug, entry]);
  if (!entry) return null;
  return (
    <figure className="m-0 mb-8 mt-2" role="img" aria-label={entry.alt}>
      <div className="border border-edge rounded-xl overflow-hidden py-4 [&_.gate-anim]:mb-0 [&_.gate-anim]:max-w-none">
        <GateAnimation />
      </div>
      <figcaption className="text-muted text-[13px] mt-2">
        From the site&apos;s opening sequence.
      </figcaption>
    </figure>
  );
}

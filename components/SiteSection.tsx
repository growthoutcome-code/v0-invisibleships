/**
 * The repeatable home/section block.
 *
 * Sean, 30 August: "for each main navigation entry, we need sections in the
 * footer. Half of the page for each main navigation entry will be the main
 * navigation content, and then we're gonna inspire engagement by producing all
 * of these bottom sections… it makes sense to build a plan to build these
 * repeatable sections out."
 *
 * This is that unit. Every section on the home page is one of these, and the
 * same component will carry the engagement blocks under /journal, /data,
 * /concepts and /glossary — so a change to the shape happens once.
 *
 * THE SHAPE, fixed: eyebrow, a heading that is a sentence, one quiet line of
 * metrics, the content, then actions. No section carries its own caveats; each
 * gets a link to the disclaimer instead. Sean, same day: "hold back on the
 * protective language and lean on, depend on, and continuingly point to the
 * disclaimer."
 */
import type { ReactNode } from "react";

import SectionMotif, { type MotifName } from "@/components/SectionMotif";
import { cn } from "@/lib/utils";

export type Action = { href: string; label: string; primary?: boolean };

export default function SiteSection({
  id, eyebrow, heading, meta, actions = [], actionsExtra, aside, children, motif,
}: {
  id?: string;
  /**
   * Named background motion. One word, and the section moves.
   * See components/SectionMotif.tsx for the seven names and what each is for.
   */
  motif?: MotifName;
  eyebrow: string;
  /** A sentence, not a label. It has to carry its beat with the body hidden. */
  heading: ReactNode;
  /** One line of counts, derived. Optional. */
  meta?: ReactNode;
  actions?: Action[];
  /**
   * A control that lives in the actions row but is not a link — the corpus
   * download button, which has to open a dialog rather than navigate. Actions
   * are anchors by design and stay that way; this is the escape hatch for the
   * one case where the row needs a client component instead.
   */
  actionsExtra?: ReactNode;
  /** Sits beside the actions — usually the disclaimer modal trigger. */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("relative isolate overflow-hidden", id && "scroll-mt-24")}
    >
      {motif && <SectionMotif name={motif} />}
      {/* Sean, 5 September: "we don't need a ton of negative space, but we do
          need some top and bottom between each section." 80px each side was
          generous when sections were long essays; the journal section is now a
          quotation and a way in, and the gap was doing more work than the
          content between it. 56px on a phone, 72 from sm up. */}
      <div className="relative z-10 w-full px-5 py-16 sm:px-8 sm:py-20 lg:px-[200px]">
        {/* Sean, 5 September: "we've got the word journal in very small type… at
          least sixteen pixels on desktop." The eyebrow names the section and was
          set smaller than the meta line under the heading, which inverted the
          hierarchy — the label a reader uses to know where they are was the
          quietest thing in the block. */}
        {/* THE SECTION NAME, WITH PRESENCE (Sean, 8 September): "let's increase
            the presence of the name of the section… some kind of treatment to
            make it a little larger. You might include a rule next to it, like a
            short rule."

            The accent bar is not a new invention — it is the same `h-1.5 w-6
            bg-accent` marker the hero already uses above its stats line, so the
            front door and every section under it are speaking one language. */}
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-6 shrink-0 bg-accent" aria-hidden />
          <p className="m-0 font-display text-[20px] font-semibold uppercase tracking-[0.14em] text-foreground">
            {eyebrow}
          </p>
        </div>
        <h2 className="font-display m-0 mt-3 text-[26px] font-semibold leading-[1.25] text-foreground sm:text-[34px]">
          {heading}
        </h2>
        {meta && <p className="mt-4 text-[17px] text-muted">{meta}</p>}

        {children && <div className="mt-12">{children}</div>}

        {(actions.length > 0 || actionsExtra || aside) && (
          <div className="mt-12 flex flex-wrap items-center gap-4">
            {actions.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className={
                  a.primary
                    ? "inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[17px] font-medium text-background"
                    : "inline-flex h-12 items-center rounded-md bg-foreground/[0.07] px-6 text-[17px] hover:bg-foreground/[0.12]"
                }
              >
                {a.label}
              </a>
            ))}
            {actionsExtra}
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}

/** The figure-and-line unit used by every data section. */
export function Figure({
  stat, line, href, source,
}: {
  stat: string;
  line: string;
  href?: string;
  source?: { label: string; href: string };
}) {
  const inner = (
    <>
      <span className="font-display block text-4xl font-semibold text-foreground">{stat}</span>
      <span className="body-copy mt-3 block text-[18px] leading-relaxed text-foreground/80">
        {line}
      </span>
    </>
  );
  return (
    <div>
      {href ? (
        <a href={href} className="group block">
          {inner}
        </a>
      ) : (
        inner
      )}
      {source && (
        <a
          href={source.href}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-block text-[15px] text-muted underline underline-offset-4 hover:text-foreground"
        >
          {source.label}
        </a>
      )}
    </div>
  );
}

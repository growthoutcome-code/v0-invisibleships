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

export type Action = { href: string; label: string; primary?: boolean };

export default function SiteSection({
  id, eyebrow, heading, meta, actions = [], aside, children,
}: {
  id?: string;
  eyebrow: string;
  /** A sentence, not a label. It has to carry its beat with the body hidden. */
  heading: ReactNode;
  /** One line of counts, derived. Optional. */
  meta?: ReactNode;
  actions?: Action[];
  /** Sits beside the actions — usually the disclaimer modal trigger. */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} className={id ? "scroll-mt-24" : undefined}>
      <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
        <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </p>
        <h2 className="font-display m-0 mt-3 text-[26px] font-semibold leading-[1.25] text-foreground sm:text-[34px]">
          {heading}
        </h2>
        {meta && <p className="mt-4 text-[15px] text-muted">{meta}</p>}

        {children && <div className="mt-14">{children}</div>}

        {(actions.length > 0 || aside) && (
          <div className="mt-14 flex flex-wrap items-center gap-4">
            {actions.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className={
                  a.primary
                    ? "inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
                    : "inline-flex h-12 items-center rounded-md bg-foreground/[0.07] px-6 text-[15px] hover:bg-foreground/[0.12]"
                }
              >
                {a.label}
              </a>
            ))}
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
      <span className="body-copy mt-3 block text-[15px] leading-relaxed text-foreground/80">
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
          className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground"
        >
          {source.label}
        </a>
      )}
    </div>
  );
}

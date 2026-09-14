/**
 * The way out of a home page section, into the material behind it.
 *
 * Sean, 13 September: "all we need to do for that second bullhorn related
 * section is link to the relevant material. In the home page section, we don't
 * want to generate a bunch of text in this section, but we need to provide the
 * ability to tease out to both glossary and concepts."
 *
 * That is the whole brief, and it is a good one. The home page is a front door,
 * not a destination: every section should be able to hand a reader off to the
 * concept that argues the point and the vocabulary that defines it, WITHOUT
 * growing a paragraph to do it. A sentence explaining a link is a sentence the
 * link was supposed to replace.
 *
 * GROUPED BY KIND ON PURPOSE. Concepts and glossary terms are different things
 * in this archive — concepts are arguments, glossary entries are vocabulary —
 * and the labels teach that distinction by using it. A reader who learns here
 * that "Concepts" means the arguments will navigate the rest of the site
 * better for it.
 *
 * BUILT AS A UNIT because the remaining sections all need it. Government cloud,
 * public health, concepts, glossary and contribute each sit on material a
 * reader should be able to reach; this is the repeatable way to offer it, in
 * the same spirit as SiteSection itself.
 *
 * Mobile: the label sits above its row below `sm` and beside it from `sm` up,
 * and links wrap rather than scroll. Nothing here has a fixed width.
 */
export type RelatedGroup = {
  /** "Concepts", "Glossary" — the kind of thing, not a sentence. */
  label: string;
  links: { href: string; label: string }[];
};

export default function RelatedLinks({
  groups,
  className = "",
}: {
  groups: RelatedGroup[];
  className?: string;
}) {
  const shown = groups.filter((g) => g.links.length > 0);
  if (!shown.length) return null;

  return (
    <div className={`mt-12 border-t border-edge/60 pt-8 ${className}`}>
      <dl className="m-0 flex flex-col gap-5">
        {shown.map((g) => (
          <div
            key={g.label}
            className="flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-baseline"
          >
            <dt className="font-display shrink-0 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted sm:w-[104px]">
              {g.label}
            </dt>
            <dd className="m-0 flex flex-wrap items-baseline gap-x-5 gap-y-2">
              {g.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[17px] text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
                >
                  {l.label}
                </a>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

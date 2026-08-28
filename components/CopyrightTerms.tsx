// The site's single canonical disclaimer. Every other page points here rather
// than restating its own caution language (Sean, 2026-08-20: "one singular
// disclaimer", not 50% of the site).
//
// The WORDS are not here. They live in lib/terms.ts, because words that live
// only in a component cannot be exported, and the downloadable corpus was
// therefore shipping the August version of these terms while the site showed a
// different one — with seventy-five corpus files pointing readers at the stale
// copy. This file is now only the renderer. Edit lib/terms.ts and the site, the
// download and the guard all move together.
//
// Two variants, because this component serves two jobs:
//   "gate" — the consent screen. Only sections marked `gate: true`: what a
//            visitor is agreeing to before entering. Deliberately short; a
//            consent screen nobody finishes reading is worse than a brief one.
//   "full" — the /disclaimer page. Every section, including how the research
//            data was gathered, which is what the rest of the site links to.
import type { ReactNode } from "react";
import { TERMS, type TermsBlock } from "@/lib/terms";

// The inline markup subset lib/terms.ts documents: **bold**, *italic*, `code`,
// [label](href). Split on the alternation so the captured delimiters survive;
// bold is tried before italic so `**x**` never matches as `*`+`*x*`.
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, key: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      const k = `${key}-${i}`;
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*")) return <em key={k}>{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`")) return <code key={k}>{part.slice(1, -1)}</code>;
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) {
        const external = /^https?:/.test(link[2]);
        return (
          <a
            key={k}
            href={link[2]}
            className="underline underline-offset-4"
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
          >
            {link[1]}
          </a>
        );
      }
      return <span key={k}>{part}</span>;
    });
}

function Block({ block, first, id, i }: { block: TermsBlock; first: boolean; id: string; i: number }) {
  const key = `${id}-${i}`;
  switch (block.kind) {
    case "note":
      return <p className={`${first ? "mt-1" : "mt-2"} italic text-muted`}>{inline(block.text, key)}</p>;
    case "subhead":
      return <p className="mt-3 font-semibold text-foreground">{inline(block.text, key)}</p>;
    case "ul":
      return (
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {block.items.map((item, j) => (
            <li key={`${key}-${j}`}>{inline(item, `${key}-${j}`)}</li>
          ))}
        </ul>
      );
    default:
      return <p className={first ? "mt-1" : "mt-2"}>{inline(block.text, key)}</p>;
  }
}

export default function CopyrightTerms({ variant = "full" }: { variant?: "gate" | "full" | "modal" }) {
  const full = variant !== "gate";
  const showToc = variant === "full";
  const sections = TERMS.filter((s) => full || s.gate);
  return (
    <div className="space-y-5 body-copy text-foreground/90">
      {showToc && (
        <nav aria-label="On this page" className="text-[16px] text-muted">
          <ul className="list-none p-0 m-0 flex flex-wrap gap-x-5 gap-y-1">
            {sections
              .filter((s) => s.toc)
              .map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="underline underline-offset-4 hover:text-foreground">
                    {s.toc}
                  </a>
                </li>
              ))}
          </ul>
        </nav>
      )}

      {/* The most important thing on the page reads first — lib/terms.ts holds
          the order, and the Critical Disclaimer is deliberately at the top. */}
      {sections.map((s) => (
        <div key={s.id} id={s.id} className="scroll-mt-28">
          <div className="font-display text-foreground font-semibold text-lg">{s.heading}</div>
          {s.blocks.map((b, i) => (
            <Block key={`${s.id}-${i}`} block={b} first={i === 0} id={s.id} i={i} />
          ))}
        </div>
      ))}
    </div>
  );
}

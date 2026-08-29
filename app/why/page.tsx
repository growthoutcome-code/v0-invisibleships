import type { Metadata } from "next";
import { GATE } from "@/lib/gate-content";

/**
 * /why — the perceptual-set essay, on its own URL.
 *
 * This is the archive's account of its own name and its own premise, and it
 * spent its whole life on screen three of a four-screen gate: seen once by
 * people who were already inside, and impossible to send to anyone. It is
 * arguably the most useful page here for somebody who does not yet understand
 * what the project is claiming, which is exactly the person who could never
 * reach it.
 *
 * The words are unchanged and still come from lib/gate-content.ts, so the gate
 * and this page cannot drift apart.
 */
export const metadata: Metadata = {
  title: "Why “Invisible Ships” — perceptual set",
  description:
    "Perceptual set is a documented principle in cognitive psychology: expectation shapes what we perceive, and can keep us from registering something we have no concept for.",
  alternates: { canonical: "/why" },
};

export default function Page() {
  const p = GATE.perceptual;
  return (
    <>
      <header className="w-full px-5 sm:px-8 h-[72px] flex items-center gap-4 border-b border-edge">
        <a href="/" className="font-display font-semibold tracking-tight text-foreground text-lg">
          Invisible Ships
        </a>
        <a href="/concepts" className="ml-auto text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
          The concepts
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-14">
        <p className="text-[13px] uppercase tracking-[0.08em] text-muted m-0">{p.eyebrow}</p>
        <h1 className="font-display text-4xl font-semibold text-foreground mt-2 mb-8">{p.title}</h1>

        <div className="space-y-5 body-copy text-foreground/90 text-[17px] leading-relaxed">
          <p className="m-0">{p.definition}</p>
          <p className="m-0">{p.story}</p>
          {/* The caveat is the point, not a hedge: an archive that qualifies its
              own founding anecdote is telling you how it will treat everything
              else. It is emphasised here rather than buried. */}
          <p className="m-0 border-l-2 border-foreground pl-5 font-semibold text-foreground">
            {p.caveat}
          </p>
          <p className="m-0">{p.tie}</p>
        </div>

        <div className="mt-10 pt-8 border-t border-edge flex flex-wrap gap-4">
          <a href="/concepts"
             className="h-12 px-6 rounded-md bg-foreground text-background text-[15px] font-medium inline-flex items-center">
            Start with the questions
          </a>
          <a href="/data"
             className="h-12 px-6 rounded-md border border-edge hover:border-foreground text-[15px] inline-flex items-center">
            See the research
          </a>
        </div>
      </main>
    </>
  );
}

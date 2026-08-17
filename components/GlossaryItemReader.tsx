"use client";
// Standalone glossary-term page body (behind the gate). Mirrors the in-app
// term reader but with real <Link> navigation and its own shareable URL.
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import ItemHeader from "@/components/ItemHeader";
import Footer from "@/components/Footer";
import ShareMenu from "@/components/ShareMenu";
import { cleanTerm, splitDef } from "@/lib/glossary-format";
import GlossaryBody from "@/components/GlossaryBody";
import { track } from "@/lib/analytics";

type Nav = { slug: string; term: string };
type Props = {
  term: { slug: string; term: string; definition?: string };
  prev?: Nav;
  next?: Nav;
};

export default function GlossaryItemReader({ term, prev, next }: Props) {
  const { pron, body } = splitDef(term.definition);
  const name = cleanTerm(term.term);
  useEffect(() => { track("term_opened", { slug: term.slug, route: true }); }, [term.slug]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ItemHeader />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <article className="w-full">
          <div className="flex items-center justify-between mb-4">
            <Link href="/glossary" className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to glossary</Link>
            <ShareMenu title={`${name} — Invisible Ships`} align="right" />
          </div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted mb-2">Glossary</p>
          <h1 className="font-display text-[21px] font-semibold text-foreground mb-1 leading-tight term-title">{name}</h1>
          {pron && <div className="text-sm text-muted italic mb-5">{pron}</div>}
          <GlossaryBody text={body} />
          <div className="flex gap-3 mt-12 pt-6">
            {prev ? <Link href={`/glossary/${prev.slug}`} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</Link> : <span />}
            {next && <Link href={`/glossary/${next.slug}`} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></Link>}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

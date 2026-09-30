"use client";
// Standalone concept page body (behind the gate), in the same frame as the
// journal and glossary item pages: back link, share, the concept, previous/next.
import Link from "next/link";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ItemHeader from "@/components/ItemHeader";
import Footer from "@/components/Footer";
import ShareMenu from "@/components/ShareMenu";
import ConceptArticle from "@/components/ConceptArticle";
import { ConceptsNotice } from "@/components/DataIntro";
import { CONCEPTS } from "@/lib/concepts";
import { track } from "@/lib/analytics";

type Nav = { id: string; title: string };

export default function ConceptItemReader({ id, n, prev, next }: { id: string; n: number; prev?: Nav; next?: Nav }) {
  const c = CONCEPTS.find((x) => x.id === id)!;
  useEffect(() => { track("concept_opened", { id, route: true }); }, [id]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ItemHeader />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/concepts" className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to concepts</Link>
          <ShareMenu title={`${c.title} — Invisible Ships`} align="right" />
        </div>
        <ConceptsNotice />
        <ConceptArticle c={c} n={n} />
        <nav aria-label="More concepts" className="flex gap-6 mt-14 pt-6 border-t border-edge">
          {prev ? (
            <Link href={`/concepts/${prev.id}`} className="text-accent text-sm inline-flex items-start gap-1 max-w-[45%]">
              <ChevronLeft size={15} className="mt-0.5 shrink-0" /> <span>{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/concepts/${next.id}`} className="text-accent text-sm ml-auto inline-flex items-start gap-1 text-right max-w-[45%]">
              <span>{next.title}</span> <ChevronRight size={15} className="mt-0.5 shrink-0" />
            </Link>
          )}
        </nav>
      </main>
      <Footer />
    </div>
  );
}

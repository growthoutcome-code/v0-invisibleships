"use client";
// Standalone journal-entry page body (behind the gate). Mirrors the in-app
// Reader but with real <Link> navigation and its own shareable URL.
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ItemHeader from "@/components/ItemHeader";
import Footer from "@/components/Footer";
import ShareMenu from "@/components/ShareMenu";
import { Transcript } from "@/components/Transcript";
import { track } from "@/lib/analytics";
import { useEffect } from "react";

const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ") : "");

type Nav = { id: string; title: string };
type Props = {
  doc: any;
  body: string;
  cats: string[];
  gloss: string[];
  prev?: Nav;
  next?: Nav;
};

export default function JournalItemReader({ doc, body, cats, gloss, prev, next }: Props) {
  useEffect(() => { track("entry_opened", { id: doc.id, route: true }); }, [doc.id]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ItemHeader />
      <main className="flex-1 w-[80%] max-w-none mx-auto px-4 py-6">
        <article className="w-full">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to journal</Link>
            <ShareMenu title={`${doc.title || doc.id} — Invisible Ships`} align="right" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted mb-2">
            <span className="font-mono">{doc.id}</span>
            {cats.map((c) => <span key={c} className="uppercase tracking-wide">{cap(c)}</span>)}
          </div>
          <h1 className="font-display text-[21px] font-semibold text-foreground mb-1 leading-tight">{doc.title || doc.id}</h1>
          <div className="text-sm text-muted mb-5">
            {doc.entry_date}{doc.weekday ? ` · ${doc.weekday}` : ""}{doc.audio_duration ? ` · ${doc.audio_duration}` : ""}
            {doc.audio_url && <> · <a className="text-accent underline" href={doc.audio_url} target="_blank" rel="noreferrer">audio ↗</a></>}
            {doc.source_url && <> · <a className="text-accent underline" href={doc.source_url} target="_blank" rel="noreferrer">source ↗</a></>}
          </div>
          {gloss.length > 0 && <div className="text-xs text-muted mb-5">Glossary: {gloss.map(cap).join(", ")}</div>}
          <Transcript md={body} />
          <div className="flex gap-3 mt-12 pt-6">
            {prev ? <Link href={`/journal/${prev.id}`} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</Link> : <span />}
            {next && <Link href={`/journal/${next.id}`} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></Link>}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

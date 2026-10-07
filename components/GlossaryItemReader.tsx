"use client";
// Standalone glossary-term page body (behind the gate). Mirrors the in-app
// term reader but with real <Link> navigation and its own shareable URL.
//
// THE TERM LIST STAYS ON SCREEN (Sean, 7 Oct 2026: "make the sidebar permanent.
// So when you click a glossary link, it loads in the content area to the right
// of the terms"). Every glossary link from elsewhere on the site, and every
// shared address, lands here, and this page used to show the definition alone.
// It now carries the same rail as the Glossary page: picking a term loads it to
// the right, by client-side navigation, so the definition is still rendered on
// the server for search engines and link previews.
import Link from "next/link";
import { useRouter } from "next/navigation";
import SideNav from "@/components/SideNav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import ItemHeader from "@/components/ItemHeader";
import Footer from "@/components/Footer";
import ShareMenu from "@/components/ShareMenu";
import { cleanTerm, splitDef } from "@/lib/glossary-format";
import GlossaryBody from "@/components/GlossaryBody";
import GlossaryIllustration from "@/components/GlossaryIllustration";
import { track } from "@/lib/analytics";
import BottomSections from "@/components/BottomSections";

type Nav = { slug: string; term: string };
type Props = {
  term: { slug: string; term: string; definition?: string };
  prev?: Nav;
  next?: Nav;
  /** Every term, for the sidebar. */
  index?: Nav[];
};

export default function GlossaryItemReader({ term, prev, next, index = [] }: Props) {
  const router = useRouter();
  const current = term.slug.toLowerCase();
  const { pron, body } = splitDef(term.definition);
  const name = cleanTerm(term.term);
  useEffect(() => { track("term_opened", { slug: term.slug, route: true }); }, [term.slug]);
  // Open the rail at the current term. The list is long and scrolls on its own,
  // so without this a reader arriving at "neural dust" sees the top of the
  // alphabet and no sign of where they are. Scrolls the rail only, never the page.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Terms"]');
    const btn = nav?.querySelector<HTMLElement>('button[aria-current="true"]');
    if (!nav || !btn) return;
    const h = Math.max(120, Math.min(nav.clientHeight, window.innerHeight - nav.getBoundingClientRect().top));
    nav.scrollTop = Math.max(0, btn.offsetTop - h / 3);
  }, [current]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ItemHeader tab="glossary" />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Same grid and rail as the Glossary page (GlossarySection in JournalBrowser). */}
        <div className="lg:grid lg:grid-cols-[minmax(15rem,25%)_minmax(0,1fr)] lg:gap-x-16 lg:items-start">
        <SideNav
          large
          mode="index"
          label="Terms"
          sections={index.map((t) => ({ id: t.slug, label: cleanTerm(t.term) }))}
          active={current}
          onPick={(slug: string) => { if (slug !== current) router.push(`/glossary/${slug}`); }}
        />
        <article className="w-full min-w-0">
          <div className="flex items-center justify-between mb-4">
            <Link href="/glossary" className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to glossary</Link>
            <ShareMenu title={`${name} — Invisible Ships`} align="right" />
          </div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted mb-2">Glossary</p>
          <h1 className="font-display text-[21px] font-semibold text-foreground mb-1 leading-tight term-title">{name}</h1>
          {pron && <div className="text-sm text-muted italic mb-5">{pron}</div>}
          <GlossaryIllustration slug={term.slug} />
          <GlossaryBody text={body} />
          <div className="flex gap-3 mt-12 pt-6">
            {prev ? <Link href={`/glossary/${prev.slug}`} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</Link> : <span />}
            {next && <Link href={`/glossary/${next.slug}`} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></Link>}
          </div>
        </article>
        </div>
        {/* The home page's other sections, never this one (Sean, 1 Oct 2026). */}
        <BottomSections exclude={["glossary"]} from="glossary-term" />
      </main>
      <Footer />
    </div>
  );
}

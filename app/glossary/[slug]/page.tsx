import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItemGate from "@/components/ItemGate";
import GlossaryItemReader from "@/components/GlossaryItemReader";
import { allGlossaryParams, getGlossaryItem, glossarySummary } from "@/lib/server-corpus";
import { cleanTerm } from "@/lib/glossary-format";

export function generateStaticParams() {
  return allGlossaryParams();
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const item = getGlossaryItem(params.slug);
  if (!item) return { title: "Not found — Invisible Ships" };
  const name = cleanTerm(item.term.term);
  const title = `${name} — Invisible Ships Glossary`;
  const description = glossarySummary(item.term.definition || "") || `${name} — a term from the Invisible Ships glossary.`;
  const url = `/glossary/${params.slug.toLowerCase()}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Invisible Ships", type: "article", images: ["/og-default.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-default.png"] },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const item = getGlossaryItem(params.slug);
  if (!item) notFound();
  return (
    <ItemGate>
      <GlossaryItemReader term={item.term} prev={item.prev} next={item.next} />
    </ItemGate>
  );
}

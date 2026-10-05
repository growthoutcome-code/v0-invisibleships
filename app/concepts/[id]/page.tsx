import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItemGate from "@/components/ItemGate";
import ConceptItemReader from "@/components/ConceptItemReader";
import { CONCEPTS, plainText } from "@/lib/concepts";

// One page per concept (Sean, 30 Sep 2026). The list at /concepts shows tiles;
// the full concept lives here so it can be linked, cited and indexed. Old
// anchors (/concepts#<id>) are forwarded here by ConceptsView.
export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ id: c.id }));
}

const summary = (s: string) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 180 ? t.slice(0, t.lastIndexOf(" ", 177)) + "…" : t;
};

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const c = CONCEPTS.find((x) => x.id === params.id);
  if (!c) return { title: "Not found — Invisible Ships" };
  const title = `${c.title} — Invisible Ships Concepts`;
  const description = summary(plainText(c.body));
  const url = `/concepts/${c.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Invisible Ships", type: "article", images: ["/og-default.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-default.png"] },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  const i = CONCEPTS.findIndex((x) => x.id === params.id);
  if (i < 0) notFound();
  const nav = (j: number) => (CONCEPTS[j] ? { id: CONCEPTS[j].id, title: CONCEPTS[j].title } : undefined);
  return (
    <ItemGate>
      <ConceptItemReader id={CONCEPTS[i].id} n={i + 1} prev={nav(i - 1)} next={nav(i + 1)} />
    </ItemGate>
  );
}

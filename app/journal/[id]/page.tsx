import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItemGate from "@/components/ItemGate";
import JournalItemReader from "@/components/JournalItemReader";
import { allJournalParams, getJournalItem, excerptOf } from "@/lib/server-corpus";

export function generateStaticParams() {
  return allJournalParams();
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const item = getJournalItem(params.id);
  if (!item) return { title: "Not found — Invisible Ships" };
  const title = `${item.doc.title || item.doc.id} — Invisible Ships`;
  const description = excerptOf(item.body) || "A firsthand documentary archive of neuro-tech terrorism.";
  const url = `/journal/${params.id.toLowerCase()}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Invisible Ships", type: "article", images: ["/og-default.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-default.png"] },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  const item = getJournalItem(params.id);
  if (!item) notFound();
  const d = item.doc;
  const slim = {
    id: d.id, title: d.title, entry_date: d.entry_date, weekday: d.weekday,
    audio_duration: d.audio_duration, audio_url: d.audio_url, source_url: d.source_url,
  };
  return (
    <ItemGate>
      <JournalItemReader doc={slim} body={item.body} cats={item.cats} gloss={item.gloss} prev={item.prev} next={item.next} />
    </ItemGate>
  );
}

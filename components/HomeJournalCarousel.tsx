"use client";

/**
 * The journal, on the home page, as a carousel — and the glossary beside it.
 *
 * WHY THERE ARE NO EXCERPTS HERE
 * ------------------------------
 * "/" is ungated. 89 of 438 journal documents open with euthanasia, self-harm
 * or violence language inside their first 220 characters, including two of the
 * eight most recent. An auto-populated excerpt carousel would publish that on
 * the front page, to somebody who arrived from a link with no warning in front
 * of it. So a card carries what is safe and is also what makes the archive
 * credible: a real date, a real place where one was recorded, whether there is
 * audio, and the glossary terms that entry actually uses. The text stays behind
 * the warning, one click away.
 *
 * WHY THE GLOSSARY PANEL MOVES WITH THE CAROUSEL
 * ----------------------------------------------
 * Sean asked for the journal section to have "an intersection that is the
 * glossary with a glossary term there". A static term below a moving carousel
 * would be a decoration. This panel reads the selected slide and defines a term
 * that entry uses, so the two halves are visibly the same fact seen twice: this
 * is a day, and this is the vocabulary that day required. That relation is the
 * archive's actual structure, not a layout idea.
 */
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { HomeEntry } from "@/lib/server-corpus";

export type GlossEntry = { slug: string; term: string; summary: string };

function longDate(iso: string, weekday: string | null) {
  // Parsed as UTC deliberately: an entry dated 2026-02-13 must read February 13
  // in every timezone. Local parsing slides it a day west of Greenwich.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const base = dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return weekday ? `${weekday}, ${base}` : base;
}

export default function HomeJournalCarousel({
  entries,
  glossary,
}: {
  entries: HomeEntry[];
  glossary: GlossEntry[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!api) return;
    const on = () => setI(api.selectedScrollSnap());
    on();
    api.on("select", on);
    return () => {
      api.off("select", on);
    };
  }, [api]);

  const bySlug = new Map(glossary.map((g) => [g.slug, g]));
  const current = entries[Math.min(i, entries.length - 1)];
  // The term to define: the first one this entry uses that we hold a definition
  // for. Falls back to the first term overall so the panel is never empty.
  const term =
    current?.terms.map((t) => bySlug.get(t.slug)).find(Boolean) || glossary[0];

  return (
    <div>
      <Carousel setApi={setApi} opts={{ align: "start", loop: false }} className="relative">
        <CarouselContent>
          {entries.map((e) => (
            <CarouselItem key={e.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
              <a
                href={`/journal/${e.id}`}
                className="flex h-full flex-col rounded-lg border border-edge p-5 transition-colors hover:border-foreground"
              >
                <span className="font-display text-[19px] font-semibold leading-snug text-foreground">
                  {longDate(e.date, e.weekday)}
                </span>
                <span className="mt-1 text-[14px] text-muted">
                  {e.location ? e.location : "Location not recorded"}
                  {e.hasAudio ? " · audio" : ""}
                </span>

                <span className="mt-4 flex flex-wrap gap-2">
                  {e.terms.map((t) => (
                    <span
                      key={t.slug}
                      className="rounded-full border border-edge px-2.5 py-1 text-[12px] uppercase tracking-wide text-muted"
                    >
                      {t.term}
                    </span>
                  ))}
                </span>

                <span className="mt-auto pt-5 text-[14px] text-muted underline underline-offset-4">
                  Read the entry
                </span>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-3 border border-edge" />
        <CarouselNext className="-right-3 border border-edge" />
      </Carousel>

      {/* The intersection. Same row of information, other side. */}
      {term && (
        <div className="mt-8 rounded-lg border border-edge bg-foreground/[0.03] p-6">
          <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted">
            A word this entry uses
          </p>
          <h3 className="font-display mt-2 text-2xl font-semibold text-foreground">
            {term.term}
          </h3>
          <p className="body-copy mt-2 text-[15px] text-foreground/85">{term.summary}</p>
          <p className="mt-3">
            <a
              href={`/glossary/${term.slug}`}
              className="text-[14px] underline underline-offset-4 text-foreground"
            >
              Full definition and every entry that uses it
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

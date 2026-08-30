"use client";

/**
 * The journal section's entries, as quotations you slide through.
 *
 * Sean: get rid of the cards underneath, bump the text, "we just wanna slide
 * through entries." So the carousel IS the entry now. Each slide is one day of
 * the record, set as a quotation; moving to the next slide moves back through
 * the archive rather than to a link to it.
 *
 * NEWEST FIRST, NOTHING CHOSEN. Date order straight out of the corpus. The
 * front page shows where the record stands, and nobody picks which face it
 * shows.
 *
 * The opening quote mark hangs in the left margin rather than sitting inline,
 * so every slide keeps a straight left edge and the mark reads as a mark on the
 * page instead of a character in the first sentence.
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
import EntryProse from "@/components/EntryProse";
import type { JournalQuote } from "@/lib/server-corpus";

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export default function JournalQuotes({ entries }: { entries: JournalQuote[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!api) return;
    const on = () => setI(api.selectedScrollSnap());
    on();
    api.on("select", on);
    return () => { api.off("select", on); };
  }, [api]);

  if (!entries.length) return null;

  return (
    <div>
      <Carousel setApi={setApi} opts={{ align: "start", loop: false }} aria-label="Journal entries">
        <CarouselContent>
          {entries.map((e, n) => (
            <CarouselItem key={e.id} className="basis-full">
              <figure className="m-0 flex min-h-[420px] flex-col sm:min-h-[460px]">
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  {n === 0 ? "The last entry" : "Entry"} · {longDate(e.date)}
                  {e.location ? ` · ${e.location}` : ""}
                  {e.hasAudio ? " · audio" : ""}
                </p>

                <blockquote className="relative m-0 mt-8 pl-9 sm:pl-16">
                  <span
                    aria-hidden
                    className="font-serif absolute left-0 top-[-0.2em] select-none text-[60px] leading-none text-foreground/25 sm:text-[96px]"
                  >
                    &ldquo;
                  </span>
                  <EntryProse
                    body={e.body}
                    limit={380}
                    className="font-serif text-[22px] leading-[1.6] text-foreground sm:text-[27px] sm:leading-[1.55]"
                  />
                </blockquote>

                <figcaption className="mt-auto pt-8 pl-9 text-[15px] sm:pl-16">
                  <a href={`/journal/${e.id}`} className="text-foreground underline underline-offset-4">
                    Read the full entry
                  </a>
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Above the quote on desktop so the arrows never sit over the text or
            in the gutter; inline under it on a phone, where there is no margin
            to put them in. */}
        <CarouselPrevious className="-top-10 left-auto right-11 translate-y-0" />
        <CarouselNext className="-top-10 right-0 translate-y-0" />
      </Carousel>

      <div className="mt-8 flex items-center gap-2">
        {entries.map((e, n) => (
          <button
            key={e.id}
            type="button"
            onClick={() => api?.scrollTo(n)}
            aria-label={`Entry ${n + 1} of ${entries.length}`}
            aria-current={n === i}
            className={`h-1.5 transition-all ${n === i ? "w-7 bg-foreground" : "w-2.5 bg-foreground/20 hover:bg-foreground/40"}`}
          />
        ))}
        <span className="ml-3 text-[13px] text-muted">
          {i + 1} / {entries.length}
        </span>
      </div>
    </div>
  );
}

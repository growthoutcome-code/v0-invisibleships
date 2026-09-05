"use client";

/**
 * The journal section's entries, as quotations you slide through.
 *
 * Sean: "we just wanna slide through entries." So the carousel IS the entry —
 * each slide is one moment from the record, set as a quotation.
 *
 * CURATED, NOT CHRONOLOGICAL (Sean, 5 September). This used to show the five
 * newest entries, which is an arbitrary selection that happened to be whatever
 * was written last. Thirteen chosen moments now run in an arc: the first day,
 * the speakers noticing they are being written down, the mechanism they let
 * slip, the tactic and what it costs, the process named, and the future those
 * same voices describe. See lib/home-quotes.ts for what was excluded and why.
 *
 * IT ROTATES ON ITS OWN (Sean, same day): "people might not see all of these
 * slides, but with the auto rotate going, let's make sure that is going." Seven
 * seconds a slide, looping, and it stops the moment a reader touches it or
 * hovers — advancing a quotation out from under someone who is reading it is
 * worse than never advancing at all. Under prefers-reduced-motion it does not
 * autoplay, full stop.
 *
 * TWO WAYS OUT OF EVERY SLIDE, also his: this entry, or the whole journal. A
 * reader who is gripped by one moment and a reader who wants the archive are
 * two different people, and the slide should not have to guess which it has.
 *
 * The opening quote mark hangs in the left margin rather than sitting inline,
 * so every slide keeps a straight left edge and the mark reads as a mark on the
 * page instead of a character in the first sentence.
 */
import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
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

  // Built once. Re-creating the plugin on every render restarts the timer, so
  // the carousel would either never advance or advance twice.
  const autoplay = useRef(
    Autoplay({ delay: 7000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!api) return;
    const on = () => setI(api.selectedScrollSnap());
    on();
    api.on("select", on);
    return () => { api.off("select", on); };
  }, [api]);

  useEffect(() => {
    if (reduced) autoplay.current.stop();
  }, [reduced]);

  if (!entries.length) return null;

  return (
    <div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={reduced ? [] : [autoplay.current]}
        aria-label="Journal entries"
      >
        <CarouselContent>
          {entries.map((e) => (
            <CarouselItem key={e.id} className="basis-full">
              <figure className="m-0 flex min-h-[260px] flex-col sm:min-h-[280px]">
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  {longDate(e.date)}
                  {e.location ? ` · ${e.location}` : ""}
                  {e.hasAudio ? " · audio" : ""}
                </p>

                <blockquote className="relative m-0 mt-7 pl-9 sm:pl-16">
                  <span
                    aria-hidden
                    className="font-serif absolute left-0 top-[-0.2em] select-none text-[60px] leading-none text-foreground/25 sm:text-[96px]"
                  >
                    &ldquo;
                  </span>
                  <EntryProse
                    body={e.body}
                    limit={460}
                    className="font-serif text-[21px] leading-[1.55] text-foreground sm:text-[25px] sm:leading-[1.5]"
                  />
                </blockquote>

                {e.note && (
                  <p className="mt-5 pl-9 text-[14px] leading-relaxed text-muted sm:pl-16">
                    {e.note}
                  </p>
                )}

                <figcaption className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-7 pl-9 text-[15px] sm:pl-16">
                  <a href={`/journal/${e.id}`} className="text-foreground underline underline-offset-4">
                    Read this entry
                  </a>
                  <a href="/journal" className="text-muted underline underline-offset-4 hover:text-foreground">
                    Go to the journal
                  </a>
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>

      {/* ARROWS LIVE IN THE CONTROL ROW (Sean, 5 September: "I don't see a way
          to do next and back"). They used to be absolutely positioned at
          -top-10, hanging above the carousel — which worked until the carousel
          moved inside MotifStage, whose overflow-hidden clipped them clean off
          the page. Anything positioned outside its own container is one layout
          change away from vanishing, so they now sit in normal flow beside the
          dots, where nothing can crop them. */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <CarouselPrevious className="static mr-1 h-9 w-9 translate-y-0" />
        <CarouselNext className="static mr-3 h-9 w-9 translate-y-0" />
        {entries.map((e, n) => (
          <button
            key={e.id}
            type="button"
            onClick={() => { autoplay.current.stop(); api?.scrollTo(n); }}
            aria-label={`Entry ${n + 1} of ${entries.length}`}
            aria-current={n === i}
            className={`h-1.5 transition-all ${n === i ? "w-7 bg-foreground" : "w-2.5 bg-foreground/20 hover:bg-foreground/40"}`}
          />
        ))}
        <span className="ml-3 text-[13px] text-muted">
          {i + 1} / {entries.length}
        </span>
      </div>
      </Carousel>
    </div>
  );
}

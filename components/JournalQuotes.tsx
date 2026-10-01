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
import { useEffect, useMemo, useRef, useState } from "react";
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
import DisclaimerLink from "@/components/DisclaimerLink";
import { DISCLAIMER_TITLE } from "@/lib/disclaimer";
import { CAROUSEL_DELAY_MS, useAutoplayInView } from "@/components/HomeCarousel";
import type { JournalQuote } from "@/lib/server-corpus";

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export default function JournalQuotes({ entries, limit = 460, disclaimerFrom }: {
  entries: JournalQuote[];
  /** Characters of quotation shown. The bottom sections carry longer passages
   *  (Sean, 1 Oct 2026: "double the amount of copy"); the home page keeps 460. */
  limit?: number;
  /** When set, a link to the critical disclaimer sits under the carousel
   *  controls (bottom sections; Sean, 1 Oct 2026). The value names the page
   *  for the disclaimer_opened event. */
  disclaimerFrom?: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [i, setI] = useState(0);

  // Built once. Re-creating the plugin on every render restarts the timer, so
  // the carousel would either never advance or advance twice.
  const autoplay = useRef(
    // stopOnFocusIn added 8 September with the faster cadence: a keyboard user
    // tabbing to "Read this entry" must not have the quotation move under them,
    // and at a four-second hold that goes from a nicety to the difference
    // between usable and not.
    Autoplay({
      delay: CAROUSEL_DELAY_MS,
      // The observer in useAutoplayInView decides when this starts — not page
      // load. See the note on that hook: at this cadence a carousel that begins
      // rotating before anyone can see it has already thrown away its first
      // three slides by the time a reader scrolls down to it.
      playOnInit: false,
      // false, deliberately — see the long note on the same option in
      // HomeCarousel. With it true, embla never registers the mouseleave
      // listener, so this carousel stopped permanently the instant it scrolled
      // under the reader's cursor.
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    })
  );
  const plugins = useMemo(() => [autoplay.current], []);

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

  const { hostRef, stopForGood } = useAutoplayInView(api, autoplay, !reduced);

  if (!entries.length) return null;

  return (
    <div ref={hostRef}>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={plugins}
        aria-label="Journal entries"
      >
        <CarouselContent>
          {entries.map((e) => (
            <CarouselItem key={e.id} className="basis-full">
              <figure className="m-0 flex min-h-[260px] flex-col sm:min-h-[280px]">
                <p className="m-0 font-display text-[16px] uppercase tracking-[0.14em] text-muted">
                  {longDate(e.date)}
                  {e.location ? ` · ${e.location}` : ""}
                  {e.hasAudio ? " · audio" : ""}
                </p>
                {/* Time and place (bottom sections; Sean, 1 Oct 2026: "add the date
                    and time… I think the location is also important"). */}
                {e.meta && (
                  <p className="m-0 mt-2 text-[16px] leading-snug text-muted">{e.meta}</p>
                )}

                <blockquote className="relative m-0 mt-7 pl-7 sm:pl-16">
                  {!e.parts && <span
                    aria-hidden
                    className="font-serif absolute left-0 top-[-0.2em] select-none text-[44px] leading-none text-foreground/25 sm:text-[96px]"
                  >
                    &ldquo;
                  </span>}
                  {/* FOUR LINES (Sean, 8 September). 22px at 1.55 is a 34px line
                      and 26px at 1.5 is a 39px line, so four of them are 136px
                      and 156px. This is a floor, not a clamp: a short quotation
                      fills the same space as a long one so the section stops
                      jumping on every rotation, and the two longest run past it
                      rather than being cut off mid-sentence. */}
                  {e.parts ? (
                    // WHO IS SPEAKING, ONCE PER TURN (Sean, 1 Oct 2026): "From the
                    // distance" or "From the author", never twice in a row, then
                    // the quoted lines with line breaks. The labels are set in the
                    // display face like "Open question", so they read as the
                    // archive's, never as part of the quotation.
                    <div className="min-h-[136px] sm:min-h-[156px]">
                      {e.parts.map((pt, k) => (
                        <div key={k} className={k ? "mt-6" : ""}>
                          <p className="m-0 mb-2 font-display text-[14px] uppercase tracking-[0.14em] text-muted">
                            {pt.label}
                          </p>
                          {pt.lines.map((l, n) => (
                            <p key={n} className={`m-0 font-serif text-[20px] leading-[1.5] text-foreground sm:text-[23px] ${n ? "mt-2" : ""}`}>
                              {l}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EntryProse
                      body={e.body}
                      limit={limit}
                      className="min-h-[136px] font-serif text-[22px] leading-[1.55] text-foreground sm:min-h-[156px] sm:text-[26px] sm:leading-[1.5]"
                    />
                  )}
                </blockquote>

                {/* THE OPEN QUESTION (Sean, 8 September). It is labelled, set in
                    the display face rather than the reading face, and separated
                    by a rule — three signals that this is the ARCHIVE asking,
                    not another line of the record. A question we wrote sitting
                    unlabelled under a quotation would read as testimony, which
                    is the one thing it must never do.

                    It is also the point of the whole section: per
                    claude/questions-and-comments-audit.md, a question is what
                    stands between an entry and the accusation inside it, and
                    about 70% of entries carry no counterweight at all today. */}
                {e.question && (
                  <div className="mt-7 border-l-2 border-accent pl-5 sm:ml-16">
                    <p className="m-0 font-display text-[15px] uppercase tracking-[0.14em] text-muted">
                      Open question
                    </p>
                    <p className="m-0 mt-2 font-display text-[19px] leading-[1.45] text-foreground/90 sm:text-[21px]">
                      {e.question}
                    </p>
                  </div>
                )}

                <figcaption className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-7 pl-7 text-[17px] sm:pl-16">
                  {/* ONE way out, not two (Sean, 8 September): "we've got a
                      redundant go to the journal link… let's remove the link and
                      keep the button." The section's own primary action is
                      already "Go to the journal", eight inches below this. */}
                  <a href={`/journal/${e.id}`} className="text-foreground underline underline-offset-4">
                    Read this entry
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
        <CarouselPrevious className="static mr-1 h-11 w-11 translate-y-0" />
        <CarouselNext className="static mr-2 h-11 w-11 translate-y-0" />
        {entries.map((e, n) => (
          <button
            key={e.id}
            type="button"
            onClick={() => { stopForGood(); api?.scrollTo(n); }}
            aria-label={`Entry ${n + 1} of ${entries.length}`}
            aria-current={n === i}
            className="px-1 py-3"
          >
            <span
              className={`block h-1.5 transition-all ${n === i ? "w-7 bg-foreground" : "w-2.5 bg-foreground/20"}`}
            />
          </button>
        ))}
        <span className="ml-3 text-[15px] text-muted">
          {i + 1} / {entries.length}
        </span>
      </div>
      {/* ONCE, UNDER THE CONTROLS (Sean, 1 Oct 2026: "move the disclaimer link
          under the carousel controls"). Bottom sections only. */}
      {disclaimerFrom && (
        <p className="m-0 mt-3 text-[15px] text-muted">
          <DisclaimerLink from={disclaimerFrom} className="text-left underline underline-offset-4 hover:text-foreground">{DISCLAIMER_TITLE}</DisclaimerLink>
        </p>
      )}
      </Carousel>
    </div>
  );
}

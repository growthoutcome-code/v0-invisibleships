"use client";

/**
 * The tall, rotating carousel used by the journal and glossary sections.
 *
 * Sean, 30 August: "a nice, clean, easy to read, rotating carousel… let the text
 * from the journal entry be what shines… five to six hundred pixels high
 * minimum on desktop."
 *
 * ONE SLIDE AT A TIME, NOT THREE CARDS. The previous version showed three cards
 * of metadata per screen, which made the archive look like a list of dates. A
 * single slide at full width lets the entry's own words be the largest thing on
 * screen, which is the point: the record is the evidence, and a reader should
 * meet it rather than a description of it.
 *
 * AUTOPLAY, AND WHY IT IS SLOW AND GIVES UP. Eight seconds, and it stops
 * permanently the moment anyone touches the controls — embla's stopOnInteraction
 * — as well as pausing on hover and on keyboard focus. A carousel carrying two
 * hundred words that advances while you are reading them is worse than no
 * carousel; the rotation is there to show a second slide exists, not to set the
 * pace. Under prefers-reduced-motion it never starts.
 *
 * NO BOX AT ALL. Sean, 30 August: "get rid of the lines and the gray
 * background… we don't want a bunch of empty space, a bunch of negative space
 * around it." So a slide is no longer an object on the page — no outline, no
 * tint, no padding holding a shape open, and the height floor dropped from
 * 560px to 340px. It is text on the page, and the carousel is only the
 * mechanism that changes which text.
 *
 * The floor is not zero because slides of different lengths would otherwise
 * make the page jump on every advance. It is set just under the shortest
 * definition so the tallest ones set the real height.
 */
import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export type Slide = {
  /** Stable key and anchor for the "read more" link. */
  href: string;
  /** Small line above the quote: a date and place, or a term's part of speech. */
  eyebrow: string;
  /** The term, for glossary slides. Journal slides leave this out — the date is
   *  in the eyebrow and a manufactured headline would compete with the words. */
  title?: string;
  /** The words that do the work. Rendered in the reading face at reading size. */
  body: string;
  /** Under the quote: audio, related terms, whatever the section needs. */
  meta?: string;
  /** Link text for this slide. */
  cta: string;
};

export default function HomeCarousel({
  slides,
  label,
  compact = false,
}: {
  slides: Slide[];
  label: string;
  /** Pointer mode: three or four to a screen, short, no long body text. Used
   *  for "the next journals" — the carousel is a way through the record, not a
   *  place to read it. */
  compact?: boolean;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    // Read once on mount rather than at module scope: matchMedia does not exist
    // on the server, and starting motion before this check would defeat it.
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!api) return;
    const on = () => setI(api.selectedScrollSnap());
    on();
    api.on("select", on);
    return () => {
      api.off("select", on);
    };
  }, [api]);

  return (
    <div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={
          reduced
            ? []
            : [Autoplay({ delay: 8000, stopOnInteraction: true, stopOnMouseEnter: true, stopOnFocusIn: true })]
        }
        className="relative"
        aria-label={label}
      >
        <CarouselContent>
          {slides.map((s) => (
            <CarouselItem key={s.href} className={compact ? "basis-[78%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4" : "basis-full"}>
              <article className={`flex flex-col pr-10 ${compact ? "min-h-[150px]" : "min-h-[260px] md:min-h-[300px]"}`}>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  {s.eyebrow}
                </p>

                {s.title && (
                  <h3
                    className={
                      compact
                        ? "font-display m-0 mt-2 text-xl font-semibold text-foreground"
                        : "font-display m-0 mt-3 text-3xl font-semibold text-foreground sm:text-4xl"
                    }
                  >
                    {s.title}
                  </h3>
                )}

                {/* flex-1 + justify-center: short quotes sit in the middle of the
                    panel instead of stranded at the top, long ones simply fill
                    it. This is what lets one height serve both. */}
                <div className={`flex flex-1 flex-col justify-start ${compact ? "py-3" : "py-6"}`}>
                  <p
                    className={
                      compact
                        ? "m-0 font-serif text-[17px] leading-[1.55] text-foreground/90"
                        : "m-0 font-serif text-[19px] leading-[1.6] text-foreground sm:text-[21px] sm:leading-[1.55]"
                    }
                  >
                    {s.body}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  {s.meta && <span className="text-[13px] text-muted">{s.meta}</span>}
                  <a
                    href={s.href}
                    className="ml-auto inline-flex items-center gap-1.5 text-[14px] text-foreground underline underline-offset-4"
                  >
                    {s.cta}
                    <ArrowRight size={14} aria-hidden />
                  </a>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="-left-1 -top-8 translate-y-0 sm:-left-2" />
        <CarouselNext className="-right-1 -top-8 translate-y-0 sm:-right-2" />
      </Carousel>

      {/* Dots are buttons, not decoration: they say how many there are, which
          one you are on, and they are the only control that works by touch
          without guessing where the arrows are. */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((s, n) => (
          <button
            key={s.href}
            type="button"
            onClick={() => api?.scrollTo(n)}
            aria-label={`Show ${n + 1} of ${slides.length}`}
            aria-current={n === i}
            className={`h-1.5 transition-all ${n === i ? "w-6 bg-foreground" : "w-2 bg-edge hover:bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}

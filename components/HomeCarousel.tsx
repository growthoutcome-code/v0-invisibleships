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
 * the moment anyone touches the controls — via this file's own latch
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
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

/**
 * FOUR SECONDS ON THE SLIDE, MEASURED THE WAY A READER MEASURES IT.
 *
 * Sean, 8 September: "for all carousels, we need them to rotate every three to
 * four seconds." Then, 10 September, after watching it: "every single carousel
 * on the home page is rotating on a four second minimum rotation. So you look
 * at the slide for four seconds, and it does not automatically rotate before
 * four seconds on that slide has happened."
 *
 * Those are not the same requirement, and the delay was set to 4000 as though
 * they were. Inside embla-carousel-autoplay:
 *
 *   function next() {
 *     ...
 *     emblaApi.scrollNext(jump)   // the transition STARTS here
 *     startAutoplay()             // ...and setTimer() runs on the next line
 *   }
 *
 * The clock starts when the slide begins moving, not when it stops. So the
 * plugin's `delay` is transition + reading time, and 4000 bought a reader about
 * three and a half seconds of a slide actually holding still — the shortfall
 * being exactly the thing he keeps reporting.
 *
 * So the number that means something is stated first, and the plugin's delay is
 * derived from it. Change MIN_VISIBLE, not the delay.
 */

/** Time a slide holds STILL, which is the only interval a reader experiences. */
export const CAROUSEL_MIN_VISIBLE_MS = 4000;

/**
 * Headroom for the scroll animation. Embla's `duration` is a friction constant,
 * not milliseconds (default 25), so this cannot be computed from the options —
 * it is a deliberate over-estimate. A default-speed slide settles in roughly
 * 400–500ms; 600 leaves margin on a slow device, and erring long is the safe
 * direction when the requirement is a MINIMUM.
 */
const CAROUSEL_TRANSITION_MS = 600;

/**
 * What the plugin actually gets. One constant, imported by JournalQuotes too, so
 * the page never ends up with two carousels keeping different time.
 *
 * Every carousel using it still stops the moment a reader engages —
 * stopOnMouseEnter and stopOnFocusIn to pause, and useAutoplayInView's latch to
 * halt it for good once the reader drives it. At this cadence those matter more
 * than they did at eight seconds, not less.
 */
export const CAROUSEL_DELAY_MS = CAROUSEL_MIN_VISIBLE_MS + CAROUSEL_TRANSITION_MS;

/**
 * Autoplay only once the carousel is actually on screen.
 *
 * Sean, 8 September: "can we run the carousels after they appear in the browser?
 * Only then."
 *
 * This is the fix for the thing that made a 3.5-second cadence risky. A carousel
 * that starts rotating at page load has already advanced three or four times
 * before a reader scrolling down ever reaches it — so they arrive at slide 4 of
 * 5, having missed the strongest one, which is the whole premise of ordering
 * these things. Gated on visibility, every carousel is on slide 1 when the
 * reader gets to it, and stops again when it leaves.
 *
 * ONCE A READER TAKES HOLD, IT STAYS STOPPED — by this hook's own latch, not by
 * the plugin's stopOnInteraction, which cannot be used here (see the note on
 * that option below). Scrolling back to a carousel must not resurrect something
 * the reader deliberately stopped, so a pointerDown, or a tap on the dots,
 * latches `userStopped` and no amount of re-entering the viewport restarts it.
 *
 * IntersectionObserver is already how SectionMotif and SideNav work here, so
 * this is the pattern the codebase uses rather than a new one.
 */
export function useAutoplayInView(
  api: CarouselApi | undefined,
  autoplayRef: { current: { play: () => void; stop: () => void } },
  enabled: boolean,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const userStopped = useRef(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // 0.2 rather than 0.5: a tall carousel on a short phone screen might never
    // cross a half-visible threshold at all, and would then never play.
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!api) return;
    const onDown = () => {
      userStopped.current = true;
    };
    // stopOnInteraction is now false (see the plugin options below for why), so
    // embla restarts autoplay on pointerUp. When the reader has taken control
    // that restart has to be undone, or a deliberate drag would resume on its
    // own a moment later.
    const onUp = () => {
      if (userStopped.current) autoplayRef.current.stop();
    };
    api.on("pointerDown", onDown).on("pointerUp", onUp);
    return () => {
      api.off("pointerDown", onDown).off("pointerUp", onUp);
    };
  }, [api, autoplayRef]);

  useEffect(() => {
    if (enabled && inView && !userStopped.current) autoplayRef.current.play();
    else autoplayRef.current.stop();
  }, [enabled, inView, autoplayRef]);

  /** For the arrows and dots: a deliberate move means the reader is driving. */
  const stopForGood = () => {
    userStopped.current = true;
    autoplayRef.current.stop();
  };

  return { hostRef, stopForGood };
}

export type Slide = {
  /** Stable key and anchor for the "read more" link. */
  href: string;
  /** Small line above the quote: a date and place, or a term's part of speech. */
  eyebrow: string;
  /** The term, for glossary slides. Journal slides leave this out — the date is
   *  in the eyebrow and a manufactured headline would compete with the words. */
  title?: string;
  /** The words that do the work. Rendered in the reading face at reading size.
   *  ReactNode rather than string so a slide can carry the emphasis its sentence
   *  was written with — "it failed when participants resisted it" is the whole
   *  point of that finding and reads as ordinary prose without the bold. */
  body: ReactNode;
  /** Under the quote: audio, related terms, whatever the section needs. */
  meta?: string;
  /** Link text for this slide. */
  cta: string;
  /** Send the reader off-site — a published paper, a bill, an agency page. */
  external?: boolean;
};

export default function HomeCarousel({
  slides,
  label,
  compact = false,
  autoplay = true,
  delayMs = CAROUSEL_DELAY_MS,
  titleSize = "display",
}: {
  slides: Slide[];
  label: string;
  /** Pointer mode: three or four to a screen, short, no long body text. Used
   *  for "the next journals" — the carousel is a way through the record, not a
   *  place to read it. */
  compact?: boolean;
  /**
   * ONE MOVING CAROUSEL PER SCREENFUL (Sean, 8 September — the home page became
   * carousels almost end to end). Five auto-advancing blocks stacked down a page
   * is not lively, it is a page that will not sit still, and motion competing
   * with motion reads as broken. The journal and the glossary rotate; they never
   * share a screen. Everything else keeps its arrows and dots and waits to be
   * asked.
   */
  autoplay?: boolean;
  /** Override the shared cadence for a carousel whose slides are long enough
   *  that three and a half seconds would advance one out from under a reader. */
  delayMs?: number;
  /**
   * "display" sets the title as the largest thing on the slide — right for a
   * glossary term or a single figure. "heading" is for a slide whose title is a
   * SENTENCE, where display size would run to four lines and swamp the body it
   * is introducing.
   */
  titleSize?: "display" | "heading";
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(true);

  // BUILT ONCE. This used to be constructed inline in `plugins={...}`, which
  // makes a new plugin on every render and restarts its timer each time —
  // exactly the bug JournalQuotes already carried a comment about avoiding.
  // playOnInit is false because the observer below decides when it starts.
  const autoplayRef = useRef(
    Autoplay({
      delay: delayMs,
      playOnInit: false,
      // stopOnInteraction MUST be false, and this is not a preference — it is a
      // bug fix. Inside embla-carousel-autoplay:
      //
      //   if (options.stopOnMouseEnter)
      //     eventStore.add(root, 'mouseenter', mouseEnter);
      //   if (options.stopOnMouseEnter && !options.stopOnInteraction)
      //     eventStore.add(root, 'mouseleave', mouseLeave);
      //
      // With stopOnInteraction true, the mouseLEAVE listener is never registered
      // at all. mouseenter stops autoplay and nothing ever starts it again. On a
      // page you scroll, a wide carousel slides UNDER a stationary cursor, which
      // fires mouseenter — so the journal carousel stopped dead the moment it
      // came into view, which is exactly what Sean reported on 8 September. The
      // same trap applies to stopOnFocusIn and its focusout partner.
      //
      // False here means hover pauses and moving away resumes, which is what a
      // reader expects. "The reader took control, keep it stopped" is handled by
      // useAutoplayInView's own latch instead, which does not depend on the
      // plugin registering the listener that would undo it.
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    }),
  );
  const plugins = useMemo(() => [autoplayRef.current], []);
  const { hostRef, stopForGood } = useAutoplayInView(api, autoplayRef, autoplay && !reduced);

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
    <div ref={hostRef}>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={plugins}
        className="relative"
        aria-label={label}
      >
        <CarouselContent>
          {slides.map((s) => (
            <CarouselItem key={s.href} className={compact ? "basis-[78%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4" : "basis-full"}>
              <article className={`flex flex-col pr-0 sm:pr-10 ${compact ? "min-h-[150px]" : "min-h-[260px] md:min-h-[300px]"}`}>
                <p className="m-0 font-display text-[16px] uppercase tracking-[0.14em] text-muted">
                  {s.eyebrow}
                </p>

                {s.title && (
                  <h3
                    className={
                      compact
                        ? "font-display m-0 mt-2 text-xl font-semibold text-foreground"
                        : titleSize === "heading"
                          ? "font-display m-0 mt-3 text-[22px] font-semibold leading-[1.3] text-foreground sm:text-[26px]"
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
                        : "m-0 font-serif text-[20px] leading-[1.6] text-foreground sm:text-[22px] sm:leading-[1.55]"
                    }
                  >
                    {s.body}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  {s.meta && <span className="text-[16px] text-muted">{s.meta}</span>}
                  <a
                    href={s.href}
                    {...(s.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    className="ml-auto inline-flex items-center gap-1.5 text-[16px] text-foreground underline underline-offset-4"
                  >
                    {s.cta}
                    <ArrowRight size={14} aria-hidden />
                  </a>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* CONTROLS IN NORMAL FLOW, and big enough to hit with a thumb.
            They used to be absolutely positioned at -top-8, hanging above the
            slide — the same arrangement that got silently clipped off the
            journal carousel when it moved inside MotifStage. Anything positioned
            outside its own container is one layout change away from vanishing.

            44x44 is the accessible minimum for a touch target; the dots carry
            py-3 px-1 so each one has a ~30px tall hit area while the bar itself
            stays 6px. At a 3.5-second cadence these are the controls a reader
            reaches for, so they have to be findable and hittable on a phone. */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          <CarouselPrevious className="static mr-1 h-11 w-11 translate-y-0" />
          <CarouselNext className="static mr-2 h-11 w-11 translate-y-0" />
          {slides.map((s, n) => (
            <button
              key={s.href}
              type="button"
              onClick={() => { stopForGood(); api?.scrollTo(n); }}
              aria-label={`Show ${n + 1} of ${slides.length}`}
              aria-current={n === i}
              className="px-1 py-3"
            >
              <span
                className={`block h-1.5 transition-all ${n === i ? "w-7 bg-foreground" : "w-2.5 bg-foreground/20"}`}
              />
            </button>
          ))}
          <span className="ml-2 text-[15px] text-muted">
            {i + 1} / {slides.length}
          </span>
        </div>
      </Carousel>
    </div>
  );
}

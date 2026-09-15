"use client";

/**
 * The entry gate — one modal wizard over the page, three steps.
 *
 * WHAT THIS REPLACES
 * ------------------
 * components/ContentWarning.tsx, the dismissible bottom-right toast that has
 * been the site's only warning since the four-screen AccessGate was retired on
 * 30 August. Sean, 15 September: "merge the content warning pop up with the
 * original gate." So the toast's words are here, on step 1, unchanged in
 * substance — including 988, which stays in the warning itself rather than one
 * click away.
 *
 * It is NOT the old AccessGate coming back. That was four full-page screens
 * with an age attestation and no way around it, and it cost more than it
 * protected: every link Sean sent landed a reader on "I am 18 or older"
 * instead of the thing he was pointing at. This is three steps, over the page
 * rather than instead of it, with no age question, and it is remembered for
 * the browser session.
 *
 * THE ONE RULE THAT MATTERS ON STEP 3
 * -----------------------------------
 * The disclaimer is not retyped here. Step 3 renders
 * <CopyrightTerms variant="gate" />, which is TERMS.filter(s => s.gate) — the
 * same seven sections /disclaimer shows, from the same lib/terms.ts. That is
 * deliberate and load-bearing: the gate and the disclaimer page cannot drift,
 * and a wording change lands in both, in the download, and in the guard that
 * compares them. If you are tempted to paste prose into this file, don't —
 * edit lib/terms.ts.
 *
 * Sean, 15 September: "make sure that everyone scrolls the entire copyright
 * before they enter." So the primary button is disabled until the terms panel
 * has been scrolled to the bottom. Two guards keep that from becoming a trap:
 * once read it STAYS read (scrolling back up to re-read a clause must not
 * re-lock the button), and a panel with nothing to scroll counts as read
 * immediately — otherwise a tall window, or a future shorter disclaimer, would
 * leave a button that can never be enabled.
 *
 * NO ILLUSTRATIONS, for now. Sean, 15 September: "let's remove the animations
 * from the gate... and then we'll think about animations." Three hairline
 * drawings were prototyped (see claude/gate-merge-plan.md); none ship yet.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import CopyrightTerms from "@/components/CopyrightTerms";
import { GATE } from "@/lib/gate-content";
import { hasEntered, markEntered } from "@/lib/gate";
import { track } from "@/lib/analytics";

const STEPS = [
  { title: "Content warning", cta: "I understand", event: "gate_warning_viewed" },
  { title: "Perceptual set", cta: "Continue", event: "gate_perceptual_viewed" },
  { title: "Disclaimer and copyright", cta: "Enter the corpus", event: "gate_terms_viewed" },
] as const;

const TERMS_STEP = 2;

export default function EntryGate() {
  // Starts closed and is opened in an effect: sessionStorage does not exist
  // during SSR, and rendering it on the server would flash the gate at somebody
  // who has already passed it this session.
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hasEntered()) setOpen(true);
  }, []);

  useEffect(() => {
    if (open) track(STEPS[step].event);
  }, [open, step]);

  // --- the scroll condition on step 3 -------------------------------------
  const docRef = useRef<HTMLDivElement>(null);
  const [readAll, setReadAll] = useState(false);

  const checkRead = useCallback(() => {
    const el = docRef.current;
    if (!el) return;
    const slack = el.scrollHeight - el.clientHeight;
    if (slack <= 4 || el.scrollTop >= slack - 12) setReadAll(true);
  }, []);

  useEffect(() => {
    if (!open || step !== TERMS_STEP) return;
    // A frame late, so the panel has been laid out and scrollHeight is real.
    const id = requestAnimationFrame(checkRead);
    window.addEventListener("resize", checkRead);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", checkRead);
    };
  }, [open, step, checkRead]);

  const locked = step === TERMS_STEP && !readAll;

  function advance() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    markEntered();
    track("gate_entered");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <DialogPrimitive.Root open modal>
      <DialogPrimitive.Portal>
        {/* Darker than the site's usual overlay. The page stays legible behind
            it on purpose — this sits over the archive rather than in place of
            it — but it should read as held back, not merely tinted. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          // Nothing dismisses this except the button on the last step: no
          // Escape, no click-outside, and no close affordance in the corner.
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-[61] flex w-[calc(100vw-1.5rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col border border-edge bg-panel shadow-2xl animate-fade-in max-h-[calc(100dvh-1.5rem)]"
        >
          <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6">
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((s, n) => (
                <span
                  key={s.title}
                  className={`h-[5px] w-[26px] bg-foreground transition-opacity duration-300 ${
                    n <= step ? "opacity-100" : "opacity-[0.16]"
                  }`}
                />
              ))}
            </div>
            {/* One label for the whole process, so a reader always knows where
                they are. Sean, 15 September: "before you enter on each step." */}
            <p className="font-display mt-5 mb-2 text-[11.5px] uppercase tracking-[0.16em] text-muted">
              Before you enter · {step + 1} of {STEPS.length}
            </p>
            <DialogPrimitive.Title className="font-display m-0 text-[21px] font-semibold leading-tight tracking-tight text-foreground sm:text-[27px]">
              {STEPS[step].title}
            </DialogPrimitive.Title>
          </div>

          {/* FIXED HEIGHT so the card never jumps between steps. Tall enough for
              the longest step; anything longer scrolls inside its own panel
              rather than resizing the frame around it. Released below `sm`,
              where a fixed box fights the keyboard and the address bar. */}
          <div className="min-h-0 flex-1 overflow-hidden sm:h-[484px] sm:flex-none">
            <div
              className="flex h-full transition-transform duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              <Step active={step === 0}>
                <p className="body-copy m-0 text-[16px] leading-relaxed text-foreground/90 sm:text-[16.5px]">
                  This archive preserves communications the author received without
                  consent, including material that references coercion, self-harm and
                  euthanasia. It is documentation of what was said to him. It does not
                  reflect his beliefs, and he does not endorse or encourage harm to
                  anyone.
                </p>
                <p className="m-0 mt-4 text-[14px] leading-relaxed text-muted">
                  If this material is difficult for you, step away and come back only if
                  you want to.
                </p>
                <div className="mt-5 border-l-2 border-accent pl-4">
                  <p className="m-0 text-[14px] leading-relaxed text-muted">
                    In the US you can call or text{" "}
                    <a href="tel:988" className="font-medium text-foreground underline underline-offset-4">
                      988
                    </a>{" "}
                    for the Suicide &amp; Crisis Lifeline; elsewhere,{" "}
                    <a
                      href="https://findahelpline.com"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      findahelpline.com
                    </a>
                    .
                  </p>
                </div>
              </Step>

              <Step active={step === 1}>
                <div className="body-copy space-y-3.5 text-[16px] leading-relaxed text-foreground/90 sm:text-[16.5px]">
                  <p className="m-0">
                    <strong className="font-semibold">Perceptual set</strong>{" "}
                    {GATE.perceptual.definition.replace(/^Perceptual set /, "")}
                  </p>
                  <p className="m-0">{GATE.perceptual.story}</p>
                  <p className="m-0 text-[14px] text-muted">{GATE.perceptual.caveat}</p>
                  <p className="m-0">{GATE.perceptual.tie}</p>
                </div>
              </Step>

              <Step active={step === TERMS_STEP} doc>
                <p className="m-0 shrink-0 text-[14px] text-muted">
                  The archive&rsquo;s full disclaimer, in the same words it carries on the
                  site.
                </p>

                <div className="relative mt-2.5 min-h-0 flex-1">
                  <div
                    ref={docRef}
                    onScroll={checkRead}
                    tabIndex={0}
                    role="region"
                    aria-label="Full disclaimer and terms"
                    className="h-full max-h-[52vh] overflow-y-auto overscroll-contain border border-edge bg-foreground/[0.02] px-4 py-4 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-h-none sm:px-5"
                  >
                    <CopyrightTerms variant="gate" />
                  </div>
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-x-px bottom-px h-8 bg-gradient-to-t from-panel transition-opacity duration-200 ${
                      readAll ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>

                {/* The hint is the button's explanation, so it says what is
                    being waited for and then says it is done, rather than
                    vanishing and leaving a dead button with no account of
                    itself. */}
                <p
                  aria-live="polite"
                  className={`m-0 mt-2.5 shrink-0 text-[12px] ${readAll ? "text-foreground" : "text-muted"}`}
                >
                  {readAll
                    ? "Read in full — you can enter the corpus"
                    : "Scroll to the end of the disclaimer to continue"}
                </p>
              </Step>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-edge px-5 py-4 sm:px-8">
            {/* Present on every step, inert on the first — a control that
                appears and disappears moves the primary button under the
                cursor between steps. */}
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
              Back
            </Button>
            <Button disabled={locked} onClick={advance}>
              {STEPS[step].cta}
            </Button>
          </div>
          <p className="m-0 shrink-0 px-5 pb-5 text-[12px] text-muted sm:px-8">{GATE.copyrightLine}</p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* Each step is a full-width slide in the track. `inert` on the inactive ones so
 * a Tab press cannot reach a link on a step that is off-screen. */
function Step({
  children,
  active,
  doc = false,
}: {
  children: React.ReactNode;
  active: boolean;
  doc?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // `inert` is not in this TS lib's HTMLElement yet; the attribute is what
    // does the work and every browser we target honours it.
    const el = ref.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = !active;
  }, [active]);
  return (
    <section
      ref={ref}
      aria-hidden={!active}
      className={`flex w-full shrink-0 flex-col px-5 pb-2 pt-4 sm:px-8 sm:pt-5 ${
        doc ? "overflow-hidden pb-4" : "overflow-y-auto"
      }`}
    >
      {children}
    </section>
  );
}

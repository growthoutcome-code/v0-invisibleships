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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { ChevronDown, Download } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import CopyrightTerms from "@/components/CopyrightTerms";
import { GATE } from "@/lib/gate-content";
import { hasEntered, markEntered, GATE_VERSION, ROLES } from "@/lib/gate";
import { track, registerVisitorProps } from "@/lib/analytics";
import { logGate } from "@/lib/gate-log";
import { DISCLAIMER_TITLE } from "@/lib/disclaimer";
import { CORPUS_LINE, welcomeFor } from "@/lib/gate-languages";

const STEPS = [
  { title: "Welcome to Invisible Ships", cta: "Continue", event: "gate_welcome_viewed" },
  { title: "Perceptual set", cta: "Continue", event: "gate_perceptual_viewed" },
  // Sean, 19 September: the Critical Disclaimer is what has to surface when
  // somebody enters the site, so the step carries its name rather than a
  // generic one. Copyright and terms are the same document, below it.
  { title: DISCLAIMER_TITLE, cta: "Enter the corpus", event: "gate_terms_viewed" },
] as const;

const TERMS_STEP = 2;

// Off since 4 Oct 2026 (Sean: "make sure the gate only fires the first time
// you visit. And maybe every week thereafter", then "once every 30 days");
// the 30-day rule is in lib/gate.ts. From 3 to 4 Oct it was on ("turn the gate back on for visits to
// the home page every time until we get the gate changes worked out"): the gate
// opened on every visit to the home page whatever the device had passed, and
// each of those visits logged a gate_opened, so gate counts for 3-4 Oct are
// inflated. Set to true to bring that back while testing gate changes.
const GATE_ON_EVERY_HOME_VISIT = false;

// Closed without entering (a click outside the card, or Escape). Remembered for
// the browser tab's session only (sessionStorage), so the gate does not reopen
// while the reader moves around the site, including links that reload the page.
// It is not recorded as passed, so it returns on the next visit.
const DISMISSED_KEY = `is_gate_dismissed_${GATE_VERSION}`;
function wasDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

// Shared between the hint paragraph and the footer button's aria-describedby.
const HINT_ID = "gate-terms-hint";

/**
 * The optional "who is reading" question.
 *
 * Nobody is required to answer and nothing is verified, so the counts are not a
 * census and must never be quoted as one — the professionals most worth knowing
 * about are the least likely to identify themselves on an archive about covert
 * harassment. What it buys is SEGMENTATION: the answer rides along as a super
 * property, so every later metric can be read per audience.
 *
 * "This is happening to me or someone I know" is here because it was missing
 * from the first list and is the answer most likely to be given honestly — and
 * the readers it describes are the ones the site most needs to understand.
 */
// The list itself lives in lib/gate.ts — see the note there.

export default function EntryGate() {
  // Starts closed and is opened in an effect: browser storage does not exist
  // during SSR, and rendering it on the server would flash the gate at somebody
  // who has already passed it on this device.
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();

  // The page paints FIRST, then the gate arrives over it. Sean, 15 September:
  // "the site loads quickly, the first part of the site, and then the warning
  // shows up." A reader seeing where they have landed before being asked
  // anything is the whole difference between a welcome and a bouncer. The card
  // then trails the scrim by 180ms (below) so the page is seen to be held back
  // before the panel lands on top of it.
  useEffect(() => {
    const everyHomeVisit = GATE_ON_EVERY_HOME_VISIT && pathname === "/";
    if ((hasEntered() || wasDismissed()) && !everyHomeVisit) return;
    const t = setTimeout(() => {
      // A fresh start each time it opens, since it can now open more than once
      // in one page session (navigating back to the home page).
      setStep(0);
      setRole(null);
      setReadAll(false);
      setProgress(0);
      setOpen(true);
      // The denominator. Without it the funnel starts at "answered the
      // question", which cannot show how many people met the gate and left.
      logGate("gate_opened");
    }, 350);
    return () => clearTimeout(t);
    // pathname: the root layout does not remount on navigation, so this runs
    // again when a reader returns to the home page from inside the site.
  }, [pathname]);

  useEffect(() => {
    if (open) track(STEPS[step].event);
  }, [open, step]);

  // The note for readers in other languages (lib/gate-languages.ts), chosen from
  // the browser's own language setting once the gate opens. The gate never
  // renders on the server, so navigator is always there by the time this runs.
  const welcome = useMemo(
    () => (open ? welcomeFor(navigator.languages?.length ? navigator.languages : [navigator.language]) : null),
    [open],
  );
  // Recorded once, so it is clear whether the note changes how many readers in
  // other languages get past step 1. The browser language already rides on
  // every analytics event; this only marks that the note was shown.
  useEffect(() => {
    if (open && welcome) track("gate_language_welcome_shown", { welcome_language: welcome.lang });
  }, [open, welcome]);

  // Focus goes to the title when the gate opens. Radix focuses the first
  // focusable element by default, which on step 1 is the first answer to the
  // optional question: on 3 Oct it drew a heavy border round "Law enforcement",
  // so the gate opened looking as if an answer had been chosen for the reader.
  const titleRef = useRef<HTMLHeadingElement>(null);

  // --- the scroll condition on step 3 -------------------------------------
  const docRef = useRef<HTMLDivElement>(null);
  const [readAll, setReadAll] = useState(false);
  // How far down the disclaimer they are, 0-1. Distance, not just direction:
  // "scroll to continue" with no sense of how much is left is the part people
  // actually complain about in consent flows.
  const [progress, setProgress] = useState(0);

  const checkRead = useCallback(() => {
    const el = docRef.current;
    if (!el) return;
    const slack = el.scrollHeight - el.clientHeight;
    // Short enough to need no scrolling (a tall window): already read in full.
    if (slack <= 4) {
      setProgress(1);
      setReadAll(true);
      return;
    }
    setProgress(Math.min(1, Math.max(0, el.scrollTop / slack)));
    if (el.scrollTop >= slack - 12) setReadAll(true);
  }, []);

  // Nothing in the gate should be a dead end that only says no. Both the cue
  // inside the panel and the locked button call this, so a reader who does not
  // think to drag inside a box inside a dialog is moved along rather than left
  // pressing a button that refuses to work without explaining itself.
  const scrollDoc = useCallback(() => {
    const el = docRef.current;
    if (!el) return;
    // A panelful at a time, and never less than 140px on a short window.
    //
    // Instant for readers who asked for less motion: scrollBy's "smooth" does not
    // consult prefers-reduced-motion on its own, and a control that exists to help
    // should not be the one thing on the page that ignores that setting.
    //
    // Either way this fires onScroll, so the progress rule and the unlock update
    // exactly as they do when the disclaimer is scrolled by hand.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ top: Math.max(140, el.clientHeight * 0.85), behavior: reduce ? "auto" : "smooth" });
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

  // Sean, 3 Oct 2026: "the gate should close if you click outside the gate."
  // Closing is not entering: nothing is marked as passed, and it is counted
  // separately so the funnel can tell the two apart.
  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* private mode: the gate may reopen on the next page, which is harmless */
    }
    track("gate_dismissed", { gate_step: step + 1 });
    setOpen(false);
  }

  function advance() {
    // aria-disabled keeps this button focusable and clickable (see the footer),
    // so the locked case is handled here rather than by the browser.
    if (locked) {
      scrollDoc();
      return;
    }
    if (step === 0) {
      // Recorded once, on the way out of the welcome. Declining is recorded too:
      // the decline rate is the only thing here that says how much to trust the
      // rest of it.
      if (role && role !== "Prefer not to say") {
        track("gate_role_selected", { visitor_role: role });
        registerVisitorProps({ visitor_role: role });
        logGate("role_selected", role);
      } else {
        track("gate_role_declined", { visitor_role: role ?? "no answer" });
        logGate("role_declined");
      }
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    markEntered();
    track("gate_entered");
    logGate("entered");
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
          // Until 3 Oct nothing dismissed this except the button on the last
          // step. Now a click on the dark area around the card closes it, and
          // so does Escape, its keyboard equivalent (see dismiss()). The
          // archive's pages still carry the standing disclaimer line
          // (components/StandingDisclaimer.tsx).
          //
          // The dark area is part of this element (it covers the screen and
          // centres the card), so a click there arrives as a click on this
          // element itself, not as a Radix "outside" event; those stay ignored.
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            dismiss();
          }}
          // On the home page a click outside the card does NOT close the gate
          // (Sean, 4 Oct 2026: "make sure that if you click outside the gate,
          // it does not shut the gate on the home page"). The home page is the
          // front door, so the gate there stays until the reader enters.
          // Everywhere else the click still closes it, as from 3 Oct.
          onClick={(e) => {
            if (e.target === e.currentTarget && pathname !== "/") dismiss();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            titleRef.current?.focus();
          }}
          className="fixed inset-0 z-[61] flex items-start justify-center overflow-y-auto p-3 focus:outline-none sm:p-4"
        >
          {/* The card is a child rather than the Content element itself.
              Tailwind's -translate-x/y-1/2 centring and the fade-in keyframe
              both write `transform`, and the animation wins (fill-mode both) —
              which left the card uncentred with its footer below the fold on a
              924px window. Centring comes from this flex container now, so
              nothing competes for `transform`, and a window shorter than the
              card scrolls rather than clipping it. */}
          {/* gate-card (globals.css): on phones the card is the height of the
              screen, so Back and Continue stay pinned at the bottom and only the
              step's text scrolls. Until 3 Oct the card grew to fit its content
              and the page scrolled instead, which put Continue 366px below the
              bottom of a 375x667 phone with nothing on screen saying how to go on. */}
          <div className="gate-card my-auto flex w-[92vw] flex-col border border-edge bg-panel shadow-2xl animate-fade-in [animation-delay:180ms] sm:w-[78vw] sm:max-w-[1040px]">
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
            <DialogPrimitive.Title ref={titleRef} tabIndex={-1} className="font-display m-0 focus:outline-none text-[21px] font-semibold leading-tight tracking-tight text-foreground sm:text-[27px]">
              {STEPS[step].title}
            </DialogPrimitive.Title>
          </div>

          {/* FIXED HEIGHT so the card never jumps between steps. Tall enough for
              the longest step; anything longer scrolls inside its own panel
              rather than resizing the frame around it. Below `sm` the card itself
              is the screen's height (gate-card), so this takes whatever the
              header and footer leave. The gate has no text fields, so there is
              no keyboard to fight, and dvh follows the address bar. */}
          <div className="min-h-0 flex-1 overflow-hidden sm:h-[484px] sm:flex-none lg:h-[576px]">
            <div
              className="flex h-full transition-transform duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              <Step active={step === 0}>
                {/* The welcome leads; the warning is a secondary note beneath it,
                    carrying the same left-rule treatment the crisis line had.
                    Sean, 15 September: "this first thing should be welcome to the
                    Invisible Ships website... content warning should be a subline."
                    Nothing the warning said was cut - it was demoted, not softened. */}
                <p className="body-copy m-0 text-[16px] leading-relaxed text-foreground/90 sm:text-[16.5px]">
                  This is a documentary archive: a dated journal, verbatim transcripts of
                  communications received without consent, and research drawn entirely
                  from public records &mdash; court rulings, procurement awards,
                  statistical releases.
                </p>
                <p className="body-copy m-0 mt-3.5 text-[16px] leading-relaxed text-foreground/90 sm:text-[16.5px]">
                  Three short screens before you go in: this one, what the name means, and
                  the disclaimer. Take them at your own pace.
                </p>
                <div className="mt-5 border-l-2 border-edge pl-4">
                  <p className="font-display m-0 text-[11.5px] uppercase tracking-[0.14em] text-muted">
                    Content warning
                  </p>
                  <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
                    Some of this material references coercion, self-harm and euthanasia. It
                    is documentation of what was said to the author; it does not reflect
                    his beliefs, and he does not endorse or encourage harm to anyone. If it
                    is difficult for you, step away and come back only if you want to.
                  </p>
                  <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
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

                {/* Sean, 3 Oct: point readers in other languages to the download,
                    which translates more completely than the pages. In their own
                    language when the browser asks for one we have; otherwise in
                    English. lib/gate-languages.ts holds the text. Below the content
                    warning, which must stay the first thing a phone shows after
                    the welcome itself. */}
                {welcome ? (
                  <div className="mt-5 border border-edge px-4 py-3">
                    <p lang={welcome.lang} dir={welcome.dir} className="m-0 text-[14px] font-semibold text-foreground">
                      {welcome.hello}
                    </p>
                    <p lang={welcome.lang} dir={welcome.dir} className="m-0 mt-1.5 text-[15px] leading-relaxed text-foreground/90">
                      {welcome.text}
                    </p>
                    {/* The download itself, so the advice above is one tap (Sean,
                        3 Oct). The label is in the reader's language; the size
                        stays in figures, which read the same everywhere, beside
                        the button rather than in it (French and German labels
                        overflowed a 360px phone), and in its own left-to-right
                        run so "3.9 MB" never reverses inside Persian or Arabic. The wrapper takes the note's
                        direction, so in those two the button sits on the right.
                        Same route as the site's export dialog, marked as coming
                        from here so /insights can tell the two apart. Every file
                        in the download carries the Critical Disclaimer. */}
                    <div dir={welcome.dir} className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <a
                        href="/api/corpus?from=gate_welcome"
                        download
                        lang={welcome.lang}
                        onClick={() => track("export_downloaded", { from: "gate_welcome", welcome_language: welcome.lang })}
                        className={`${buttonVariants()} h-auto min-h-10 max-w-full gap-2 whitespace-normal py-2 text-start`}
                      >
                        <Download size={15} aria-hidden className="shrink-0" />
                        {welcome.button}
                      </a>
                      <span dir="ltr" className="text-[12.5px] text-muted">
                        .zip &middot; {(CORPUS_SUMMARY.zipBytes / 1e6).toFixed(1)} MB
                      </span>
                    </div>
                    <p className="m-0 mt-2 text-[12.5px] text-muted">
                      Shown because your browser&rsquo;s language is set to {welcome.name}.
                    </p>
                  </div>
                ) : (
                  <p className="m-0 mt-5 text-[15px] leading-relaxed text-foreground/90">{CORPUS_LINE}</p>
                )}
              {/* Full width beneath the welcome, as a row of tags rather than a
                  sidebar. Sean, 15 September: "no sidebar... load those options
                  as pills underneath the main content area." Square-cornered
                  because the whole site is — every rounded-* utility resolves to
                  0 in tailwind.config, deliberately. */}
              <div className="mt-7 border-t border-edge pt-5">
                <p className="font-display m-0 text-[11.5px] uppercase tracking-[0.16em] text-muted">
                  Who is reading? &middot; optional
                </p>
                <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
                  Not required, not checked, and not a condition of entry. Skip it and
                  continue &mdash; it costs you nothing.
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const on = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setRole(on ? null : r)}
                        className={`border px-4 py-2 text-[13.5px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          on
                            ? "border-foreground bg-foreground text-background"
                            : "border-edge text-foreground/85 hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              </Step>

              <Step active={step === 1}>
                {/* The wake arrives first and holds alone; the fleet resolves
                    above it afterwards. That order IS the story — the islanders
                    read the displaced water before they could see the ships — so
                    it is the order of the animation rather than a flourish on
                    top of it. Four vessels, not one: the site is called Invisible
                    Ships. Keyframes live in globals.css beside the loaders. */}
                <svg className="gate-plate" viewBox="0 0 640 104" role="img"
                     aria-label="A figure on a shore. Disturbed water appears first; a line of ships resolves above it afterwards.">
                  <line className="gsea" x1="16" y1="56" x2="624" y2="56" />
                  <line className="gfig" x1="52" y1="78" x2="52" y2="94" />
                  <circle className="gfig" cx="52" cy="71" r="4.5" />
                  {[
                    [296, 330, 66], [372, 414, 74], [322, 356, 82],
                    [436, 470, 64], [486, 524, 78], [540, 572, 70],
                  ].map(([x1, x2, y], i) => (
                    <line key={`w${i}`} className="gwake" x1={x1} y1={y} x2={x2} y2={y}
                          style={{ animationDelay: `${i * 0.14}s` }} />
                  ))}
                  {[300, 388, 474, 558].map((x, i) => (
                    <path key={`s${i}`} className="gship"
                          style={{ animationDelay: `${i * 0.22}s` }}
                          d={`M ${x - 19} 56 q 19 11 38 0 M ${x} 56 l 0 -19 M ${x} 37 l 16 6 l -16 6`} />
                  ))}
                  <line className="gsight" x1="60" y1="70" x2="470" y2="48" />
                </svg>
                <div className="body-copy mt-6 space-y-3.5 text-[16px] leading-relaxed text-foreground/90 sm:text-[16.5px]">
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
                    className="h-full overflow-y-auto overscroll-contain pr-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_.body-copy]:text-[16px] sm:[&_.body-copy]:text-[17px]"
                  >
                    <div className="max-w-[80ch]">
                      <CopyrightTerms variant="gate" />
                    </div>
                  </div>
                  {/* The edge cue and the way out of it, in one place. A
                      gradient alone says "there is more"; it does not say what
                      is being asked of you, and it cannot be acted on. This
                      says both and scrolls a panelful when pressed.

                      Hidden from assistive technology on purpose: the region
                      above is focusable and the hint below is a live region, so
                      a third voice repeating the same sentence is noise. The
                      chevron reuses .scroll-hint from globals.css -- the same
                      six-pixel nudge the home page uses for the same meaning,
                      reduced-motion rule included. */}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-panel via-panel/85 to-transparent pt-12 transition-opacity duration-200 ${
                      readAll ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={scrollDoc}
                      className="pointer-events-auto flex items-center gap-1.5 border border-foreground bg-panel px-3.5 py-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                      Scroll to the end
                      <ChevronDown className="scroll-hint" size={14} />
                    </button>
                  </div>
                </div>

                {/* How much is left, without a percentage to read. A number
                    here would have to sit in the live region below to be
                    announced, and a live region that fires on every scroll tick
                    is worse than no announcement at all -- so the figure lives
                    on this bar, which is a progressbar and not a live region. */}
                <div
                  role="progressbar"
                  aria-label="How much of the disclaimer you have read"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                  className="mt-3 h-[3px] w-full shrink-0 bg-edge"
                >
                  <div
                    className="h-full bg-foreground transition-[width] duration-150 ease-out"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>

                {/* The hint is the button's explanation -- it is what
                    aria-describedby on the footer button points at -- so it says
                    what is being waited for and then says it is done, rather
                    than vanishing and leaving a dead button with no account of
                    itself. */}
                <p
                  id={HINT_ID}
                  aria-live="polite"
                  className={`m-0 mt-2.5 shrink-0 text-[12.5px] ${readAll ? "text-foreground" : "text-muted"}`}
                >
                  {readAll
                    ? "Read in full — you can enter the corpus"
                    : "Scroll to the end of the disclaimer to continue"}
                </p>
              </Step>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-edge px-5 py-4 sm:px-8">
            {/* Present on every step, so the primary button never moves under
                the cursor between steps. Invisible on the first (3 Oct): it
                still holds its place, but a greyed-out Back on the opening
                screen only looked like something broken. */}
            <Button
              variant="outline"
              disabled={step === 0}
              aria-hidden={step === 0}
              className={step === 0 ? "invisible" : undefined}
              onClick={() => setStep(Math.max(0, step - 1))}
            >
              Back
            </Button>
            {/* aria-disabled rather than disabled, deliberately. A `disabled`
                button leaves the tab order, and its description leaves with it:
                somebody tabbing through this footer with a screen reader would
                meet nothing at all and get no account of why they cannot go on.
                Focusable and described, it explains itself -- and pressing it
                scrolls the disclaimer (see advance) instead of doing nothing.
                The opacity is spelled out here because shadcn's variant hangs
                it off `disabled:`, which no longer applies. */}
            <Button
              aria-disabled={locked}
              aria-describedby={step === TERMS_STEP ? HINT_ID : undefined}
              onClick={advance}
              className={locked ? "opacity-50 hover:bg-primary" : undefined}
            >
              {STEPS[step].cta}
            </Button>
          </div>
          <p className="m-0 shrink-0 px-5 pb-5 text-[12px] text-muted sm:px-8">{GATE.copyrightLine}</p>
          </div>
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

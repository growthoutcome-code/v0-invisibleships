"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import CopyrightTerms from "@/components/CopyrightTerms";
import GateAnimation from "@/components/GateAnimation";
import ThemeToggle from "@/components/ThemeToggle";
import ShareMenu from "@/components/ShareMenu";
import { GATE } from "@/lib/gate-content";
import { track } from "@/lib/analytics";

// Homepage share always points at the clean root, even if the visitor arrived
// on a deep link (?entry=…) they haven't entered through yet.
const homeUrl = () => (typeof window !== "undefined" ? window.location.origin + "/" : "");

type Step = "welcome" | "copyright" | "perceptual" | "safety";
const STEP_INDEX: Record<Step, number> = { welcome: 1, copyright: 2, perceptual: 3, safety: 4 };
const STEP_COUNT = 4;

function Progress({ step }: { step: Step }) {
  const i = STEP_INDEX[step];
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      {Array.from({ length: STEP_COUNT }, (_, k) => k + 1).map((n) => (
        <span key={n} className={`h-1.5 transition-all ${n === i ? "w-6 bg-accent" : "w-2 bg-edge"}`} />
      ))}
    </div>
  );
}

// Every text step renders inside a fixed-height panel so Copyright, Perceptual
// Set, and Safety present a consistent ~560px content area (body scrolls, the
// Back/CTA row stays pinned at the bottom).
function Shell({ children, step, copyright }: { children: React.ReactNode; step: Step; copyright: string }) {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div key={step} className="w-full max-w-2xl h-[560px] max-h-[calc(100vh-9rem)] flex flex-col animate-fade-in">{children}</div>
      </div>
      <Progress step={step} />
      <footer className="text-center text-xs text-muted py-6">{copyright}</footer>
    </main>
  );
}

export default function AccessGate({ onEnter }: { onEnter: () => void }) {
  const [step, setStep] = useState<Step>("welcome");

  // Copyright step: the CTA stays disabled until the visitor scrolls through the
  // whole document (or if it already fits without scrolling).
  const [canAgree, setCanAgree] = useState(false);
  const copyrightScrollRef = useRef<HTMLDivElement>(null);
  const checkCopyrightScrolled = () => {
    const el = copyrightScrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setCanAgree(true);
  };
  useEffect(() => {
    if (step !== "copyright") return;
    setCanAgree(false);
    const id = requestAnimationFrame(() => {
      const el = copyrightScrollRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 8) setCanAgree(true);
    });
    return () => cancelAnimationFrame(id);
  }, [step]);

  useEffect(() => {
    track("gate_welcome_viewed");
  }, []);
  useEffect(() => {
    if (step === "copyright") track("gate_copyright_viewed");
    if (step === "perceptual") track("gate_perceptual_viewed");
    if (step === "safety") track("gate_safety_viewed");
  }, [step]);

  const finish = () => {
    // Persistence is the caller's responsibility (see lib/gate.ts). We keep the
    // gate in-memory during the MVP so it re-shows on every browser refresh, so
    // AccessGate deliberately writes NO storage here.
    track("gate_entered");
    onEnter();
  };

  if (step === "welcome") {
    return (
      <main className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1">
          <ShareMenu title="Invisible Ships — a firsthand documentary archive" url={homeUrl()} label="" align="right" />
          <ThemeToggle />
        </div>
        {/* Left 40% — content + button, floated with padding */}
        <div className="md:w-[40%] md:min-w-[360px] flex flex-col px-8 sm:px-12 lg:px-16 py-12 order-2 md:order-1">
          <div className="flex-1 flex flex-col justify-center animate-fade-in max-w-md">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">{GATE.welcome.headline}</h1>
            <p className="mt-4 font-serif text-xl sm:text-2xl text-foreground/80 leading-snug">{GATE.welcome.subline}</p>
            <p className="mt-3 text-sm text-muted">{GATE.welcome.supporting}</p>
            <p className="mt-5 font-serif text-[15px] text-foreground/70 leading-relaxed">{GATE.welcome.contentWarning}</p>
            <div className="mt-7">
              <Button
                size="lg"
                onClick={() => {
                  track("gate_age_confirmed");
                  track("gate_enter_clicked");
                  setStep("copyright");
                }}
              >
                {GATE.welcome.cta}
              </Button>
              <p className="mt-4 text-[13px] text-foreground/70">{GATE.welcome.ageLine}</p>
            </div>
          </div>
          <div className="mt-8 max-w-md">
            <div className="flex items-center gap-2">
              {Array.from({ length: STEP_COUNT }, (_, k) => k + 1).map((n) => (
                <span key={n} className={`h-1.5 ${n === 1 ? "w-6 bg-accent" : "w-2 bg-edge"}`} />
              ))}
            </div>
            <div className="text-xs text-muted pt-4">{GATE.welcome.copyright}</div>
          </div>
        </div>
        {/* Right 60% — animation panel */}
        <div className="relative md:w-[60%] min-h-[42vh] md:min-h-screen order-1 md:order-2 overflow-hidden bg-background">
          <GateAnimation fill />
        </div>
      </main>
    );
  }

  if (step === "copyright") {
    return (
      <Shell step="copyright" copyright={GATE.copyrightLine}>
        <div className="flex flex-col h-full">
          <div className="shrink-0">
            <p className="text-sm text-muted mb-2">{GATE.copyright.intro}</p>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Copyright &amp; Terms of Use</h2>
          </div>
          <div ref={copyrightScrollRef} onScroll={checkCopyrightScrolled} className="flex-1 overflow-y-auto pr-2 py-1">
            <CopyrightTerms variant="gate" />
          </div>
          <div className="shrink-0 mt-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep("welcome")}>Back</Button>
            <div className="ml-auto flex items-center gap-3">
              {!canAgree && <span className="text-xs text-muted">Scroll to continue</span>}
              <Button disabled={!canAgree} onClick={() => setStep("perceptual")}>{GATE.copyright.cta}</Button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === "perceptual") {
    return (
      <Shell step="perceptual" copyright={GATE.copyrightLine}>
        <div className="flex flex-col h-full">
          <div className="shrink-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted mb-2">{GATE.perceptual.eyebrow}</p>
            <h2 className="font-display text-3xl font-semibold text-foreground mb-4">{GATE.perceptual.title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 font-serif text-[22px] leading-[1.6] text-foreground/90 space-y-4">
            <p>{GATE.perceptual.definition}</p>
            <p>{GATE.perceptual.story}</p>
            <p className="text-foreground/60 italic">{GATE.perceptual.caveat}</p>
            <p>{GATE.perceptual.tie}</p>
          </div>
          <div className="shrink-0 mt-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep("copyright")}>Back</Button>
            <Button size="lg" className="ml-auto" onClick={() => setStep("safety")}>{GATE.perceptual.cta}</Button>
          </div>
        </div>
      </Shell>
    );
  }

  // safety (final step)
  return (
    <Shell step="safety" copyright={GATE.copyrightLine}>
      <div className="flex flex-col h-full">
        <div className="shrink-0">
          <p className="text-xs uppercase tracking-[0.14em] text-muted mb-2">{GATE.safety.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold text-foreground mb-4">{GATE.safety.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 font-serif text-[22px] leading-[1.65] text-foreground/90 space-y-4">
          <p>{GATE.safety.body}</p>
          <p>{GATE.safety.distress}</p>
          <p className="text-foreground">{GATE.safety.crisis}</p>
          <p className="text-foreground/70">{GATE.safety.guidance}</p>
        </div>
        <div className="shrink-0 mt-6 flex items-center gap-3">
          <Button variant="outline" onClick={() => setStep("perceptual")}>Back</Button>
          <Button size="lg" className="ml-auto" onClick={finish}>{GATE.safety.cta}</Button>
        </div>
      </div>
    </Shell>
  );
}

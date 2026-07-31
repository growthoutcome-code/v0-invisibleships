"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import CopyrightTerms from "@/components/CopyrightTerms";
import { GATE } from "@/lib/gate-content";
import { track } from "@/lib/analytics";

type Step = "welcome" | "copyright";
const STEP_INDEX: Record<Step, number> = { welcome: 1, copyright: 2 };

function Progress({ step }: { step: Step }) {
  const i = STEP_INDEX[step];
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      {[1, 2].map((n) => (
        <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-accent" : "w-2 bg-edge"}`} />
      ))}
    </div>
  );
}

function Shell({ children, step, copyright }: { children: React.ReactNode; step: Step; copyright: string }) {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div key={step} className="w-full max-w-2xl animate-fade-in">{children}</div>
      </div>
      <Progress step={step} />
      <footer className="text-center text-xs text-muted py-6">{copyright}</footer>
    </main>
  );
}

export default function AccessGate({ onEnter }: { onEnter: () => void }) {
  const [step, setStep] = useState<Step>("welcome");

  useEffect(() => {
    track("gate_welcome_viewed");
  }, []);
  useEffect(() => {
    if (step === "copyright") track("gate_copyright_viewed");
  }, [step]);

  const finish = () => {
    try {
      localStorage.setItem("is_gate_ok", String(Date.now()));
    } catch {
      /* ignore */
    }
    track("gate_entered");
    onEnter();
  };

  if (step === "welcome") {
    return (
      <Shell step="welcome" copyright={GATE.welcome.copyright}>
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">{GATE.welcome.headline}</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-xl mx-auto">{GATE.welcome.subline}</p>
          <p className="mt-3 text-sm text-muted max-w-xl mx-auto">{GATE.welcome.supporting}</p>
          <p className="mt-6 text-sm text-slate-400 max-w-xl mx-auto">{GATE.welcome.contentWarning}</p>
          <div className="mt-8">
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
            <p className="mt-3 text-xs text-muted max-w-md mx-auto">{GATE.welcome.ageLine}</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell step="copyright" copyright={GATE.copyrightLine}>
      <div>
        <p className="text-sm text-muted mb-2">{GATE.copyright.intro}</p>
        <h2 className="text-2xl font-semibold text-white mb-5">Copyright &amp; Terms of Use</h2>
        <div className="max-h-[52vh] overflow-y-auto pr-3 border border-edge rounded-lg p-5 bg-panel/40">
          <CopyrightTerms />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" onClick={() => setStep("welcome")}>Back</Button>
          <Button className="ml-auto" onClick={finish}>{GATE.copyright.cta}</Button>
        </div>
      </div>
    </Shell>
  );
}

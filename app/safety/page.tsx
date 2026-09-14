import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SafetyNote from "@/components/SafetyNote";
import { GATE } from "@/lib/gate-content";

/**
 * /safety — the gate's fourth screen, on its own URL.
 *
 * This note carried the crisis line, and it was the last thing a reader saw
 * before entering. When the gate came down it was the one screen with nowhere
 * else to go: the welcome copy became the home page, the terms are at
 * /disclaimer, and the perceptual-set essay is at /why. This page exists so
 * that removing the gate removed a wall and not a word.
 *
 * The text still comes from lib/gate-content.ts, unedited, so this page and the
 * content-warning toast cannot drift apart from each other.
 */
export const metadata: Metadata = {
  title: "A Note on Safety — Invisible Ships",
  description:
    "What this archive contains, why it is preserved, and where to find support if the material is distressing.",
  alternates: { canonical: "/safety" },
};

export default function Page() {
  const s = GATE.safety;
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <p className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
          {s.eyebrow}
        </p>
        <h1 className="font-display mt-2 mb-8 text-4xl font-semibold text-foreground">{s.title}</h1>

        <SafetyNote />

        <div className="mt-10 flex flex-wrap gap-4 border-t border-edge pt-8">
          <a
            href="/documents"
            className="inline-flex h-12 items-center rounded-md border border-edge px-6 text-[15px] hover:border-foreground"
          >
            The Personal Protection Plan
          </a>
          <a
            href="/disclaimer"
            className="inline-flex h-12 items-center rounded-md border border-edge px-6 text-[15px] hover:border-foreground"
          >
            The full disclaimer
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}

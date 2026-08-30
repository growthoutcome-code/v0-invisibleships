"use client";

/**
 * The content warning that replaced the age gate.
 *
 * WHY THE GATE WENT
 * -----------------
 * Sean, 30 August: "no eighteen restriction for the site. When they hit the
 * home page, they have just a warning in the bottom right that's dismissable."
 *
 * The four-screen gate cost more than it protected. Every link Sean sent landed
 * a reader on "I am 18 or older" instead of the thing he was pointing at, and
 * it never protected the material from anything but a person: robots.ts allows
 * the whole site and sitemap.ts advertises all 438 journal URLs, so the gate
 * stopped exactly the readers it was meant to reach and nobody else.
 *
 * Its four screens were not deleted. Welcome is the home page, Copyright is
 * /disclaimer, the perceptual-set essay is /why, and the safety note — the one
 * that carries the crisis line — is /safety. The words in lib/gate-content.ts
 * are untouched and this component quotes them.
 *
 * WHAT THIS HAS TO GET RIGHT
 * --------------------------
 * A dismissible toast is the only warning on the site now, so it has to say
 * what is actually in the material rather than clearing a throat. It names
 * coercion, self-harm and euthanasia; it says the transcripts are what was said
 * TO the author and not his views, which is the load-bearing legal sentence in
 * the disclaimer; and it carries 988 in the warning itself rather than one
 * click away, because somebody who needs that number should not have to
 * navigate for it.
 *
 * It is not a modal. It takes no focus, traps nothing, blocks no content and
 * closes nothing behind it. Dismissal lasts the browser session — the same
 * lifetime the gate used, so a fresh session shows it again and a shared
 * computer shows it to the next person.
 */
import { useEffect, useState } from "react";
import { SafetyDialog } from "@/components/LegalDialogs";
import { GATE } from "@/lib/gate-content";

const KEY = "is_content_warning_v1";

export default function ContentWarning() {
  // Starts hidden and is switched on in an effect: sessionStorage does not
  // exist during SSR, and rendering it on the server would flash the warning at
  // somebody who has already dismissed it.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      setShow(true); // storage denied: warn every time rather than never
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      /* private mode: the warning simply returns on the next page */
    }
  }

  return (
    <aside
      role="region"
      aria-label="Content warning"
      className="fixed inset-x-4 bottom-4 z-50 max-w-[400px] border border-foreground bg-background p-5 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <p className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-foreground">
        Content warning
      </p>

      <p className="body-copy m-0 mt-3 text-[14px] leading-relaxed text-foreground/90">
        This archive preserves communications the author received without consent,
        including material that references coercion, self-harm and euthanasia. It is
        documentation of what was said to him. It does not reflect his beliefs, and he
        does not endorse or encourage harm to anyone.
      </p>

      <p className="m-0 mt-3 text-[13px] leading-relaxed text-muted">
        If this material is difficult for you, step away and come back only if you want
        to. In the US you can call or text{" "}
        <a href="tel:988" className="text-foreground underline underline-offset-4">
          988
        </a>{" "}
        for the Suicide &amp; Crisis Lifeline; elsewhere,{" "}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noreferrer noopener"
          className="text-foreground underline underline-offset-4"
        >
          findahelpline.com
        </a>
        .
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={dismiss}
          className="font-display inline-flex h-10 items-center bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background"
        >
          I understand
        </button>
        {/* Opens in place. A warning that navigates you away from what you
            were about to read is a second gate wearing different clothes. */}
        <SafetyDialog>
          <button
            type="button"
            className="text-[13px] text-muted underline underline-offset-4 hover:text-foreground"
          >
            The full safety note
          </button>
        </SafetyDialog>
      </div>

      {/* Sourced from the gate's own wording so the two cannot drift. If this
          assertion ever fires, the safety copy moved and this toast is stale. */}
      {process.env.NODE_ENV !== "production" && !GATE.safety.crisis.includes("988") ? (
        <p className="mt-3 text-[12px] text-foreground">
          DEV: GATE.safety.crisis no longer mentions 988 — update this warning.
        </p>
      ) : null}
    </aside>
  );
}

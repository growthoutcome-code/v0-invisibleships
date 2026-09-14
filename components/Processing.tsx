"use client";

/**
 * The indeterminate processing state.
 *
 * Sean, 10 September: "we need a processing state for loading the corpus. So
 * when I'm on the home page and I click on an example why isn't any of this in
 * the news, I get this loading corpus thing. Let's build an animation that is
 * an indeterminate processing state that we can use that is desktop and mobile
 * friendly, for loading information."
 *
 * WHAT IT REPLACED. A line of grey text reading "Loading corpus..." — static,
 * indistinguishable from a page that has finished loading and simply has
 * nothing in it. The dataset is sixteen JSON shards; on a phone that is a real
 * wait, and a reader who arrived from a link on the home page has no reason to
 * believe anything is coming.
 *
 * WHY INDETERMINATE AND NOT A PERCENTAGE. The shards are fetched in parallel
 * and the browser cannot say how much of the whole is done, so a percentage
 * would be invented. An honest bar says only "something is still moving",
 * which happens to be the whole message.
 *
 * ACCESSIBILITY. `role="status"` with `aria-live="polite"` announces the label
 * once, without interrupting; the bar itself is `aria-hidden` because it
 * carries no information the label does not. Reduced motion holds a third of
 * the track still rather than removing it (see the rule in globals.css) — the
 * state must still be visible to a reader who asked for less movement.
 *
 * MOBILE. Percentage-based sweeps and a full-width track, so one rule covers a
 * 320px phone and a wide desktop. Nothing here has a fixed pixel width.
 */

export default function Processing({
  label = "Loading",
  /** `block` fills its column and centres under a heading; `inline` is for a
   *  panel that is already narrow, like a transcript body swapping in. */
  variant = "block",
  className = "",
}: {
  label?: string;
  variant?: "block" | "inline";
  className?: string;
}) {
  const inline = variant === "inline";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${inline ? "py-6" : "py-20"} ${className}`}
    >
      <div className={inline ? "max-w-[280px]" : "mx-auto w-full max-w-[420px] px-5"}>
        <div
          aria-hidden="true"
          className="proc-bar h-[3px] w-full rounded-full bg-foreground/10"
        />
        <p
          className={`m-0 mt-4 text-[15px] text-muted ${inline ? "" : "text-center"}`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

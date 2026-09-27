"use client";

import { useEffect, useState } from "react";
import { readDeviceOptOut, setDeviceOptOut } from "@/lib/analytics";

/**
 * The opt-out, at the bottom of the page and styled as the consequential action it is.
 *
 * It used to be the first element inside the "How this is measured" dialog, which
 * meant a reader had to open a dialog from a link near the top of the page to find
 * it. Sean, 27 September: it belongs at the bottom, and it should look destructive.
 * He is right on both counts — an opt-out is an action, and actions belong on the
 * page rather than behind a link, while its position at the end reflects that it is
 * terminal rather than primary.
 *
 * WHAT IT DOES NOT DO, and the copy must keep saying so: it stops counting from now
 * on. It does not delete visits already recorded. Styling it as destructive is honest
 * about consequence; implying deletion would not be, and on this site of all sites an
 * overpromise about data removal is the wrong thing to ship. If a delete path is ever
 * wanted it is separate work.
 */
export default function OptOutSection() {
  // null until mounted: the server cannot know this browser's answer, and rendering a
  // guess would flash the wrong state.
  const [out, setOut] = useState<boolean | null>(null);
  useEffect(() => setOut(readDeviceOptOut()), []);

  // The heading and the fine print render on the server; only the two stateful bits
  // wait for mount. An earlier version returned an empty placeholder until hydration,
  // which meant the whole section was missing from the served HTML — invisible to a
  // reader with JavaScript disabled, and to anyone checking whether it shipped.
  //
  // What is NOT done here: defaulting the status line to "counted" before mount. It
  // would remove the skeleton, at the cost of briefly telling someone who has opted
  // out that they are being counted. That is the one sentence on this page that must
  // never be wrong, so it waits.
  return (
    <section className="mt-12 border-t border-edge pt-8">
      <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
        Your own device
      </h2>

      {out === null ? (
        <p className="m-0 mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
          Checking whether this device is counted&hellip;
        </p>
      ) : (
        <>
          <p className="m-0 mt-3 max-w-3xl text-[15px] leading-relaxed text-foreground/85">
            {out
              ? "This device is not counted. Nothing about your visits is being recorded, and it will stay that way until you turn it back on here."
              : "This device is counted, anonymously, in the numbers on this page. You can stop that."}
          </p>

          <button
            type="button"
            onClick={() => {
              setDeviceOptOut(!out);
              setOut(!out);
            }}
            className={
              out
                ? "font-display mt-5 inline-flex h-11 items-center border border-edge px-5 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
                : "font-display mt-5 inline-flex h-11 items-center border border-[#b3261e] px-5 text-[12px] font-medium uppercase tracking-[0.14em] text-[#b3261e] transition-colors hover:bg-[#b3261e] hover:text-background"
            }
          >
            {out ? "Start counting this device again" : "Stop counting this device"}
          </button>
        </>
      )}

      <p className="m-0 mt-4 max-w-3xl text-[13px] leading-relaxed text-muted">
        Stored as one preference on this device and nowhere else. It stops the page counts, the
        download counter and the gate counter together, and takes effect immediately rather than on
        the next page.{" "}
        <strong className="font-normal text-foreground/85">
          It does not delete visits already recorded
        </strong>{" "}
        &mdash; it stops new ones being counted.
      </p>
    </section>
  );
}

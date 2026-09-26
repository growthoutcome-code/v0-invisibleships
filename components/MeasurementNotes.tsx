"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Everything the measurement page used to say in prose, behind one link — plus
 * the control that acts on it.
 *
 * Sean, 26 September: "we need to hide disclaimers behind links and pop-ups...
 * nothing but a nice clean analytics dashboard." So the page carries numbers and
 * this carries the argument.
 *
 * THE OPT-OUT IS HERE RATHER THAN IN A BANNER, and that is the substantive
 * choice. A cookie banner is a notice people click past, stacked on top of a
 * consent gate they already read. A switch on the page that publishes the
 * numbers is a thing a reader can actually use, and it is the same mechanism the
 * author uses on his own devices: one cookie, honoured by the browser and by
 * every server route.
 */
const OPT_OUT_COOKIE = "is_no_analytics";
const OPT_OUT_LS = "is:no-analytics";

function readOptOut(): boolean {
  try {
    if (new RegExp(`(?:^|;\\s*)${OPT_OUT_COOKIE}=1`).test(document.cookie)) return true;
  } catch {
    /* no-op */
  }
  try {
    return localStorage.getItem(OPT_OUT_LS) === "1";
  } catch {
    return false;
  }
}

function OptOutControl() {
  // null until mounted: the server does not know this browser's answer, and
  // rendering a guess would flash the wrong state.
  const [out, setOut] = useState<boolean | null>(null);
  useEffect(() => setOut(readOptOut()), []);

  function set(next: boolean) {
    try {
      document.cookie = `${OPT_OUT_COOKIE}=${next ? "1" : ""}; path=/; max-age=${next ? 315360000 : 0}; samesite=lax`;
    } catch {
      /* no-op */
    }
    try {
      if (next) localStorage.setItem(OPT_OUT_LS, "1");
      else localStorage.removeItem(OPT_OUT_LS);
    } catch {
      /* no-op */
    }
    setOut(next);
  }

  if (out === null) return null;

  return (
    <div className="border border-edge p-4">
      <p className="m-0 text-[14px] leading-relaxed text-foreground/85">
        {out
          ? "This device is not counted. Nothing about your visits is recorded."
          : "This device is counted, anonymously, in the numbers on this page."}
      </p>
      <button
        type="button"
        onClick={() => set(!out)}
        className="font-display mt-3 inline-flex h-10 items-center border border-edge px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
      >
        {out ? "Start counting this device" : "Stop counting this device"}
      </button>
      <p className="m-0 mt-3 text-[13px] leading-relaxed text-muted">
        Stored as one preference on this device and nowhere else. It also stops the
        download counter and the gate counter, not only the page counts.
      </p>
    </div>
  );
}

export default function MeasurementNotes({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">How this is measured</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-5 text-[15px] leading-relaxed text-foreground/85">
            <OptOutControl />

            <div>
              <p className="font-display m-0 text-[13px] uppercase tracking-[0.14em] text-muted">
                What is never recorded
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>No name, no account, no email. There is nothing here to sign in to.</li>
                <li>
                  No IP address. The download endpoint has never forwarded one and none is stored in any
                  table. Country and city are resolved at the network edge, so the address itself does
                  not travel.
                </li>
                <li>No cursor tracking, no scroll heatmaps, no advertising or data-broker tags.</li>
                <li>
                  The gate&rsquo;s optional question is a count, not a profile. It is attached to no
                  person and verified by nobody &mdash; anyone can pick anything.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-display m-0 text-[13px] uppercase tracking-[0.14em] text-muted">
                Who is not counted
              </p>
              <p className="m-0 mt-2">
                The author&rsquo;s own devices and networks, every preview deployment, local
                development, and any reader who has switched counting off above. An archive whose
                traffic figure counts its own author is reporting nothing; these exclusions are why the
                numbers here are small, and they are the point. Two things the exclusions cannot
                remove: a crawler that renders pages counts as a visit, and a session of the
                author&rsquo;s from a network nobody listed counts too.
              </p>
            </div>

            <div>
              <p className="font-display m-0 text-[13px] uppercase tracking-[0.14em] text-muted">
                Why this page exists
              </p>
              <p className="m-0 mt-2">
                Because an archive that documents being watched should not quietly watch its own
                readers. Anything it does record is published here, in the same numbers the author
                sees. There is no second, better dashboard behind this one. If a future survey is
                added, its results appear here in the same form: aggregate, anonymous, unverified.
              </p>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

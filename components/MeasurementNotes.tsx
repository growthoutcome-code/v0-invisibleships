"use client";

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
 * THE OPT-OUT USED TO LIVE HERE AND NO LONGER DOES. It is at the bottom of
 * /insights, in components/OptOutSection.tsx, because an opt-out buried as the first
 * element of a dialog opened from a link near the top of the page is not findable.
 * Sean, 27 September. This dialog keeps the explanation; the page carries the action.
 *
 * THAT OPT-OUT IS THE ONLY ONE THE SITE OFFERS, and that is the substantive choice.
 * A fourth gate screen asking permission to count page views was built on 26
 * September and deliberately not shipped (Sean: "that seems weird... let people
 * opt out or don't show it at all"). Counting page views is ordinary site
 * maintenance; a consent wall in front of an archive overstates what is
 * happening and adds friction to the one thing the site is short of, which is
 * readers getting in. The trade was made with eyes open: no consent asked means
 * no consent to rely on, which is why session replay is off rather than merely
 * gated. What page views need is a plain notice and a working switch, and this
 * is the switch, using the same cookie the author uses on his own devices and
 * honoured by the browser and by every server route.
 */
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
                <li>
                  No session replay. Nothing plays back what happened inside a page &mdash; no
                  cursor, no scrolling, no clicks, no typing. Replay was switched off on 26
                  September 2026 and the site is built so it cannot restart on its own.
                </li>
                <li>No scroll heatmaps, no advertising or data-broker tags.</li>
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
                Because the numbers are the reader&rsquo;s as much as the author&rsquo;s. Counting
                page views is ordinary site maintenance &mdash; it is how anyone running a website
                learns which pages people actually open &mdash; and there is no reason to do it
                privately. Anything the site records is published here, in the same numbers the
                author sees. There is no second, better dashboard behind this one. If a future survey
                is added, its results appear here in the same form: aggregate, anonymous, unverified.
              </p>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

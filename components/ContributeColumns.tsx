import { SafetyDialog } from "@/components/LegalDialogs";

/**
 * THE THREE "WHAT CAN YOU DO?" COLUMNS, in one place.
 *
 * Shown in the home page's Contribute section and in the Contribute bottom
 * section under every other page (Sean, 2 Oct 2026: "it may be very important
 * to include the contribute bottom section on every single page"). One
 * component, so the safety wording in "Protect your household" can never say
 * one thing on the home page and another under a journal entry.
 *
 * Moved here unchanged from app/page.tsx, with its comments. The reasoning for
 * the section as a whole (no protective advice, the safety notice as the
 * aside) stays beside the home section that introduces it.
 */
export default function ContributeColumns({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-x-12 gap-y-12 xl:grid-cols-3 ${className}`}>
      <div>
        <h3 className="font-display m-0 text-[21px] font-semibold text-foreground">
          Meet the documented explanations first
        </h3>
        <p className="body-copy mt-2 text-[18px] text-foreground/85">
          A feeling of presence can be produced in a laboratory in healthy people.
          Pulsed radio-frequency energy is genuinely heard as clicks inside the head
          &mdash; a published effect since 1961. Neither fact settles anything about
          what you have experienced. Both are worth knowing before the frightening
          explanations, because they are the ones that can be checked.
        </p>
        {/* A WAY ON FROM EACH COLUMN (Sean, 14 September): "we need a
            button for each of the three column callouts... let's point
            each of those three columns to a specific glossary term or
            idea."

            LABELLED WITH THE DESTINATION, not "Learn more". Three
            identical buttons reading "Learn more" tell a reader nothing
            about which one is worth the click, and on a page this dense
            that is a wasted trip. The button says where it goes.

            ALL THREE GO TO CONCEPTS, not the glossary. A glossary entry
            defines a word; each of these columns needs the argument
            behind it. The glossary is reachable from the links-out block
            at the foot of the section. */}
          <a
            href="/concepts/what-produces-the-feeling"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground/[0.07] px-4 text-[15px] font-medium text-foreground hover:bg-foreground/[0.12]"
          >
            Your house is not haunted
          </a>
      </div>
      {/* PROTECT YOUR HOUSEHOLD (Sean, 10 September): "never go outside
          looking for the people communicating and never ever invite
          someone in your home."

          Both rules work whatever is actually happening, which is the only
          reason they belong on a page that will not say what is happening.
          A person who goes outside at night to find a voice, or opens the
          door to someone who says they can explain it, is exposed to
          ordinary danger from ordinary people — and that is true whether
          the voice is a neighbour, a transmitter, or an illness.

          WHAT THIS DELIBERATELY DOES NOT SAY. It does not tell a reader
          what might be done to them if they ask for help. Naming those
          consequences would frighten the exact person least able to carry
          it, and would put a reason not to call an ambulance on a page
          read by people in crisis. The standing decision holds: the site
          cannot protect anyone physically and must not say it can — so
          this points at the people who can and stops there. */}
      <div>
        <h3 className="font-display m-0 text-[21px] font-semibold text-foreground">
          Protect your household
        </h3>
        <p className="body-copy mt-2 text-[18px] text-foreground/85">
          Do not go outside looking for whoever you believe is speaking to you, and
          do not let anyone into your home. Do not answer or signal back. You cannot identify who you
          would be answering, and everything that follows from being wrong about
          that lands on your household. If you are frightened for your immediate
          safety, that is what emergency services are for &mdash; this site cannot
          see you or reach you, and the{" "}
          <SafetyDialog>
            <button type="button" className="text-foreground underline underline-offset-4">
              safety notice
            </button>
          </SafetyDialog>{" "}
          is where the people who can are listed.
        </p>
          <a
            href="/concepts/can-you-record-it"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground/[0.07] px-4 text-[15px] font-medium text-foreground hover:bg-foreground/[0.12]"
          >
            Can you record it?
          </a>
      </div>
      <div>
        <h3 className="font-display m-0 text-[21px] font-semibold text-foreground">
          Keep your own record
        </h3>
        <p className="body-copy mt-2 text-[18px] text-foreground/85">
          You do not need an account, permission, or this site to begin. Date every
          entry, note where you were, write what was said in the words it was said
          in, and leave it unsmoothed. That is the entire standard the archive in
          front of you was built to &mdash; and a contemporaneous record is what
          separates testimony from recollection later on.
        </p>
          <a
            href="/concepts/no-column-for-you"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground/[0.07] px-4 text-[15px] font-medium text-foreground hover:bg-foreground/[0.12]"
          >
            There is no column for you
          </a>
      </div>
    </div>
  );
}

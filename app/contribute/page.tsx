import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

/**
 * /contribute — where the nav's register call-to-action lands.
 *
 * The recorder and accounts live on the `capture` branch and are not finished,
 * so this page does not offer a sign-up form it cannot honour. What it does
 * offer is the part that has to exist BEFORE the form does: a plain account of
 * what contributing costs, what it cannot promise, and what a person should do
 * to protect themselves. Sean, 28 August: "there is no such thing as complete
 * immunity. But what we want to do is educate the registrar on risks and best
 * practices for them."
 *
 * Deliberately not here: an email capture box. Collecting addresses for a
 * feature that has no ship date creates a list of people interested in this
 * subject, held by a site with one maintainer. That list is a risk to them and
 * it buys nothing until the recorder works.
 */
export const metadata: Metadata = {
  title: "Contribute an account — Invisible Ships",
  description:
    "What it means to add your own dated account to this archive: what is asked of you, what cannot be promised, and how to protect yourself before you record anything.",
  alternates: { canonical: "/contribute" },
};

const RISKS: { h: string; p: string }[] = [
  {
    h: "Your own words can identify you even when your name is not attached",
    p: "A street, an employer, a shift pattern, a distinctive turn of phrase, the name of a neighbour — any one of them can be enough for somebody who already knows part of the answer. Removing your name is the easiest step and the least protective one.",
  },
  {
    h: "Nothing here can be un-published with certainty",
    p: "You will be able to edit or delete anything of yours at any time, and deletion removes it from this site and from every file this site distributes afterwards. It cannot reach a copy somebody already downloaded. Assume anything published is permanent, and decide on that basis.",
  },
  {
    h: "If you are a public employee, speech about your work is not simply free",
    p: "Public-sector whistleblower protection in the United States is real, narrow and procedural: it often depends on who you told, in what order, and whether you were speaking as a citizen or as part of your duties. Talk to a lawyer or a union representative before you publish, not after.",
  },
  {
    h: "Naming a person is a different act from describing what happened to you",
    p: "An account of your own experience is yours to give. An accusation against a named individual or agency exposes you, and this archive, to a claim you would have to defend. Describe what you experienced and what you observed. Leave the conclusion to the reader.",
  },
];

const PRACTICES: string[] = [
  "Record what happened and when, in your own words, as close to the time as you can. A dated, specific, unremarkable account is worth more than a dramatic one.",
  "Say what you are unsure of, in the entry itself. “I think it was around nine” is stronger evidence than a time you rounded off for tidiness.",
  "Name anyone who could also have heard or seen it. Another person is the one thing that can ever move an account out of “verified by nobody”.",
  "Keep your own copy, somewhere this site cannot reach. You should never need this archive in order to hold your own record.",
  "Do not include anything that is not yours to publish — another person's medical detail, a document you are under an obligation not to share, a photograph of somebody who did not agree to it.",
  "If you are frightened of the consequences of publishing, do not publish. A private, dated record still counts, and it will still be there if you change your mind.",
];

export default function Page() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-14">
        <p className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">Contribute</p>
        <h1 className="font-display mt-2 mb-6 text-4xl font-semibold text-foreground">
          Adding your own account
        </h1>

        <div className="body-copy space-y-5 text-[17px] leading-relaxed text-foreground/90">
          <p className="m-0">
            This archive holds one person&rsquo;s dated record alongside research anyone can
            check. A second person&rsquo;s record, kept to the same standard, is worth more
            than either of them alone &mdash; not because two accounts corroborate each
            other, they do not, but because a pattern that survives independent
            description is a different kind of object from a story.
          </p>
          <p className="m-0">
            The people this is most useful to are often the people it is most costly for.
            That includes officers and public employees describing what they are being
            asked to do. If that is you, read the next section before anything else.
          </p>
        </div>

        <section className="mt-12 border-t border-edge pt-10">
          <h2 className="font-display m-0 text-2xl font-semibold text-foreground">
            What this cannot promise you
          </h2>
          <p className="body-copy mt-3 text-foreground/85">
            There is no such thing as complete anonymity or complete legal protection, and
            a site that told you otherwise would be doing you harm. These are the four
            risks that matter most.
          </p>
          <div className="mt-6 space-y-6">
            {RISKS.map((r) => (
              <div key={r.h} className="border-l-2 border-edge pl-5">
                <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">{r.h}</h3>
                <p className="body-copy mt-2 text-[15px] text-foreground/85">{r.p}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[14px] text-muted">
            This is not legal advice and the author is not a lawyer. If any of it applies
            to you, the right next step is a conversation with somebody who is.
          </p>
        </section>

        <section className="mt-12 border-t border-edge pt-10">
          <h2 className="font-display m-0 text-2xl font-semibold text-foreground">
            How to record something that will still be worth reading in five years
          </h2>
          <ol className="mt-6 m-0 list-none space-y-4 p-0">
            {PRACTICES.map((t, n) => (
              <li key={n} className="body-copy relative pl-8 text-[15px] text-foreground/85">
                <span aria-hidden className="font-display absolute left-0 top-0 font-semibold text-foreground">
                  {n + 1}.
                </span>
                {t}
              </li>
            ))}
          </ol>
        </section>

        {/* The Contribute button in the header points here, so this section is
            what that call to action resolves to. When accounts open it becomes
            the sign-up form and nothing above it has to change. Until then it
            says plainly that it is not open, because a call to action that
            lands on a promise is worse than one that lands on an explanation. */}
        <section id="account" className="mt-12 border-t border-edge pt-10">
          <h2 className="font-display m-0 text-2xl font-semibold text-foreground">
            Creating an account
          </h2>
          <p className="body-copy mt-3 text-foreground/85">
            An account gives you a private, dated record that only you can read, an
            in-browser recorder that transcribes on your own device rather than sending
            your voice to a transcription service, and the right to edit or delete any
            word of it at any time without asking anyone.
          </p>
          <div className="mt-6 border border-edge p-6">
            <p className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
              Not open yet
            </p>
            <p className="body-copy m-0 mt-3 text-[15px] text-foreground/85">
              Accounts and the recorder are built and being tested. This page will carry
              the sign-up form the day they open, and this notice will be gone.
            </p>
            <p className="m-0 mt-3 text-[14px] text-muted">
              There is no waiting list and no address to leave. A list of people
              interested in this subject is itself a risk to those people, and it would
              buy them nothing before the recorder works.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/disclaimer#copyright"
              className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
            >
              Read the sharing terms first
            </a>
            <a
              href="/journal"
              className="inline-flex h-12 items-center rounded-md border border-edge px-6 text-[15px] hover:border-foreground"
            >
              See what an entry looks like
            </a>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}

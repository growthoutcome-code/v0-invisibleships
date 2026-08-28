/**
 * What happens in the twenty seconds after somebody stops recording.
 *
 * This is the most delicate moment in the product. They have just spoken aloud
 * something being done to them, into a machine, possibly while it was still
 * happening. Two things are true at once: the metadata is worth far more now
 * than it will ever be again, and they may not want to be here.
 *
 * So: one question at a time, every one skippable, none of them required, and
 * an exit at every step that keeps the recording. A form with six fields would
 * be faster to build and would get answered once.
 *
 * The questions are chosen, not generated. An AI could read the transcript and
 * ask something specific — that is a later upgrade and it costs money per
 * recording. What is missing from the record IS the question set, and asking
 * only for what is actually blank is most of the value for none of the cost.
 */
import { useMemo, useState } from "react";
import { type CaptureEntry, saveEdits } from "@/lib/capture";

type Step = {
  key: "location" | "context" | "witnesses" | "publish" | "thanks";
  /** Skipped when this returns false — never ask for something already known. */
  needed: (e: CaptureEntry) => boolean;
  prompt: string;
  help?: string;
  placeholder?: string;
};

const STEPS: Step[] = [
  {
    key: "location",
    needed: (e) => !e.location,
    prompt: "Where were you?",
    help: "As rough or as exact as you want. “At home”, “outside the library”, a street name — whatever you would want to read back in a year.",
    placeholder: "At home",
  },
  {
    key: "context",
    needed: (e) => !e.context,
    prompt: "What was happening just before?",
    help: "The minute before is often the part people forget, and it is usually the part that matters.",
    placeholder: "I had just come in from the car",
  },
  {
    key: "witnesses",
    needed: (e) => !e.witnesses,
    // The one field that can change what an entry IS. Testimony becomes
    // documented only through something outside the account itself, and another
    // person who heard it is the most likely something.
    prompt: "Could anyone else hear it?",
    help: "Anyone nearby, whether or not they said so. If someone else heard it, that is the one thing that could ever move this out of “verified by nobody”.",
    placeholder: "My neighbour was in her yard",
  },
  {
    key: "publish",
    needed: (e) => e.wants_publish === null || e.wants_publish === undefined,
    prompt: "Would you like this published?",
    help: "",
  },
  { key: "thanks", needed: () => true, prompt: "", help: "" },
];

export default function AfterCapture({
  entry, onClose,
}: { entry: CaptureEntry; onClose: () => void }) {
  const steps = useMemo(() => STEPS.filter((s) => s.needed(entry)), [entry]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const step = steps[i];

  async function commit(patch: Partial<CaptureEntry>) {
    setBusy(true);
    try { await saveEdits(entry.id, patch as never); } catch { /* the entry is saved; metadata is a bonus */ }
    setBusy(false);
    setValue("");
    setI((n) => n + 1);
  }

  if (!step) { onClose(); return null; }

  // The last beat. Understated on purpose: telling somebody who feels
  // disbelieved that they are brave can land as being managed. Naming what the
  // act cost, and confirming the thing they actually want to know — that it is
  // saved and it is theirs — does more.
  if (step.key === "thanks") {
    return (
      <Card>
        <h4 className="font-display text-xl font-semibold mb-2">That&rsquo;s recorded.</h4>
        <p className="body-copy text-foreground/85 m-0 mb-4">
          Saying that out loud took something. It is dated, it is yours, and nobody
          else can see it. You can change any word of it or delete it entirely,
          whenever you want, without asking anyone.
        </p>
        <button type="button" onClick={onClose}
          className="h-11 px-5 rounded-md bg-foreground text-background text-[15px] font-medium">
          Done
        </button>
      </Card>
    );
  }

  if (step.key === "publish") {
    return (
      <Card>
        <Progress i={i} n={steps.length} />
        <h4 className="font-display text-xl font-semibold mb-2">{step.prompt}</h4>
        <p className="text-[15px] text-foreground/80 m-0 mb-4">
          The shared feed is not open yet, so nothing is public either way — this
          only records what you would like. You can change it at any time, and
          before anything of yours ever appears, a person removes details that
          could identify you.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy}
            onClick={() => commit({ wants_publish: true, asked_at: new Date().toISOString() })}
            className="h-11 px-5 rounded-md bg-foreground text-background text-[15px] font-medium disabled:opacity-40">
            Yes, when it opens
          </button>
          <button type="button" disabled={busy}
            onClick={() => commit({ wants_publish: false, asked_at: new Date().toISOString() })}
            className="h-11 px-5 rounded-md border border-edge hover:border-foreground text-[15px] disabled:opacity-40">
            No, keep it private
          </button>
          <button type="button" disabled={busy} onClick={() => setI((n) => n + 1)}
            className="h-11 px-3 text-[14px] text-muted hover:text-foreground underline underline-offset-4">
            Decide later
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Progress i={i} n={steps.length} />
      <h4 className="font-display text-xl font-semibold mb-2">{step.prompt}</h4>
      {step.help && <p className="text-[14px] text-muted m-0 mb-4">{step.help}</p>}
      <form
        onSubmit={(ev) => { ev.preventDefault(); commit({ [step.key]: value.trim() || null } as Partial<CaptureEntry>); }}>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={step.placeholder}
          className="w-full h-11 border border-edge rounded-md bg-transparent px-3 mb-4
                     focus:outline-none focus:border-foreground" />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy}
            className="h-11 px-5 rounded-md bg-foreground text-background text-[15px] font-medium disabled:opacity-40">
            Next
          </button>
          <button type="button" disabled={busy} onClick={() => setI((n) => n + 1)}
            className="text-[14px] text-muted hover:text-foreground underline underline-offset-4">
            Skip
          </button>
          <button type="button" onClick={onClose}
            className="ml-auto text-[14px] text-muted hover:text-foreground underline underline-offset-4">
            Stop asking
          </button>
        </div>
      </form>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="border border-edge rounded-lg p-6 mb-6 bg-foreground/[0.03]">{children}</div>;
}

function Progress({ i, n }: { i: number; n: number }) {
  return (
    <p className="text-[12px] uppercase tracking-wider text-muted m-0 mb-3">
      {i + 1} of {n} · every one optional
    </p>
  );
}

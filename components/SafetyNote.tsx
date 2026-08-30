/**
 * The safety note, rendered once and used in three places: the /safety page,
 * the modal the footer opens, and the modal the content warning opens.
 *
 * One owner on purpose. This text carries a crisis line, and the failure mode
 * this project keeps hitting is a second copy of something that quietly stops
 * matching the first. The words stay in lib/gate-content.ts, unedited from when
 * they were the gate's fourth screen.
 */
import { GATE } from "@/lib/gate-content";

export default function SafetyNote({ compact = false }: { compact?: boolean }) {
  const s = GATE.safety;
  return (
    <div
      className={`body-copy space-y-4 text-foreground/90 ${
        compact ? "text-[15px] leading-relaxed" : "space-y-5 text-[17px] leading-relaxed"
      }`}
    >
      <p className="m-0">{s.body}</p>
      <p className="m-0">{s.distress}</p>
      {/* The crisis line is the reason this exists, so it is set apart rather
          than left as one paragraph among four. */}
      <p className="m-0 border-l-2 border-foreground pl-5 font-semibold text-foreground">
        {s.crisis}
      </p>
      <p className="m-0">{s.guidance}</p>
    </div>
  );
}

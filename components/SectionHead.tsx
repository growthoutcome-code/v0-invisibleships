/**
 * One heading pattern for every section inside the Research tabs (Sean, 30 Sep
 * 2026: "make sure content within tabs has consistent headings e.g. h2 followed
 * by brief subline"). An H2, then one short muted line saying what the section
 * shows. Same size and spacing on Timeline, Government Cloud, Public Health and
 * Crime; the Government Cloud report's own HTML matches it in GovCloudReport.tsx
 * (.gov-report h2 / .subline).
 */
export const H2_CLASS = "font-display font-semibold text-foreground text-[24px] leading-tight mt-0 mb-2";
export const SUB_CLASS = "text-[17px] leading-relaxed text-muted measure mt-0 mb-6";

export default function SectionHead({ title, sub, id }: { title: React.ReactNode; sub?: React.ReactNode; id?: string }) {
  return (
    <>
      <h2 id={id} className={H2_CLASS}>{title}</h2>
      {sub && <p className={SUB_CLASS}>{sub}</p>}
    </>
  );
}

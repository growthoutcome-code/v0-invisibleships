/**
 * Documented anti-trafficking enforcement, from agency releases.
 *
 * WHY THIS EXISTS, AND WHAT IT IS NOT. Sean, 30 August: "we tried to build a
 * chart that illustrated an increase in arrests. What we determined was there
 * is no arrest increase in the United States of America… I want to reward
 * arrest data if we have it."
 *
 * That finding stands. No national series in this archive shows arrests rising;
 * the FBI's own 2025 release has violent crime falling 9.3%, the largest
 * year-to-year decline since estimation began in 1936. What DOES exist, and
 * what the DHS subscription carries, is OPERATION-LEVEL counts: named
 * operations, on dated releases, with numbers attached.
 *
 * So this is not a trend and the section says so. It is a record of specific
 * work, and the number that matters in it is not the arrests.
 *
 * SCOPE IS DELIBERATE: anti-trafficking only. The same subscription carries
 * far larger immigration-enforcement counts — see the note in the section — and
 * those are a different question from the one this archive asks.
 */
export type Operation = {
  label: string;
  when: string;
  /** The headline count, and what it counts. */
  value: number;
  unit: string;
  note: string;
  source: { publisher: string; title: string; href: string };
};

const DHS_WORLD_CUP = {
  publisher: "DHS",
  title: "DHS Highlights Successful Arrests and Rescues in Crackdown on Human Trafficking During FIFA World Cup",
  href: "https://www.dhs.gov/news/2026/07/29/dhs-highlights-successful-arrests-and-rescues-crackdown-human-trafficking-during",
};
const DHS_CCHT = {
  publisher: "DHS",
  title: "Center for Countering Human Trafficking, FY2024 Annual Report",
  href: "https://www.dhs.gov/news/2025/08/13/dhs-center-countering-human-trafficking-releases-fiscal-year-2024-annual-report",
};

export const TRAFFICKING_OPS: Operation[] = [
  {
    label: "HSI trafficking arrests",
    when: "FY2024",
    value: 2545,
    unit: "arrests",
    note: "from 1,686 sex-trafficking and forced-labour investigations opened in the year.",
    source: DHS_CCHT,
  },
  {
    label: "HSI investigations opened",
    when: "FY2024",
    value: 1686,
    unit: "investigations",
    note: "sex trafficking and forced labour, initiated in the fiscal year.",
    source: DHS_CCHT,
  },
  {
    label: "World Cup operation arrests",
    when: "July 2026",
    value: 905,
    unit: "arrests",
    note: "across HSI-led operations around the 2026 FIFA World Cup.",
    source: DHS_WORLD_CUP,
  },
  {
    label: "People rescued",
    when: "July 2026",
    value: 180,
    unit: "trafficking victims",
    note: "recovered in the same operations. This is the figure that measures the outcome.",
    source: DHS_WORLD_CUP,
  },
  {
    label: "Children among them",
    when: "July 2026",
    value: 30,
    unit: "children",
    note: "of the 180 people recovered.",
    source: DHS_WORLD_CUP,
  },
];

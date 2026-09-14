/**
 * The headline figures for the three research verticals, on the home page.
 *
 * Each figure is copied from the finding document that owns it — the same
 * numbers, with the same source, that public/data/{health,crime}/md/*_01_finding.md
 * publish and the corpus ships. Every one carries a public link, so a reader
 * who doubts a number on the front page is one click from the agency that
 * issued it.
 *
 * These are not derived from the tables the way govCloud() is, because the
 * finding documents do interpretive work — "the ~30% increase is real but
 * describes a two-decade climb, not a post-2021 surge" — that no table column
 * carries. Copying the figure and its citation is honest; re-deriving it here
 * would quietly invent a second interpretation.
 */
export type DataFigure = {
  stat: string;
  line: string;
  source: { label: string; href: string };
};

export const HEALTH_FIGURES: DataFigure[] = [
  {
    stat: "+30%",
    line: "rise in the US suicide rate between 1999 and 2016, with significant increases in 44 states. It is a two-decade climb, not a recent surge — the distinction the headline usually loses.",
    source: {
      label: "CDC MMWR · Vital Signs, June 2018",
      href: "https://www.cdc.gov/mmwr/volumes/67/wr/mm6722a1.htm",
    },
  },
  {
    stat: "49,476",
    line: "deaths in 2022 — the highest suicide rate since 1941. The 2024 final figure fell to 13.7 per 100,000, a genuine decline.",
    source: {
      label: "CDC/NCHS · Data Brief 509",
      href: "https://www.cdc.gov/nchs/products/databriefs/db509.htm",
    },
  },
  {
    stat: "−27%",
    line: "the world's suicide rate over roughly the same period, while the United States rose. Two lines moving in opposite directions is the finding.",
    source: {
      label: "WHO Global Health Estimates",
      href: "https://www.who.int/data/gho/data/themes/mental-health/suicide-rates",
    },
  },
];

export const CRIME_FIGURES: DataFigure[] = [
  {
    stat: "6 lanes",
    line: "moving in different directions at once. One quadrupled, one is at a record low, one is at a 22-year high. There is no single number for whether crime rose.",
    source: {
      label: "Crime — the finding",
      href: "/data/crime",
    },
  },
  {
    stat: "107,941",
    line: "overdose deaths at the 2022 peak, up from 16,849 in 1999 — the steepest rise of any lane, and it has been falling since.",
    source: {
      label: "CDC/NCHS drug overdose mortality",
      href: "https://www.cdc.gov/nchs/nvss/vsrr/drug-overdose-data.htm",
    },
  },
  {
    stat: "no count",
    line: "exists for harassment. The two categories this archive is most about — harassment and home invasion — have no national lane at all, because nobody counts them.",
    source: {
      label: "FBI CJIS · NIBRS User Manual 2025.0",
      href: "https://le.fbi.gov/file-repository/ucr/nibrs-user-manual-2025.pdf",
    },
  },
];

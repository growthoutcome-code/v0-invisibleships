/**
 * The site's canonical terms — disclaimer, copyright, sharing, measurement — as
 * DATA rather than JSX.
 *
 * Why this file exists
 * -------------------
 * These ~2,000 words lived inside components/CopyrightTerms.tsx. That put them
 * in the one place nothing can export from: a component. The downloadable
 * corpus therefore shipped `meta/IS_META_copyright.md` and
 * `meta/IS_META_disclaimer.md` — verbatim extracts of the ORIGINAL Google Doc,
 * frozen in August — while the site said something different. Seventy-five
 * files in the corpus pointed a reader at the frozen version.
 *
 * That is the same failure this repository has now hit four times: content
 * arriving by a route no script owns reaches no reader, and no guard notices.
 * `scripts/check_content_inventory.py` counts words in lib/ for exactly this
 * reason. Terms now live here, so:
 *
 *   site      ← components/CopyrightTerms.tsx renders this
 *   corpus    ← scripts/export_terms_md.mjs writes meta/IS_META_terms.md
 *   guard     ← check_download_matches_site.py compares the two
 *
 * One source. Change it once and both move.
 *
 * The two historical extracts stay in the corpus untouched. They carry
 * `source_doc_id` frontmatter and are accurate records of what the terms said
 * when the archive was first written; rewriting them would falsify the
 * extraction, which is the one property the corpus cannot afford to lose. They
 * are what the terms WERE. This file is what they ARE.
 *
 * Inline markup — a deliberately tiny subset, so the same string renders as
 * JSX on the site and as Markdown in the download with no translation:
 *
 *   **bold**            strong
 *   *italic*            emphasis
 *   `code`              inline code
 *   [label](href)       link
 */

export type TermsBlock =
  | { kind: "p"; text: string }
  | { kind: "subhead"; text: string }
  | { kind: "note"; text: string }
  | { kind: "ul"; items: string[] };

export type TermsSection = {
  id: string;
  heading: string;
  /** Label in the on-page contents. Omitted sections stay out of it. */
  toc?: string;
  /**
   * Shown on the entry gate. The gate is a consent screen: only what a visitor
   * is agreeing to before entering. A consent screen nobody finishes reading is
   * worse than a short one.
   */
  gate: boolean;
  blocks: TermsBlock[];
};

export const TERMS: TermsSection[] = [
  {
    id: "critical",
    heading: "Critical Disclaimer on the Journal and its Transcripts",
    toc: "Critical Disclaimer",
    gate: true,
    blocks: [
      {
        kind: "note",
        text:
          "This applies to the Journal — the dated entries and verbatim transcripts. It does not apply to the Research or Concepts sections, which are drawn from public records and carry their own basis and origin labels.",
      },
      {
        kind: "p",
        text:
          "The Journal records communications the author received without consent. The transcripts are preserved as documentation of what was said to him. Their content is *external communication* and does NOT represent the author's beliefs, views, or intent. The author denies any affiliation with, or belief in, the content of those messages — particularly any promoting illegal activity, narcotic use, or violence.",
      },
      { kind: "subhead", text: "Why accusations appear in this record" },
      {
        kind: "p",
        text:
          "The transcripts carry voices the author could not identify, verify, or question. Where a speaker names a person or an organisation, this archive records that the name was said. It makes no finding that the named party did anything, and a reader should draw none.",
      },
      {
        kind: "p",
        text:
          "That is not a dismissal of the speaker. This archive has no way to establish who any speaker was, why they spoke, or whether what they said was true, and it does not pretend otherwise. Some of what was said may have been coercion. Some may have been reputational attack used as an instrument, in the documented pattern set out under *Ruin first, then rescue*. And some may have been a person taking a real risk to say something they believed to be true. The record does not settle which. This archive will not resolve by assertion what it cannot resolve by evidence.",
      },
      { kind: "subhead", text: "What would change that" },
      {
        kind: "p",
        text:
          "A statement in these transcripts is **testimony**: a dated first-person report, verified by nobody, and labelled as such wherever it appears. If any part of it is independently corroborated — by a document, a ruling, a public record — it stops being testimony and is republished in the Research section under its own citation, where anyone can check it. That route is open, and it is the only route. Nothing moves from the Journal into the record by repetition, by plausibility, or because it would matter if it were true.",
      },
      { kind: "subhead", text: "On named organisations" },
      {
        kind: "p",
        text:
          "Law-enforcement agencies, government bodies and technology companies employ large numbers of people. A statement naming an organisation is not a statement about any individual within it, and this archive does not treat it as one. No agency, company or official named anywhere in the Journal has been shown by this archive to have done anything wrong, and the author asserts no such thing.",
      },
    ],
  },
  {
    id: "separation",
    heading: "The Research and Concepts sections are a different standard",
    toc: "Journal vs Research",
    gate: true,
    blocks: [
      {
        kind: "p",
        text:
          "They were assembled with AI assistance from public records — court rulings, regulator decisions, statistical agencies, published investigations — and every figure resolves to the document it came from. Where those sources record a finding against a named organisation, this site reports that finding and cites it. That is a citation of an adjudicated public record, not an accusation by the author. The two bodies of work are never blended, and neither corroborates the other.",
      },
    ],
  },
  {
    id: "research",
    heading: "How the research data was gathered",
    toc: "How the research data was gathered",
    gate: false,
    blocks: [
      {
        kind: "p",
        text:
          "The Data section of this site — the government-cloud record and the public-health statistics — was assembled with AI assistance. That means an AI system searched public sources, extracted figures, and organised them; a human directed the work and reviewed the results. It does not mean the figures are guesses. Every number is linked to the document it came from, and the headline figures were re-derived a second time from those documents before publication.",
      },
      { kind: "subhead", text: "What the evidence grades mean" },
      {
        kind: "p",
        text:
          "Tier A is an official statistical agency or a peer-reviewed study that was retrieved and read. Tier B is reputable secondary reporting, or official data still marked provisional. Tier C is claimed but not verified — market-research forecasts, for example. A grade describes how well sourced a figure is, not how true its interpretation might be.",
      },
      { kind: "subhead", text: "How to read the charts" },
      {
        kind: "p",
        text:
          "The charts use a fixed visual grammar, and it is the same everywhere on the site. A **dotted stretch** means those years are not Tier A. **Hollow points** mean the series is sampled with gaps, so the straight run between two distant years is not data. **Points with no line** are irregular snapshots, which would become a fiction if joined up. A **gap** is a year the publisher does not publish, left as a gap rather than bridged. A **break with a marked year** is different again: both sides are published, but the measurement changed between them, so the line is split rather than drawn through — and where that happens the summary states each half separately instead of quoting one percentage across two different measurements.",
      },
      {
        kind: "p",
        text:
          "Where lanes are **indexed**, each is set to its own first year = 100. That chart shows direction and relative change only, never size: two lanes at the same height are not two equal quantities. Where a chart offers a **year-over-year change** view, the change is computed only between consecutive published years, and never across a break or a gap.",
      },
      { kind: "subhead", text: "A count of reports is not a count of events" },
      {
        kind: "p",
        text:
          "Several series on this site count what reached an institution rather than what happened: records entered, reports received, arrests made, screens completed. Those move when reporting rules change, when stigma falls, when an agency builds a new intake channel, or when a survey adds agencies to its universe — and the publishers frequently say so themselves. Where a rise is attributed by its own publisher to reporting rather than to events, that attribution is carried with the figure. A series that stops has not shown that the thing stopped; it has shown that the publishing stopped, and those are recorded separately.",
      },
      { kind: "subhead", text: "What this data does not do" },
      {
        kind: "p",
        text:
          "It does not establish that any organisation did anything wrong. It does not connect any system, deployment, or statistic to the author's experience or to any individual's. Where two things appear near each other in time or place, that is a co-occurrence and nothing more; the site says so wherever such pairings are shown. Causes are reported only as *attributed* — who claimed what, in which document — never asserted by this site.",
      },
      { kind: "subhead", text: "What is missing is also a finding" },
      {
        kind: "p",
        text:
          "Public records are uneven. Some countries publish little; some deaths are recorded under the wrong cause; some registers do not exist. Where the record is thin, that is documented rather than quietly skipped, and it should be read as a limit on the data, not as evidence of absence. Coverage is compiled from a United States vantage point, and a low count for a jurisdiction may reflect limited public reporting rather than limited activity.",
      },
      { kind: "subhead", text: "Scope and use" },
      {
        kind: "p",
        text:
          "This is independent research from public sources, offered for information only. It is not legal or investment advice. Company and agency names are used for identification; no affiliation or endorsement is implied. Award and investment values mix contract ceilings, announced pledges and projected savings, and enforcement figures are agency-reported (arrests are not convictions). Tier B and Tier C entries are not established fact.",
      },
      { kind: "subhead", text: "Health statistics" },
      {
        kind: "p",
        text:
          "The public-health data reports rates and counts only, following recognised safe-reporting practice. Provisional figures are marked as such and are revised later by the agencies that publish them. If this material is difficult for you: in the US, call or text [988](https://988lifeline.org); elsewhere, [findahelpline.com](https://findahelpline.com).",
      },
    ],
  },
  {
    id: "author-note",
    heading: "A Note from the Author",
    gate: true,
    blocks: [
      {
        kind: "p",
        text:
          "This report is a product of my personal research and lived experience. My goal in sharing it is to offer a unique perspective and contribute to the conversation.",
      },
    ],
  },
  {
    id: "copyright",
    heading: "Copyright, and how you may use this work",
    toc: "Copyright & sharing",
    gate: true,
    blocks: [
      {
        kind: "p",
        text:
          "Copyright © 2026 Sean C. Harris. All rights reserved. Within that, the following are expressly permitted:",
      },
      {
        kind: "ul",
        items: [
          "**Share it.** The report and the downloadable corpus may be redistributed in their complete, original form.",
          "**Quote it.** Passages may be quoted for reporting, research, comment, teaching or criticism, with attribution to Sean C. Harris and invisibleships.com.",
          "**Check it with an assistant.** The corpus is built to be handed to an AI system, whole or file by file, to verify or interrogate the findings. That use is intended and permitted.",
        ],
      },
      { kind: "p", text: "Not permitted:" },
      {
        kind: "ul",
        items: [
          "**Presenting this work, or any finding in it, as your own.** Attribution is the condition on everything above.",
          "**Republishing it in altered form**, or issuing a modified version that could be mistaken for the original.",
          "**Commercial use** without written permission.",
        ],
      },
    ],
  },
  {
    id: "measurement",
    heading: "What this site measures",
    toc: "What this site measures",
    gate: true,
    blocks: [
      {
        kind: "p",
        text:
          "This site records usage analytics — pages opened, sections viewed, and which sources readers follow — using cookies, and it may record a session replay: a playback of how a page was used, with all typed input masked. This is processed on the author's behalf by PostHog and Google Analytics. It is never sold, and no attempt is made to identify individual readers.",
      },
      {
        kind: "p",
        text:
          "Given what this archive is about, that is stated plainly rather than buried. If you would rather not be measured at all, open any page with [?analytics=off](/?analytics=off) — this browser then stops being recorded on this device, and stays that way.",
      },
    ],
  },
  {
    id: "contact",
    heading: "Contact, and corrections",
    toc: "Contact & corrections",
    gate: true,
    blocks: [
      {
        kind: "p",
        text:
          "If a figure here is wrong, or a source has been superseded, please write and it will be corrected. All inquiries and permission requests are welcome: Sean C. Harris, +1 (303) 901-2150, growthoutcome@gmail.com",
      },
    ],
  },
];

// Editable content for the Author, Documents, and Disclaimer sections + extra glossary terms.

export const AUTHOR = {
  summary:
    "Invisible Ships is a firsthand, in-progress record of what its author describes as neuro-tech terrorism — a daily journal of dated entries and verbatim transcripts alongside technical analysis, spanning 2,800+ pages. It documents external communications and events as they were experienced, preserved as evidence, with the author's copyright and Critical Disclaimer carried throughout.",
  bio:
    "I'm Sean C. Harris — a displaced tech worker, a father, and a martial-arts black belt. My personal exposure to this threatening phenomenon began in the fall of 2024 and continues through today. This ongoing record is, in part, a request for life-saving assistance; it contains a daily perspective on the neuro-tech terrorism, including manually captured transcripts and technical analysis.",
  contact: "growthoutcome@gmail.com · +1 (303) 901-2150",
  // Drop a portrait at /public/author.jpg to replace the placeholder.
  photo: "/author.jpg",
};

export type SiteDoc = { title: string; subline: string; description: string; url: string };
const doc = (id: string) => `https://docs.google.com/document/d/${id}/`;

export const DOCUMENTS: SiteDoc[] = [
  {
    title: "Plan for Justice",
    subline: "A legal & discovery framework.",
    description:
      "The most extensive reference in the series — a structured plan for legal action: household verification, forensic cross-examination, an evidence/discovery framework, and a restitution matrix.",
    url: doc("1gzmU6tTSu6-qHU-b3FQRxPS58i-BAivjdktiu7mgrB8"),
  },
  {
    title: "Personal Protection Plan",
    subline: "Household & personal safety guidance.",
    description:
      "A practical protection framework covering household verification, anti-destabilization measures, and day-to-day personal-safety practices developed in response to the phenomenon.",
    url: doc("1kY_452-jTwhXpABLDKvv8mc0-PE56-6iPPk5BpKtbF8"),
  },
  {
    title: "Neuro-tech in Law Enforcement & Zersetzung",
    subline: "Analysis of neuro-tech and Zersetzung tactics.",
    description:
      "Examines the intersection of neuro-technology with law-enforcement contexts and Stasi-style Zersetzung (psychological-attrition) tactics.",
    url: doc("1lEFuRTRZLYrzJV3ZRkVvn1viVSVxZoB6Yg0PidbcMYg"),
  },
  {
    title: "Impact of Neuro-tech Zersetzung Tactics",
    subline: "The effects of amplified Zersetzung.",
    description:
      "A focused analysis of the impact of neuro-tech-amplified Zersetzung tactics on a targeted individual.",
    url: doc("1EfA-X5c0JyPaf3iwgYOTMeo3ZmCFa-zAZEnXdxgAoQc"),
  },
  {
    title: "Asset Protection Program Comparison Report",
    subline: "Comparative analysis of protection programs.",
    description:
      "A comparison of asset- and personal-protection programs and their applicability to the situation.",
    url: doc("1HdOVp1rCNKS31bOPgzpG-h-ZFON8K36C9nCqMndlOQU"),
  },
  {
    title: "LLM Analysis of External Statements",
    subline: "AI-assisted analysis of the transcripts.",
    description:
      "An analysis of the recorded external statements, categorized by motivation and theme.",
    url: doc("1VNEL5FEU5tZTocNbY-OM8CiO6P5IuJ2mPmtQ2tFAzUU"),
  },
];

// Extra glossary terms. Definition line 1 = pronunciation. Items flagged below are drafts to confirm.
export type Term = { slug: string; term: string; definition: string };
export const EXTRA_GLOSSARY: Term[] = [
  { slug: "diving", term: "Diving", definition: "DY·ving\n\nThe process of establishing a brain-to-brain connection with another human being or animal. A military / telepathic term of art." },
  { slug: "zersetzung-tactics", term: "Zersetzung tactics", definition: "tsair·ZET·soong\n\nFrom the German for “decomposition.” Covert psychological-attrition techniques — disruption, gaslighting, isolation, and manufactured setbacks — used to quietly destabilize and discredit a targeted person without overt force; historically associated with the East German Stasi. In this work, such tactics applied and amplified through neuro-technology." },
  { slug: "phantom-sensations", term: "Phantom sensations", definition: "FAN·tuhm sen·SAY·shuhns\n\nBodily sensations — touch, pressure, heat, pain, vibration, or movement — perceived without a corresponding external physical stimulus. Clinically associated with phantom-limb phenomena; here, used for sensations experienced without a physical source, including those induced externally." },
  { slug: "neuro-engagement", term: "Neuro-engagement", definition: "NOOR·oh·en·GAYJ·muhnt\n\nDirect, sustained interaction between an external system or party and a person's nervous system — a channel through which signals can be sent to, or read from, the brain." },
  { slug: "necrosis-neuro-science", term: "Necrosis neuro-science", definition: "nuh·KROH·sis NOOR·oh·sy·uhns\n\nNecrosis is the death of living tissue. Used in this work for the study or claimed application of neuro-technology in relation to the degeneration or death of tissue." },
  { slug: "targeted-individual", term: "Targeted individual (TI)", definition: "TAR·gi·tid in·di·VIJ·oo·uhl\n\nA person who reports being subjected to sustained, coordinated surveillance and harassment, often described as involving remote or technological means." },
  { slug: "voice-to-skull", term: "Voice-to-skull (V2K)", definition: "voyss·too·skuhl · synthetic telepathy\n\nThe claimed transmission of audible speech or sound perceived inside the head without an external acoustic source; also called synthetic telepathy." },
  { slug: "gang-stalking", term: "Gang stalking", definition: "gang STAWK·ing\n\nCoordinated surveillance and harassment of a single individual by multiple people." },
  { slug: "gaslighting", term: "Gaslighting", definition: "GASS·ly·ting\n\nManipulation designed to make a person doubt their own perception, memory, or sanity." },
  { slug: "directed-energy", term: "Directed-energy", definition: "dih·REK·tid EN·er·jee\n\nFocused electromagnetic, acoustic, or other energy aimed at a target; invoked in claims of remote physical effects." },
  { slug: "no-touch-torture", term: "No-touch torture", definition: "noh·tuhch TOR·cher\n\nCoercion or harm inflicted without physical contact — e.g., sensory, psychological, or sleep-deprivation methods." },
  { slug: "breaching", term: "Breaching", definition: "BREE·ching\n\nA term used in this work for a process of gaining access to or establishing a connection with a person's cognition. (Definition pending author confirmation.)" },
];

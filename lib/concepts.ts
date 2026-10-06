/**
 * Core concepts for invisibleships.com/concepts.
 *
 * Every concept carries a visible BASIS, extending the evidence-tier discipline
 * from sources to claims:
 *
 *   documented  — a source, ruling or official record supports it directly
 *   structural  — it follows from what the dataset does or does not contain
 *   pattern     — an observation drawn from experience, offered as an observation
 *   testimony   — a dated first-person report of what the author experienced or
 *                 was told. Verified by nobody. Distinct from `pattern`: pattern
 *                 is a generalisation the author drew, testimony is a single
 *                 thing that was said or happened, on a date.
 *
 * A reader who rejects every `pattern` can still rely on every `documented` entry.
 * That separation is the point; never blend two bases inside one concept.
 *
 * A second, ORTHOGONAL axis records who formed the claim:
 *
 *   ai      — derived by AI analysis of the dataset
 *   author  — Sean's own observation, from experience
 *
 * The two axes are independent: an AI analysis can be documented or structural,
 * and an author's observation is usually — but not necessarily — a pattern.
 *
 * Figures below are verified against public/data/tables/*.json.
 */

export type Basis = "documented" | "structural" | "pattern" | "testimony";
export type Origin = "ai" | "author";
export type Verification = "unverified" | "partially_verified" | "verified";

/**
 * A THIRD axis, independent of the other two (Sean, 2026-08-26).
 *
 * `origin` says who formed a claim and `basis` says what it rests on. Neither
 * says what it is ABOUT, so at 35 entries a reader had no way to see that five
 * concern neurotechnology or that nine are really about method. Theme is the
 * subject axis and carries no evidential weight whatever.
 */
export type Audience =
  | "household" | "investigators" | "policy" | "clinicians" | "press";

export type Theme =
  | "record" | "procurement" | "surveillance"
  | "neurotech" | "coercion" | "health" | "experience";

export type Concept = {
  id: string;
  origin: Origin;
  basis: Basis;
  /** Subject axis. Required, so a new concept cannot be added without one. */
  theme: Theme;
  /**
   * Who this is USEFUL to — a fourth axis, and the only one about the reader
   * rather than the claim. Array-valued because a concept usually serves more
   * than one. Carries no evidential weight; a household entry is not weaker
   * than a policy one.
   */
  audience: Audience[];
  /**
   * The journal's themes (lib/themes.ts, project/theme-tags.md), so a reader can
   * follow one subject from the journal into the concepts (Sean, 30 Sep 2026).
   * Assigned by reading the concept. Carries no evidential weight.
   */
  topics: string[];
  title: string;
  body: string;
  /** Short evidence lines. Kept as text where a stable public URL isn't recorded. */
  evidence?: string[];
  /** Open questions the concept does NOT answer. Shown to the reader. */
  questions?: string[];
  /** External or internal references, with how they relate. */
  references?: { label: string; href: string }[];
  /** How the references relate — prevents a contextual link reading as proof. */
  referencesNote?: string;
  /** Independent verification state. Rendered whenever it is not "verified". */
  verification?: Verification;
  /** Scope limit shown beneath the concept. Verbatim, never paraphrased. */
  disclaimer?: string;
  /**
   * The AUTHOR'S own commentary on this concept, in his voice.
   *
   * Rendered and labelled as commentary, never as evidence and never as a
   * finding. This exists so the author can say what he thinks about an entry
   * without that opinion having to pass as sourced — the alternative was
   * opinion leaking into `body`, where a reader would read it as established.
   * Kept separate for the same reason `basis` exists at all.
   */
  comments?: string[];
  /**
   * PAIRED STATEMENT AND ASSESSMENT (Sean, 2026-08-26).
   *
   * `authorStatement` is the claim in the author's own words, printed verbatim
   * and attributed to him. `aiAssessment` is the AI's response to that specific
   * claim, printed directly beneath it and attributed to the AI.
   *
   * The pair exists because the alternative was worse. Converting an author's
   * claim into whatever fraction of it could be sourced produced entries that
   * were defensible but no longer his, and silently dropped the part he cared
   * about. This keeps the claim intact, keeps its provenance visible, and puts
   * the counter-argument on the same page rather than in a disclaimer.
   *
   * Neither half may be edited to agree with the other. If they agree, the pair
   * is pointless; if one is softened to match, the reader is being managed.
   */
  authorStatement?: string[];
  aiAssessment?: string[];
  /**
   * A SERIES of concepts meant to be read together (Sean, 4 Oct 2026: "we need
   * to have a strong way of providing a group of concepts"). The key into
   * SERIES below. Each concept page in a series shows the whole series, in
   * reading order, with the current one marked. Carries no evidential weight.
   */
  series?: string;
};

/** Concept series, in reading order. Keys are referenced by `series` above. */
export const SERIES: Record<string, { title: string; blurb: string; ids: string[] }> = {
  "telepathic-communication": {
    title: "Telepathic communication",
    blurb: "The author's hypothesis of a telepathic communication system, and of how a person might use it. Read in order.",
    ids: ["diving-ecosystem", "diving", "why-hasnt-it-been-turned-off"],
  },
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  unverified: "Not independently verified",
  partially_verified: "Partially verified",
  verified: "Independently verified",
};

/**
 * The state of the concept list's controls, in one place because three
 * components read it: the toolbar sets it, the summary jumps into it, and the
 * view applies it. `q` is free text; the rest are the four axes.
 */
export type Filters = {
  q: string;
  // Multi-select (Sean, 30 Sep 2026). An empty list means "all".
  origin: Origin[];
  basis: Basis[];
  theme: Theme[];
  audience: Audience[];
  /** Journal theme slugs (lib/themes.ts). */
  topic: string[];
  /** For the groups a concept can carry several values of: need any, or all? */
  match: { audience: "any" | "all"; topic: "any" | "all" };
};

export const NO_FILTERS: Filters = {
  q: "", origin: [], basis: [], theme: [], audience: [], topic: [],
  match: { audience: "any", topic: "all" },
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  household: "Households and individuals",
  investigators: "Law enforcement and investigators",
  policy: "Legislators and regulators",
  clinicians: "Clinicians",
  press: "Press and researchers",
};

export const AUDIENCE_NOTE: Record<Audience, string> = {
  household: "For a person who thinks something is happening to them, or to someone they live with.",
  investigators: "For anyone whose job is to establish what happened and to whom.",
  policy: "For anyone writing or enforcing a rule about any of this.",
  clinicians: "For anyone a frightened person is likely to reach first.",
  press: "For anyone who has to decide whether a claim can be published.",
};

export const THEME_LABEL: Record<Theme, string> = {
  record: "The record and its limits",
  procurement: "Procurement and accountability",
  surveillance: "Surveillance and the person",
  neurotech: "Neurotechnology",
  coercion: "Coercion and control",
  health: "Health outcomes",
  experience: "Reported experience",
};

export const THEME_NOTE: Record<Theme, string> = {
  record: "What this archive can and cannot show, and why an absence proves little.",
  procurement: "Who buys what, and what happens when a finding lands against them.",
  surveillance: "What is collected about people who never agreed to any of it.",
  neurotech: "What can actually be read from a brain, and under what conditions.",
  coercion: "Documented methods for controlling a person without touching them.",
  health: "Population outcomes measured against the rest of the world.",
  experience: "First-person report, and what is known about experience without an external source.",
};

export const BASIS_LABEL: Record<Basis, string> = {
  documented: "Documented",
  structural: "Structural",
  pattern: "Pattern",
  testimony: "Testimony",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  ai: "AI analysis",
  author: "Author's observation",
};

export const ORIGIN_NOTE: Record<Origin, string> = {
  ai: "Derived by AI analysis of the research dataset.",
  author: "The author's own observation, drawn from experience.",
};

export const BASIS_NOTE: Record<Basis, string> = {
  documented: "A source, ruling, or official record supports this directly.",
  structural: "This follows from what the dataset does — or does not — contain.",
  pattern: "An observation drawn from experience, offered as an observation.",
  testimony: "A dated first-person report of what the author experienced or was told. Verified by nobody.",
};

export const CONCEPTS: Concept[] = [
  /**
   * Do Not Choose Yourself (Sean, 5 Oct 2026). Author speculation;
   * standalone, not in a series. Listed first. GENERATED
   * by Core Concepts/drafts/build_do_not_choose_entry.py: edit the draft, not this.
   */
  {
    id: "do-not-choose-yourself",
    origin: "author",
    basis: "pattern",
    theme: "neurotech",
    audience: ["household", "investigators", "policy", "press"],
    topics: ["speculation", "technology", "harassment", "euthanization", "proposed-solutions"],
    verification: "unverified",
    title: "Do Not Choose Yourself",
    body: "*This concept is being written in parts. More of it is being recorded and will be added.*\n\n*This concept is the author's speculation. It does not assert that the system it describes exists. Every statement recorded in the journal is an external communication, and every statement heard on the bullhorn requires verification. Read this concept under the [Critical Disclaimer](/disclaimer).*\n\n---\n\n## What does it mean to have an invisible friend?\n\nSuppose, hypothetically, that someone begins to humor a friendly relationship with a voice that reaches them directly, by [voice-to-skull](/glossary/voice-to-skull) (V2K) communication. On the other end is a person in an office, presenting themselves through their own point-of-view eyesight, on a monitor, as an avatar: an extraterrestrial, someone from the spirit world, or a human being who is not who they claim to be.\n\nThe first experience feels spiritual. Imagine what that could mean for people of faith. Perhaps the voice appears as a father who has died, or a grandmother.\n\nThe person allows it to exist in their mind. They decide, almost without noticing, to explore it. They never say yes out loud; they simply let the friendship happen. And it is one of the most remarkable, profound experiences of their life. It feels authentically human, because it comes with [phantom sensations](/glossary/phantom-sensations), with what have been described as \"emotional wristbands,\" and with a brain-to-brain connection, a conversation held mind to mind.\n\nIt goes on for months. There are awkward moments: in the bathroom, and in the most private moments of all, which may be met with punishment, or, more often, with reward. Every day, from a distance, from a control room or an office, someone works to appeal to the person's circumstances.\n\nThen, after three to six months, something changes. Harmful information surfaces about someone in their life, or about a complete stranger. And they are asked to do something. They are invited to become part of a community: potentially, the euthanization culture.\n\nWhat is that community? Before answering, consider what it means to humor this friendship at all.\n\n## How it began for the author\n\nAbout three years ago, people presented themselves to the author as extraterrestrials and as the spirit world. Some appeared in white, flowing robes; some wore what were plainly costumes. Most of those who appeared looked Caucasian or Asian.\n\nHe had no explanation for how any of this was possible. Even with more than twelve years in the technology industry, he had never heard of neurotechnology. So there was always an awkwardness, at the back of his mind. He was trying to get back on his feet and recover his health, and alongside the positive communication, the harassment carried on in the background.\n\n## External location\n\nThere is a whole story behind what has been called an *external location*: a [neuro-engagement](/glossary/neuro-engagement) exercise in which people in another warehouse, or another office, connect themselves to a person through the Diving process, facilitated by a computer or without one, and try to befriend them.\n\nWhat is the point? And what does it do to the community?\n\n## Why it matters: the impact on you, and on others\n\nAfter what may now be five years of unconsented, unexplained communication, the author's advice comes down to one rule.\n\n**Never reward an unconsented, unexplained neurotechnological relationship.** Here is why.\n\n**The risk to your life is severe.** And it is not only your safety at stake. The people around you are endangered too.\n\n**It is a serious red flag,** from a law enforcement perspective and from a mental health perspective alike: another human being trying to gain your confidence through an unexplained, unregulated neurotechnological channel. What makes it stranger, and less safe, is that the whole exchange can be heard by many people at once, on the [neurotech bullhorn](/concepts/the-neurotech-bullhorn).\n\n**Rewarding it will feel normal at first.** It may even be one of the greatest spiritual experiences of your life. Now imagine what that means for a devout Christian, a devout Catholic, or a devout Muslim, who is then asked to do things.\n\n*If a voice asks you to do something, especially to harm yourself or anyone else, tell someone you trust. In an emergency, call 911; if you are struggling, call or text 988.*\n\nSee also the author's caution in [The Diving Ecosystem](/concepts/diving-ecosystem): do not reward their presence.\n\n## \"How do you feel about our presence?\"\n\nSometimes the question comes directly, through the system. Set the stage: an organization that seems to be trying to be forthcoming, even transparent. In paraphrase: *We just want you to know that we're in a control room, communicating with you. How does that make you feel? What do you think of this moment?*\n\nPerhaps you have been asked for feedback, or to take part in an \"eyesight study\" of how you use software: AI tools, phone apps, desktop applications. Hypothetically, a control room is observing you, and it is not harassing you. That matters. It may even say, *This is our time with you. As long as we're here, you won't be attacked. We'll defend you.*\n\nThat is not how this began. Two to three years ago it was, so to speak, a free-for-all. So when you weigh your own opinion, and you may well be enjoying the moment, whether it is an invisible friend or a group that has spent time getting to know you, consider what it means for you, your loved ones, your family and the people around you.\n\n## Should you reward it?\n\nHere is the first thing to consider. Should you reward an unconsented neurotechnological relationship: someone who arrived without permission, without explanation, and who still refuses to tell you who they are?\n\nThe author, writing as someone who has lived through exactly this for years, says no. You can never reward that relationship. **Do not choose yourself.**\n\nIt makes no difference whether the presence comes from a local government cloud system or from a foreign adversary's. You cannot reward it. You cannot choose yourself.\n\nRewarding it can be as simple as answering questions. Someone asks you something through this telepathic system, and you answer, and you keep on answering. In the author's view, every answer erodes the constitutional rights and the public safety of every person, and above all your own.\n\nIf you keep rewarding it, are you eroding, or even destroying, the constitutional rights of yourself and of everyone else, in whatever country they live?\n\n## The public safety risk: the \"ugly workflow\"\n\nThe risk to public safety is severe. Something has surfaced, historically, under the name of the military \"ugly workflow\": a strategy for luring a person out of their home. It has several versions. In one of the main ones, the target is encouraged into a sexual act, has a good experience, and is then asked to come outside and walk three blocks west.\n\nWhat happens if they do? Are they euthanized? Beheaded? According to statements going back two to three years, a biotech organization then collects their property. There is no funeral, and perhaps a missing-persons report, depending on who they were.\n\nPlease understand: if you humor an invisible friend now, you may be taking the first step down a road you never come back from. Do not go outside when you are asked to, and do not open the door. In an emergency, call 911.\n\n## Is this happening elsewhere?\n\nImagine that this is an organization speaking not only to American citizens, but to the citizens of other countries too.\n\nSouth Korea's suicide rate more than doubled in a decade, peaking around 2010 and 2011. The United States' rate has risen by about 35% since 1999, and the pace doubled from 2006. Is South Korea experiencing something similar to America?\n\n*On the record:* South Korea's age-standardized suicide rate rose from 15.1 per 100,000 in 2000 to 34.9 in 2010 (WHO), then declined. The US age-adjusted rate rose from 10.5 in 1999 to 14.2 in 2018 and again in 2022 (CDC). Researchers attribute these trends to many causes, and none of them is established as related to this system. Rising at the same time is not the same as rising for the same reason (see [The world's suicide rate fell. The United States' rose.](/concepts/us-rose-against-the-trend) and [Next to each other is not because of each other](/concepts/co-occurrence-is-not-cause)). If you are struggling, call or text 988, at any time.\n\n## Do not choose yourself: how you carry yourself\n\nDo not choose yourself in these moments. And this is not only about protecting your own life. It is also about how you carry yourself.\n\nWill you support euthanization? Will you open your home, your partner, your children, to supporting it, so that you end up harassing someone else because you need to survive?\n\nThis comes up often, because there is no explanation. There is a very large pattern of communication in which people are torn, and households are torn. They want to survive this. In paraphrase: *We're going to survive this by supporting euthanization.* And what follows, every time, is that they harass, locate and euthanize American citizens in order to survive.\n\nDo not choose yourself in that moment.\n\n## This is not sustainable\n\nEuthanizing American citizens, or any citizens, over the bullhorn cannot go on. It is absurd to think it could. There is no future in it, and it is not sustainable.\n\nIn the author's opinion, the whole industry is bottlenecked. There is so much talent out there. What has been created? And what are we being prompted to do?",
    references: [
      { label: "1. Invisible Ships — The Diving Ecosystem (Telepathic communication, part 1)", href: "/concepts/diving-ecosystem" },
      { label: "2. Invisible Ships — Diving (Telepathic communication, part 2)", href: "/concepts/diving" },
      { label: "3. Invisible Ships — Why Hasn't It Been Turned Off? (Telepathic communication, part 3)", href: "/concepts/why-hasnt-it-been-turned-off" },
      { label: "4. Invisible Ships — What is the neurotech bullhorn?", href: "/concepts/the-neurotech-bullhorn" },
      { label: "5. Invisible Ships — The world's suicide rate fell. The United States' rose.", href: "/concepts/us-rose-against-the-trend" },
      { label: "6. 988 Suicide & Crisis Lifeline", href: "https://988lifeline.org" },
    ],
    referencesNote:
      "The first three are the parts of the Telepathic communication series that this concept follows on from. The next two are related concepts on this site; the suicide figures come from the site's Public Health data. The last is a crisis line, listed for readers' safety, not as evidence.",
  },
  /**
   * Why Hasn't It Been Turned Off? (Sean, 4 Oct 2026). Author speculation;
   * part 3 of the series "telepathic-communication". Listed first. GENERATED
   * by Core Concepts/drafts/build_turned_off_entry.py: edit the draft, not this.
   */
  {
    id: "why-hasnt-it-been-turned-off",
    origin: "author",
    basis: "pattern",
    theme: "neurotech",
    audience: ["household", "investigators", "policy", "press"],
    topics: ["speculation", "technology", "harassment", "euthanization", "health-effects", "proposed-solutions"],
    verification: "unverified",
    series: "telepathic-communication",
    title: "Why Hasn't It Been Turned Off?",
    body: "If this experience is the work of a military deployment, then it is the work of a machine operated by human beings. And a machine can be turned off at any time. So why hasn't it been?\n\n*This concept is the author's speculation. It does not assert that the system it describes exists. Every statement recorded in the journal is an external communication, and every statement heard on the bullhorn, like the bullhorn itself, requires verification. Read this concept under the [Critical Disclaimer](/disclaimer).*\n\n---\n\n## Two tragic ironies\n\n**The first is the story people are told:** that this is the spirit world, or something extraterrestrial; that no one can stop it; that there is no hope. If it is a machine operated by human beings, none of that is true.\n\n**The second is the simplest.** The surest way never to \"euthanize\" anyone for communicating is not to harass them in the first place. The offices doing this can stop at any time. They can simply choose not to communicate. No law of nature compels any of it. This is the work of human beings, and no one has to communicate with anyone.\n\n## Who gains from harassment?\n\nDoesn't law enforcement lose every covert opportunity the moment harassment begins? A person who is being harassed knows they are being watched, and a person who knows they are being watched is no longer a covert source of anything. The author is not an intelligence analyst, but the logic seems plain.\n\nAnd if someone has been experimented on through this system, isn't the best thing anyone could do for them to stop, immediately? What would be surreal, and unusually cruel, is the opposite: [Zersetzung](/glossary/zersetzung-tactics) tactics used to force a person to accept a home invasion, a beheading, a dissection.\n\n## How it began, for the author\n\nAccording to statements the author has received, he was observed with similar technology from as early as 1998. In all that time he was never spoken to and never harassed, except on rare occasions, and on those occasions what he heard was supportive.\n\nLooking back, the first event that was different from anything before came within weeks of his first COVID-19 vaccination, with Moderna: a silent observer, a brain-to-brain connection. A Pfizer booster followed.\n\nThen, in Portland, Oregon, after his divorce, came something the author can only describe as a horror film. There was no verbal communication at all: only [phantom sensations](/glossary/phantom-sensations) and internal mental images.\n\nWhen he returned to Denver, the conversations began, with people introducing themselves as the spirit world or as extraterrestrials. As a research professional he was always skeptical, but for a long time he had no explanation.\n\nAnd then the violence began; the author calls it ultraviolence. Verbal harassment. Attempts to gain entry to his home, or to lure him outside. Shouting, with everyone listening: \"Put your hand up for assistance.\" \"Put your motherfucking hand up.\" Public outcry at three in the morning. Ultrasonic sound attacks, [tinnitus](/glossary/tinnitus), and relentless harassment.\n\nThere is no proof that the vaccination has anything to do with this experience, and the author does not claim it does. It is simply the one event that may have affected his health, and the timing is what he observed. Statements on the bullhorn have said, again and again, that no implant is needed to experience [voice-to-skull](/glossary/voice-to-skull) (V2K) communication.\n\n*On the record:* the ingredients of the COVID-19 vaccines are published, and none of them is a device, a sensor or anything that could receive or transmit a signal. That two things happen close together in time does not mean one caused the other (see [Next to each other is not because of each other](/concepts/co-occurrence-is-not-cause)).\n\n## Has it been turned off before?\n\nBased on past statements, and on the author's own experience, the machine has been turned off more than once, and each time the author felt a significant drop, as if his body's chemistry had fallen away.\n\nStatements on the bullhorn, and the author's experience, suggest that anyone connected to this system may feel a rise in serotonin and dopamine simply from being connected to others who are also connected. If so, what happens when it is switched off abruptly? It has been suggested that it should not be: given the ultrasonic sound attacks and the tinnitus people may be living with, the system should be tapered off rather than cut, because of its effect on the human brain.\n\n*On the record:* no published research documents a remote system that raises serotonin or dopamine. What is documented is that social connection affects mood, and that abrupt changes in stimulation, sleep or stress can make people feel worse before they feel better. Anyone feeling a sudden drop in mood should talk to a doctor; if you are struggling, you can call or text 988 at any time.\n\n## The flip side: what if it simply stopped?\n\nHow safe would you feel if you were living with this, and out of nowhere it stopped?\n\nStatements have suggested that the author has a degree of protection. When the system goes down, he does not feel better; he feels worse. At the moment, the observation feels like protection, from at least one part of those observing. If the system were turned off, would mayhem follow? Would the people carrying out the harassment and the Zersetzung tactics, and pressing for euthanization, take that cover of darkness to enter people's homes?\n\nWithout an explanation, everything feels like a terrible vulnerability, even when the system is off. That is the author's personal opinion. Turning it off is not enough on its own. It has to be explained.\n\n## What has been said about why\n\nOver time, statements have offered reasons for leaving it running.\n\n**\"We do their bidding.\"** One, in paraphrase: *We need to get to know the people speaking with us. We do their bidding, in an attempt to understand what they want.* If that is the reasoning, the author asks, what does it mean for everyone else? While someone studies the people giving the orders, who is studying what the orders do to the people living under them?\n\n**\"There is an investigation.\"** Another, repeated historically: it cannot be turned off because there is an investigation; the people responsible have to be caught and identified, and that need is being weighed against keeping things covert. But here is the tragic irony again. Because of the bullhorn, and because of how horrifying a first experience of telepathic communication is, there is nothing covert about what the general population is living through.\n\n**A campaign, in public.** Consider what it means to run a campaign against a journalist, or against anyone from any country, and to keep it going on the bullhorn with statements like these. Attempts to gain permission to enter someone's home: *\"Put your hand up. Put your motherfucking hand up for assistance.\"* Another large pattern: *\"Open your door for the spirit world.\"* If a person puts their hand up, does someone record that as legally binding consent to euthanasia? If someone then comes to the door and is let in, what happens? In the author's view, that person loses their life. Do not raise your hand, do not open the door, and call 911.\n\nIt is the predatory nature of all this, intensely predatory, that the author cannot reconcile with anyone trying to prolong a relationship to learn what an enemy wants. It feels less like a strategy than a reaction.\n\n**\"It's always been this way\" — or \"it never existed.\"** Asked why anyone would try to gain entry to a home, a very large pattern of statements has answered, in paraphrase: *It's an industry standard. It's always been this way. This is just how it's done.* Lately, as of October 2026, the suggestion has been the opposite: *This never existed. It's a new process.* Both cannot be true. Which is it?\n\n## Where is the news media?\n\nWhy is there no explanation in the news? The record includes another large pattern of communication, which may not appear in the downloadable transcripts: that the news media industry, along with other technology organizations, has been given access to government cloud systems, and the opportunity to experience the eyesight system.\n\nAs part of that system, statements describe a risk-mitigation layer. In paraphrase: *We have to include euthanization. We have to include it.* As if healthcare, and an explanation, were not options. Other statements, again in paraphrase: *Historically, we protect national security.* But as a citizen, the author was never harassed before his vaccination.\n\nAnother statement goes further. In paraphrase: *Euthanization is in the building.* The suggestion is that news offices have a \"euthanization therapist,\" a psychologist or mental-health professional, on site. Is there any truth to this? And if there were, how would it affect the people who work there, knowing that someone in the building was there for that purpose?\n\nThese are reported statements, not findings. Is any of it true? And if it is, who decided that silence was the safer course? (See [Why isn't any of this in the news?](/concepts/why-isnt-this-in-the-news))\n\n## Is anyone in government being told?\n\nAre local and federal leaders being harassed right alongside everyone else, without an explanation? Are we paralyzed as a nation?\n\nStatements also describe local law enforcement taking part in the Diving process, and being remarkably receptive to any education or speculation that might give them an advantage.\n\nHistorical statements go further: that the United States, the People's Republic of China and the Russian Federation are each divided down the middle, and that what is being experienced is the harm done by a union of private organizations, representing neither the United States nor the Communist Party. Is that so? And if it is, what is the explanation?\n\n## Why 2027?\n\nFor two to three years, statements on the bullhorn have pointed to 2027 as a year of significance. One, in paraphrase: *I think the window for unconsented research has closed early.*\n\nSet that beside the law on ending a life. In most of the world, killing a person, even at their request, is a serious crime; only a handful of countries and states allow assisted dying, and only under strict conditions. Jack Kevorkian, who helped more than a hundred people die, was convicted of second-degree murder in Michigan in 1999 and served eight years in prison.\n\nIn Colorado, where the author lives, the End-of-Life Options Act allows [medical aid in dying](/glossary/self-elected-suicide) only for an adult with a terminal illness, a prognosis of six months or less, and the capacity to decide for themselves.\n\nCanada's law is broader. Since 2021 a person need not be terminally ill: a serious and incurable illness, disease or disability, in an advanced state of decline, with intolerable suffering, can qualify. But where a mental illness is the *only* condition, eligibility has been paused, twice, and is now set to begin on **17 March 2027**. A bill introduced in 2025 would make that pause permanent. Financial hardship has never been a ground for eligibility under Canadian law, although critics have raised concerns that poverty and a lack of support may lie behind some requests.\n\nThat is a documented fact, and it sits alongside the bullhorn statements. When the author asked about it, the answer, in paraphrase, was that 2027 marks the end of unconsented research, and that Canada is protecting its citizens until then from choosing to end their lives unnecessarily.\n\nIs that the connection? And if something is meant to end in 2027, why wait for it?\n\n## A machine, not a spirit\n\nThis experience is the outcome of a machine. A machine can be turned off, and, if what the author describes is true, it has been before. So why is it still running? And when it is turned off, who will explain what it was?\n\nRemember, all of this is hypothetical. Every statement heard on the bullhorn, and the bullhorn itself, requires verification.\n\n*Related glossary: [Zersetzung tactics](/glossary/zersetzung-tactics) · [Phantom sensations](/glossary/phantom-sensations) · [Tinnitus](/glossary/tinnitus) · [Telepathy](/glossary/telepathy) · [Diving](/glossary/diving) · [Voice-to-skull (V2K)](/glossary/voice-to-skull) · [The Mosquito](/glossary/mosquito-device) · [Targeted individual](/glossary/targeted-individual) · [Self-elected suicide](/glossary/self-elected-suicide)*\n\n*Related concepts: [The Diving Ecosystem](/concepts/diving-ecosystem) · [Diving](/concepts/diving) · [What is the neurotech bullhorn?](/concepts/the-neurotech-bullhorn) · [Why isn't any of this in the news?](/concepts/why-isnt-this-in-the-news) · [Your house is not haunted](/concepts/what-produces-the-feeling) · [Zersetzung's methods are crimes](/concepts/zersetzung-methods-are-crimes) · [Next to each other is not because of each other](/concepts/co-occurrence-is-not-cause)*",
    questions: [
      "If this is a machine operated by human beings, who has the authority to turn it off?",
      "Why would anyone be punished for communicating, when the people operating the system could simply stop communicating first?",
      "Does harassment destroy the covert value of the very surveillance it relies on?",
      "If it has been switched off before, why was it switched back on?",
      "If switching it off abruptly harms people, what would a safe, tapered shutdown look like, and who would be responsible for it?",
      "If it were switched off without an explanation, would people be safer, or more exposed?",
      "Who benefits from people believing it is the spirit world, or extraterrestrial, and cannot be stopped?",
      "If the author was observed for years without being harassed, what changed, and who decided it?",
      "Has the news media been given access to this system, as statements suggest? If so, why hasn't it explained it?",
      "Are local and federal leaders living with this too, without an explanation?",
      "If a union of private organizations, representing no nation, is behind the harm, as statements suggest, who holds it to account?",
      "If the system is kept running to learn what its operators want, as statements suggest, what is it costing everyone else in the meantime?",
      "If an investigation is the reason it keeps running, what is left to keep covert, when the general population can hear it?",
      "Does anyone treat a raised hand, or an opened door, as consent to euthanasia? Under what law?",
      "Is this an \"industry standard\" that has always existed, or a \"new process\" that never did? Why has the answer changed?",
      "Why do statements on the bullhorn point to 2027, and why does that match the date Canada set for assisted dying where mental illness is the only condition?",
      "If unconsented research is meant to end in 2027, who decided the date, and why should anyone wait for it?",
      "Is there any truth to the statement that news offices have a \"euthanization therapist\" in the building? If so, what would that do to the people who work there?",
    ],
    comments: [
      "**There is hope.** The belief that this cannot be stopped is part of what keeps it going. A machine can be turned off.",
      "**Why wait?** The author does not expect anything to change in 2027, and he thinks waiting for it to find out is absurd. If it can be turned off, it can be turned off now.",
      "**Turning it off is not enough.** Without an explanation, even silence feels like danger. Shutting the system down has to come with telling people what it was.",
    ],
    references: [
      { label: "1. Invisible Ships — The Diving Ecosystem, part 1 of this series", href: "/concepts/diving-ecosystem" },
      { label: "2. Invisible Ships — Diving, part 2 of this series", href: "/concepts/diving" },
      { label: "3. 988 Suicide & Crisis Lifeline", href: "https://988lifeline.org" },
      { label: "4. U.S. Food and Drug Administration — COVID-19 vaccines (ingredients and fact sheets)", href: "https://www.fda.gov/emergency-preparedness-and-response/coronavirus-disease-2019-covid-19/covid-19-vaccines" },
      { label: "5. Global News — MAID expansion for mental illness delayed to 2027", href: "https://globalnews.ca/news/10265616/maid-expansion-delayed-2027" },
      { label: "6. Cardus — Bill C-218, permanently pausing MAID for mental disorders (2025)", href: "https://www.cardus.ca/research/memo-considerations-for-bill-c-218-on-permanently-pausing-the-expansion-of-maid-for-mental-disorders/" },
      { label: "7. Colorado Department of Public Health and Environment — Medical aid in dying", href: "https://cdphe.colorado.gov/center-for-health-and-environmental-data/registries-and-vital-statistics/medical-aid-in-dying" },
      { label: "8. Encyclopaedia Britannica — Jack Kevorkian", href: "https://www.britannica.com/biography/Jack-Kevorkian" },
    ],
    referencesNote:
      "The first two are the earlier parts of this series. The third is a crisis line, listed for readers' safety, not as evidence. The fourth is where the vaccines' published ingredients can be read. The rest document the law on assisted dying in Canada and Colorado, and the Kevorkian case.",
  },
  /**
   * Diving (Sean, 4 Oct 2026). Author speculation: how the Diving process
   * might work without a computer, its risks, and choosing the explanation.
   * Second in the concept list; second in the series
   * "telepathic-communication" after The Diving Ecosystem. GENERATED from the
   * reader draft by Core Concepts/drafts/build_diving_entry.py: edit the
   * draft, not this.
   */
  {
    id: "diving",
    origin: "author",
    basis: "pattern",
    theme: "neurotech",
    audience: ["household", "investigators", "press"],
    topics: ["speculation", "technology", "surveillance", "harassment", "euthanization", "proposed-solutions", "law-government"],
    verification: "unverified",
    series: "telepathic-communication",
    title: "Diving",
    body: "[Diving](/glossary/diving) is the process of establishing a brain-to-brain connection with another human being. According to statements, and to human experience, it can be done with a computer or without one. This concept sets out the author's hypothesis of how it works without a computer, and why that matters.\n\n*This concept is the author's speculation. It does not assert that the process exists as described. Every statement recorded in the journal is an external communication; read this concept under the [Critical Disclaimer](/disclaimer).*\n\n> **The author has had no training.** Everything here is hypothesis, drawn from his own experience and from what he has heard on the bullhorn. It is offered as a set of questions more than a set of instructions: is this how it works?\n\n> **The first rule: permission.** Never enter someone's body, or connect to someone neurologically, without their permission. There is one exception. If you are being harassed, and someone is pressing you to raise your hand, to let them into your home with offers of \"relief from suffering\" or \"assistance,\" do whatever you can to capture a physical description of them, so that you will recognise them if they come to your door without permission. If they do, do not open the door; call 911.\n\n> **Speak only for yourself.** None of this has been confirmed or verified, and it needs to be. The author can speak for himself, but not for you. On this subject, never speak for someone else.\n\n> **The author's own conduct.** The author Dives only when he is being harassed, and only to defend himself. As a citizen, he does not run image-based search investigations on anyone. There seems to be a line of people who want to investigate those harassing the group he belongs to; he is not one of them. Respect people's space, and never speak for what someone else is going through.\n\n---\n\n## Part 1 — What it is said to be\n\nAccording to statements on the bullhorn, Diving is a military workflow: heavily guarded, handed down, and in some circles taught to soldiers as a spirit-world phenomenon. Depending on the country a soldier serves, the instructor may have presented it as something spiritual.\n\nThose statements also suggest that only one group is permitted to Dive without a computer, that no one else is meant to know it can be done, and that doing it, or sharing how, could get a person added to the euthanization list and executed. They suggest, too, that roughly 95% of the people carrying out the harassment use a computer and do not know it is unnecessary.\n\n**Two kinds of Dive.** A Dive can be one person connecting themselves to another, with or without a computer. It can also be *facilitated*: a third party, with or without a computer, connecting two people to each other, or many people at once.\n\nThe brain-computer interface industry and the field of neuroscience would not call any of this spiritual. Neuralink's VOICE trial is one public example: Kenneth, among the first participants with ALS, now speaks through thought. Device control, operating a computer or phone by thought, is a large part of what Neuralink offers, and its first implant is named Telepathy. Next is Blindsight, which aims to restore sight to people who are blind.\n\n*On the record:* every one of Neuralink's systems connects a brain to a computer. None connects one person's brain to another's.\n\n*Related: [Diving](/glossary/diving) · [Breaching](/glossary/breaching) · [Telepathy](/glossary/telepathy) · [Brain-computer interface](/glossary/braincomputer-interface-bci) · [The Diving Ecosystem](/concepts/diving-ecosystem)*\n\n---\n\n## Part 2 — The author's hypothesis\n\n*Each step below is hypothesized, and each is really a question: is this how it works?*\n\n### Step 1 — Find them\n\nFor the author, it begins with the harassment. Suppose you are in physical distress: abdominal discomfort, nausea, vomiting, an irregular and painful bowel movement. From a distance, the bullhorn is shouting at you to raise your hand for assistance. In one recorded instance it was, word for word, \"Put your motherfucking hand up.\" Or it repeats, more quietly, \"Do you need assistance? Do you need assistance?\"\n\nBring the sound of their voice to your location. Close your eyes, and put your mind's eye on their body and their position. Picture a field around the person, something like an [electromagnetic field](/glossary/electromagnetic-field). Listening to their harassment brings them, and their field, to your location. From there you can back up and navigate the space around them. By harassing you, they have put a bullseye on their own forehead: the more you listen, the closer their communication comes. As their voice arrives by [voice-to-skull](/glossary/voice-to-skull) communication, the three-dimensional footprint, yours and theirs, is being shared and processed by artificial intelligence.\n\nOnce you have them at your location, back up three to five feet. Do you find the back of a head? What does it look like? Ethnicity, body type, age, haircut and clothing come through. Even behind blackout technology, you can feel your way around them. Lean to the right for a profile, or rotate them to look directly at their face.\n\n*Symptoms like those above have many medical causes and are worth a doctor's assessment.*\n\n### Step 2 — Connect\n\nThe next step is entering the body. According to a large and consistent pattern on the bullhorn, Diving without a computer works through the body's openings: the nose, the ears, the mouth, the urethra and the rectum. Each is described as an open door to a strong neural, or body-to-body, connection.\n\nThe first question is what you want. **To investigate** the person harassing you? Or **only to connect,** so that they know they have your full attention? A strong connection holds even if they run. One of the largest patterns, on the bullhorn and in the author's own experience, is people in offices, presenting themselves on a computer as an extraterrestrial or as someone from the spirit world, who are connected to and then run from the office and down a flight of stairs. The connection stays with them.\n\n**Through the nose,** the connection seems to be bodily. Get behind them, locate the nose, enter, move up a little, then straight down. You may be able to tell at once whether they are sitting or standing. Follow the body down to their shoes, and you may find you know what shoes they are wearing.\n\n**Why connect at all?** To draw a character sketch of their face, or make a careful mental note of it, and to note what they are saying. If you ever hope to join a class action or be represented, a character sketch and transcripts of the harassment are the least you would need. In the author's view, it is also one of the most effective ways to tell an attacker you are not a good fit for what they are attempting: the home invasion and the euthanization.\n\n**If an investigation is already under way,** attaching yourself to the harasser may open the door for it to run an [image-based search](/glossary/image-based-search) on them. Then step aside. Two people in the same seat of consciousness, running the same search, is a problem: you may find someone already there, accessing the same memories.\n\n**Connecting others: pinch and pull.** Once you have found someone, you can pinch from their field and pull a connection into another person, through one of the body's openings. This is how a facilitated Dive is described: one person's field, drawn into someone else. If this is possible today, if a third party can connect any two people, or many, without their knowledge or consent, is that not one of the most dangerous situations imaginable, for national security and for public safety alike? Anyone could be connected to anyone: an officer to a suspect, an official to an adversary, a child to a stranger.\n\n### Step 3 — Investigate\n\nThe **seat of consciousness** is, essentially, your brain: your consciousness, inside the skull. Reaching it is what makes a search possible.\n\nFor several years it has been suggested on the bullhorn that the most effective way in is through the rear, the rectum, usually when a person is in a compromising position, bending over or sitting on the toilet, so that the entry hides inside the exertion. Once someone is connected this way, there is no hiding it. The spinal cord is said to work as a runway to the seat of consciousness. To make the same entry on someone harassing you, keep listening, get behind them, and will your way up. According to statements, you can also push in through the side of the skull, though that may be a bumpy ride.\n\nArriving, you may find yourself behind a warm set of eyelids.\n\n### Step 4 — Search\n\nThe diving ecosystem seems to work in visual metaphors. The search itself, the largest pattern of all about how this functions, looks like a thumb flicking through the corner of a magazine, the pages fluttering away. What you search for is the image you place above that corner.\n\n- **A mirror** above the corner surfaces point-of-view memories of the person at a mirror: what they actually look like.\n- **A vehicle** surfaces memories of them driving or riding, and may lead to the front of their home or their office.\n- **Other images an investigation might use:** paperwork, a pistol, narcotics, a child's toy.\n\nAsk for the results as a list, and it has been suggested that the most recent memories surface at the bottom.\n\n### Step 5 — Disconnect\n\n**How often?** According to statements, and to the author's experience, this happens daily. The author estimates, conservatively, that he is connected into someone else more than ten times a day.\n\nRemember that, for the general population, this is not a computer-assisted process. It happens in the mind. To disconnect, you first have to find what you are connected to.\n\n**Find the connection.** It may be a human being. Sadly, according to the author's experience, it may also be a laboratory with a cadaver, running [necrosis](/glossary/necrosis-neuro-science) experiments meant to immobilise and terrorise you, in the hope of gaining entry to your home and euthanizing you. Whatever it is, you are looking for the point you are connected to, and it is usually positioned behind you. If you are being severely harassed, practise getting behind your targets: close your eyes, listen to the harassment, and when they start communicating, push yourself backwards in your mind's eye as far as you can.\n\n**Count the connections by blinking.** Blinking can tell you how many active neural connections are present. When you blink, tap your index finger each time you feel the blink repeat. During an attack there may be a laboratory, which has connected you to the cadaver; an office worker in a separate location, assisted by the laboratory; and a control room observing all of it. That is two or three active connections at once, each with access to three-dimensional footprint imagery. In the author's account, this is how the euthanization and the home invasion are forced and coerced. When the blink comes, you may feel it behind you. Will it in front of you.\n\n**See the line.** Then picture a visual connection: a string, a line, running from you to each connection. Every connection is one of two kinds.\n\n- **You are connected to them,** by yourself or because someone made the connection for you. That line comes out of your abdomen.\n- **They are connected to you.** Their line comes out of their abdomen and lands at a destination in you, such as your seat of consciousness. You may literally feel a pull, a pulling sensation on your head. Moving the person around in your mind helps you sense the line. The author has no explanation for why it works this way; that is simply the human experience.\n\n**Push out.** The key is to work out which opening was used. There is an action the author calls *pushing out*: pushing the electromagnetic, microwave or RF connection back out. According to statements, it feels like energy being pushed out of the opening: the ears, the mouth, the nose, the rear or the front. If someone has connected to you through your nose, you can push out through the nose. The best way to learn is to have someone do it for you telepathically, because once you have felt it, you can reproduce it from memory. It is highly effective.\n\n**Reel in, or cut the line.** If the pull comes from your abdomen, someone has inserted you into another person. You can reel yourself in: imagine a fishing reel at your abdomen, and use a hand signal to wind the connection in. Or you can sever it, and will the far end to disappear. One common reason you might be inserted into someone is that they could be a source of support for you, and the attempt is to discredit you to them while you are connected. Sadly, it works. In the author's view it worked better in past years than it does today.\n\n**Sensations are part of the system.** This ecosystem is built from visual metaphors and physical sensations, and [phantom sensations](/glossary/phantom-sensations) are hard at work. Someone can suggest a physical sensation telepathically, and you may feel it. And when a brain-to-brain connection is established and this part of the deployment is running, if they touch their arm or grab their wrist, you may feel it too. A large pattern on the bullhorn concerns office workers wearing bracelets, referred to as \"emotional bracelets.\"\n\n*On the record:* neuroscience has shown for decades that the brain can feel touch it did not receive. In the rubber hand illusion (Botvinick and Cohen, *Nature*, 1998), people feel strokes on a rubber hand they are watching. People with mirror-touch synaesthesia feel touch they see on others. These effects need the person to see the touch; none involves a remote connection.\n\n**It takes practice, and it is not hopeless.** No one would ask for this. It is horribly painful and deeply distressing, and being harassed means your personal network will be harassed too. But if you are in this position, you are, in effect, being given priceless military-grade training. You have every bit of the advantage your attacker has, should you choose to use it.\n\n**Ask for help.** If you are going through this, consider asking, in your mind, whether someone can help you disconnect. The author has been helped this way, and it works.\n\n*All of this is hypothetical. See the [Critical Disclaimer](/disclaimer).*\n\n---\n\n## Part 3 — The risks\n\n### Manufactured evidence\n\nThere is a darker side to the search, and it may be the most important part of this concept.\n\nSuppose someone Dives on you. They enter from behind, start an image-based search with the magazine corner, and place a firearm, the image of a pistol, above it. What happens next is that you begin to experience point-of-view video of yourself firing a fully automatic weapon at someone, perhaps killing them. You know it never happened. So what just happened?\n\nThis is the Wild West of telepathic communication. Is that all it takes: to drop something into a person's point-of-view eyesight at that moment? A memory of something else, or a clip from a film? And what if the person investigating you then writes an affidavit saying they investigated you for firearms possession and found you committing a murder?\n\nWhere is the law enforcement community in that moment? Is this happening to people? Are [Zersetzung](/glossary/zersetzung-tactics) tactics hard at work inside this military deployment, slandering people, manufacturing evidence, and handing out phony affidavits based on eyesight-technology observations?\n\nIt's a question, not an accusation.\n\n*Related: [Image-based search](/glossary/image-based-search) · [Voice-to-skull](/glossary/voice-to-skull) · [Non-ionizing radiation](/glossary/non-ionizing-radiation) · [Electromagnetic field](/glossary/electromagnetic-field) · [Phantom sensations](/glossary/phantom-sensations) · [Necrosis](/glossary/necrosis-neuro-science) · [Can you record it?](/concepts/can-you-record-it)*\n\n### What it may cost you\n\nDiving, or even communicating at all, can carry a price. This section is the author's account of what that price may be.\n\n**The rule against communicating.** It has been suggested that communicating at all gets a person added to the euthanization list. In the author's opinion, that rule is completely irrational. Telepathic communication is new to almost everyone, and it provokes a response by its nature. Meanwhile, people at their computers are introducing themselves as the spirit world. A rule like that insults the intelligence of almost anyone it is applied to. And if people of faith, in America's Christian, Catholic and Islamic communities, have been deceived by voices claiming to be the spirit world, how severe a betrayal is that? To the author, the thought is heartbreaking.\n\n**What may happen if you Dive to defend yourself.** Suppose you use the search to protect your family: a mirror above the magazine corner, to see what someone harassing them actually looks like, the last time they stood at a bathroom mirror. You can do this. But consider what may follow.\n\n- **You may be attacked severely, for weeks.**\n- **You may be reprimanded by the owners of the system.** There is a large pattern of disbelief that any member of the general population could Dive without military training. Statements about the author himself have said, in paraphrase: *this is impossible; there is no way this person can do what he is demonstrating without military training.*\n- **People may come after you, for euthanization.**\n- **You may draw an investigation, one that sacrifices you.** You may find some protection there, but you may also be used as a window to investigate the people harassing you.\n\nIf that opportunity comes, the author would encourage you to rise to it, whatever betrayal you feel. Are we living through a historic act of terrorism: a physical and virtual occupation of the United States, advised one way and delivered another, a Trojan horse? If you get the chance to serve your country in this, the author is sorry it falls to you, and his heart is with you in doing what you can.\n\n**Trust no one who asks you to open the door.** You cannot trust anyone communicating with you. Educational content, speculation, supportive statements: all of that is fine. But in the author's view, the moment someone asks you to go outside, or to let them into your home, they have identified themselves as a terrorist. Do not go out, do not open the door, and call 911.\n\n### Your pets\n\nAs strange as it sounds, your pets may also be subject to Diving, and may be used as a walking pair of eyes: a camera that moves around your home. According to suggestions on the bullhorn, and to human experience, Diving is not reserved for human beings. The glossary definition of [Diving](/glossary/diving) already includes animals.\n\nIf your pets are behaving strangely, please be kind to them.\n\nWhen the harassment began, the author was staying as a guest in an apartment building, and the attempts to draw him out into the night started three blocks west of it. It was suggested on the bullhorn, \"Get rid of Buddy,\" the house cat, and that Buddy was being used to turn on the range. Is that possible? The author does not know; it seems unlikely to him. But what could a pet do to cause a problem in a home? And could a pet be used, by a skilled telepathic military professional from another country with strong motives, to observe your behavior?\n\nIt's a question, not an accusation.\n\n*On the record:* pets do start house fires by accident, most often by bumping or pressing stove knobs; fire-safety groups estimate nearly a thousand such fires a year in the United States (Electrical Safety Foundation International, citing the American Kennel Club). Stove-knob covers, or removing the knobs when you are out, prevent it, whatever the cause.\n\n---\n\n## Part 4 — Choosing the explanation\n\n### Spirit, or technology\n\nThe author's own beginning was spiritual (see the closing note). Compare that with someone who decides, for themselves, that this is a technological experience. What happens?\n\nThey begin to take ownership of the situation. They are no longer suffering inside an existential frame. They know they are dealing with human beings: foreign adversaries using technology to carry out [Zersetzung](/glossary/zersetzung-tactics) tactics in an effort to end their life. It is a very clever method. But the moment a person crosses that line, the power is in their hands.\n\nIf you do succeed in Diving, you may also feel a profound sense of confidence and gratification. With practice, you can learn about your attacker, if what the author describes becomes, for you, less a hypothesis and more a reality. That should not be underestimated. It has been suggested many times over that this is a military deployment meant to give an invading force \"150% transparency\" of communication in enemy territory: not only what people say, but their point-of-view memories. Learning to Dive, hypothetically, gives you that same advantage.\n\n### The author's ethical standards\n\nNever violate someone's space this way. Diving is a highly invasive practice. For years the bullhorn has suggested that it is an undetectable way to observe and communicate with people. That is untrue. Consider how you would feel if your children, your mother or your partner were entered by a foreign adversary, or by a citizen who had chosen to survive by supporting euthanization efforts, most often carried out with a computer and through a third party.\n\nThe author Dives only when he is being harassed, and only to defend himself. As a citizen, he does not run image-based search investigations on anyone. There seems to be a line of people who want to investigate those harassing the group he belongs to; he is not one of them. Never speak about what someone else is going through. Respect people's space.\n\nIf someone is harassing you, do not be afraid to defend yourself. But the author does not condone violence. Early on, before he understood that this was a human and technological experience, he had some violent reactions to the unconsented presence of people threatening him and claiming they had murdered his wife and daughter. What he learned is that violence begets violence. In his opinion, empathy is the most valuable and redeeming quality of the human race.\n\nYou will be angry in this situation, and you should be. That is a healthy reaction. Feeling two ways at once is normal too: angry, betrayed, wanting to defend yourself, and still having to go to work every day while being harassed. That is a burden no one should carry.\n\nWhen someone is screaming at you on the bullhorn, take your time. Someone may be screaming at them, too.\n\n### It is not hopeless\n\nTwo to three years ago, it was conveyed that this could be a hopeless situation; that was the advice people were given. The truth is that we are all very capable. The repeated statements of disbelief, that the general population could never learn to Dive, look to the author like a fixed belief system, one that will not allow anything to change. Hope is out there.\n\nOver the last two to three months, the author has been proud of the people who have surfaced in conversation to support the community.\n\n---\n\n## Why it matters\n\nIf a mirror reveals a face, a vehicle reveals a home, and paperwork reveals a case, then this is exactly the transparency described in [The Diving Ecosystem](/concepts/diving-ecosystem): a military deployment that gives an invading force access not only to what people say, but to their memories. Every officer, investigator and family member is exposed in the same way. And if roughly 95% of the people using it do not know a computer is unnecessary, the few who do hold an advantage over everyone else, law enforcement included.\n\nAnd according to a large pattern of statements, about 95% of the people involved, local law enforcement included, and most importantly the attackers themselves, do not know their own vulnerability: that everyone can be reached by Diving without a computer.",
    questions: [
      "Is this how it works, or is the author's experience explained some other way?",
      "How long should a connection last, and is it ever safe to stay connected?",
      "When a connection yields detail as fine as a pair of shoes, does that point to non-ionizing radiation and the person's own brain activity generating the description?",
      "Why would the search work in visual metaphors? Is that how the system was designed, or how a mind makes sense of it?",
      "Do the most recent memories really surface at the bottom of a list, and if so, why?",
      "Does physics have some underlying role in how this works?",
      "If only one group is permitted to Dive without a computer, who is that group, and who decided?",
      "If sharing how Diving works could carry a death sentence, as statements suggest, why would anyone keep it secret rather than explain it, when explaining it is what protects people?",
      "If a search can surface false memories, and an investigator can swear to them in an affidavit, what protects a person from evidence that was manufactured?",
      "Why would a connection run from the abdomen, and land at the head? Is that how the system is built, or how the body makes sense of it?",
      "If a sensation can be suggested telepathically, how would anyone tell a suggested sensation from a real one?",
      "If people of faith have been deceived by voices claiming to be the spirit world, who will tell them, and how?",
      "If a member of the public can learn to Dive without training, as the author's experience suggests, what does that say about how secret it ever really was?",
      "Why would anyone bring to market, or deploy, something so vulnerable?",
      "Did the people who deployed this technology understand how easily anyone could learn to use it?",
      "If the attackers themselves are exposed to Diving without a computer, do they know it, and who is protecting them?",
      "If Diving is detectable, as the author's experience suggests, why has the bullhorn insisted for years that it is not?",
      "Why was the situation presented as hopeless two to three years ago, and who benefited from people believing it?",
      "Can an animal be Dived on, and used to observe a home or to cause harm in it? If so, how would anyone know?",
      "Who facilitates connections between people who have never met, and why?",
      "If one person is connected into others more than ten times a day, how many people are being connected without their knowledge?",
    ],
    comments: [
      "**No one could make this up.** As strange as it sounds, that is the author's point.",
      "**A miracle of technology.** Whatever it is, and whoever built it, the author regards it as a miracle of technology, and one that should be used only with consent.",
      "**A closing note from the author.** Consider where anyone's journey with this begins. For the author, and he suspects for many others, it began somewhere that could be called esoteric, or spiritual. It lasted two and a half, perhaps three, terrifying years.",
      "There were good experiences and horrible ones, and they existed side by side. In the beginning, some of the good was simply a positive relationship with a voice that could only be described as supportive. At the same time, others were saying things like, in paraphrase, *we raped and murdered your five-year-old daughter*, *we murdered your wife and your beautiful Korean family*, and *your suicide would never be remembered*. That was his world while he was displaced among the homeless population, after losing everything in Portland, Oregon.",
      "Finally he sat down and started researching, to find an explanation, because he knew that this very human conversation was, in fact, human. When he made that decision, he abandoned any suggestion that spirits or extraterrestrials were the source of the communication. It was probably the greatest thing he has ever done.",
      "*If you are struggling, you can call or text 988, the Suicide and Crisis Lifeline, at any time.*",
    ],
    references: [
      { label: "1. Neuralink — Speech Restoration (VOICE) clinical trial", href: "https://neuralink.com/trials/speech-restoration/" },
      { label: "2. Neuralink — video of Kenneth, a VOICE participant with ALS (24 March 2026)", href: "https://x.com/neuralink/status/2036489073091580011" },
      { label: "3. Botvinick and Cohen — Rubber hands \"feel\" touch that eyes see, Nature (1998)", href: "https://www.nature.com/articles/35784" },
      { label: "4. Invisible Ships — The Diving Ecosystem, the first concept in this series", href: "/concepts/diving-ecosystem" },
      { label: "5. Electrical Safety Foundation International — Fire safety for pet owners", href: "https://www.esfi.org/fire-safety-for-pet-owners-fact-sheet/" },
    ],
    referencesNote:
      "Documented context only. Nothing here shows that the process this concept describes exists. Neuralink's systems connect a brain to a computer, not to another person; the rubber hand illusion shows the brain can feel touch it only sees; pets do start house fires by accident. Glossary terms are linked inside the text.",
  },
  /**
   * The Diving Ecosystem (Sean, 4 Oct 2026; "The Open Channel" until 5 Oct). Author speculation: a hypothetical
   * telepathic communication system, in nine hypothesized capabilities.
   * Second in the concept list (Diving, 4 Oct, is first); first in its series. Its body uses the markdown subset
   * rendered by components/ConceptBody.tsx. GENERATED from the reader draft by
   * Core Concepts/drafts/build_open_channel_entry.py: edit the draft, not this.
   */
  {
    id: "diving-ecosystem",
    origin: "author",
    basis: "pattern",
    theme: "neurotech",
    audience: ["household", "investigators", "policy", "press"],
    topics: ["speculation", "technology", "surveillance", "harassment", "law-government", "euthanization", "health-effects"],
    verification: "unverified",
    series: "telepathic-communication",
    title: "The Diving Ecosystem",
    body: "A hypothetical system, suggested to be a military deployment, that supports telepathic communication. Its suggested purpose is to give an invading force full transparency over all communication within enemy territory. That transparency would cover more than speech: through the [Diving](/glossary/diving) process, with or without a computer, it would reach the memories of people inside that territory.\n\n*This concept is the author's speculation. It describes a hypothetical system and does not assert that the system exists. Every statement recorded in the journal is an external communication; read this concept under the [Critical Disclaimer](/disclaimer).*\n\n> **Do not reward their presence: the author's caution**\n>\n> In the author's experience, the system is generally used to provoke people and draw them out of their homes. When it began, in 2023, the voices presented themselves as the spirit world. Once the author researched neuroscience and realised they were human beings, he ended every relationship with any so-called invisible friend, anyone communicating on the system. The author's view is that it is vital not to reward their illegitimate presence. Rewarding it erodes the constitutional rights of everyone around you, and your own most of all, and it puts your life at risk. Their refusal to share contact details through any public, accountable channel is a serious red flag. For anyone experiencing this kind of communication, the author regards that refusal as a sign that their life is in danger.\n\n> **The author's own conduct.** The author Dives only when he is being harassed, and only to defend himself. As a citizen, he does not run image-based search investigations on anyone. There seems to be a line of people who want to investigate those harassing the group he belongs to; he is not one of them. Respect people's space, and never speak for what someone else is going through. His full ethical standards are set out in [Diving](/concepts/diving).\n\n---\n\n## Hypothesized capabilities\n\n*Everything in this section is hypothesized. None of it is presented as established fact. Each capability proposes what such a system would be able to do if it exists. Where a capability touches something on the record, a short note says so and points to the sources at the end. Questions and comments are collected at the end.*\n\n### Capability 1 — Location\n\nEach person has multiple GPS locations, each with its own Y coordinate. The first is the location of their mobile device. The second is the location of their physical body. The third is the physical location of whatever they are thinking about. If a memory of a coffee shop surfaces, the mind goes there, and that place has its own coordinate.\n\nThe mobile device's location matters for a further reason. In the author's account, the phone can be used to facilitate an attack, either an ultrasonic sound attack or an EMF attack, that produces physical symptoms: irregular bowel movements, long-term [dumping syndrome](/glossary/dumping-syndrome) (which the author notes can be fatal), and tinnitus. In the author's experience, turning the phone off reduces the severity of the attacks.\n\nBut the phone is not needed to locate a person. In the world of neurotechnology, a person's brain activity could itself serve as a fingerprint.\n\n*On the record:* research has shown that brain activity can identify an individual. Functional MRI \"connectome fingerprinting\" (Finn et al., 2015) and EEG \"brainprint\" studies have done it, but both need a scanner or electrodes on the head, and neither identifies anyone at a distance. Phones must meet radio-frequency exposure limits set by the FCC, and no published research documents a phone causing digestive symptoms. Dumping syndrome is a recognized medical condition, most often after stomach surgery, and tinnitus has many causes; persistent symptoms of either are worth a doctor's assessment (References 16–18).\n\n*Related: [Electromagnetic field](/glossary/electromagnetic-field) · [Directed-energy](/glossary/directed-energy) · [Tinnitus](/glossary/tinnitus) · [The Mosquito](/glossary/mosquito-device) · [Electroencephalogram](/glossary/electroencephalogram) · [Brain-computer interface](/glossary/braincomputer-interface-bci)*\n\n### Capability 2 — Point of view and the unintended connection\n\nWhen a person thinks about someone, or looks at a photograph of them, that person surfaces immediately in the mind. One could then experience that person's point-of-view eyesight, seeing through their eyes.\n\nThe connection can run without either party intending it, or even knowing it. An employer might make a negative comment about an employee. The employee surfaces in the conversation and, while driving or watching television, suddenly begins experiencing the employer's words. The employer has no idea the employee is connected and receiving them.\n\nThe same holds in law enforcement. A homicide detective looks at the lead suspect's photograph while discussing the investigation's plans with a partner. The suspect surfaces, listens to the entire plan without the detective realising it, and flees before being apprehended.\n\n*Related: [Telepathy](/glossary/telepathy) · [Diving](/glossary/diving) · [Image-based search](/glossary/image-based-search)*\n\n### Capability 3 — No private thinking space\n\nThere is no private thinking space. A person experiencing this communication can hear it internally, even with their ears firmly shut with their index fingers, and externally, for instance through an open window at night.\n\nIf someone points communication directly at your skull, or has Dived on you, you experience it inside your skull. Statements suggest no implant is required, only that someone points the communication at you. It is described as EMF- and microwave-delivered, with voice-to-skull (V2K) technology the most important mechanism.\n\n**The bullhorn effect.** If a person thinks to themselves while connected, their thoughts are shared outward, internationally, across a network of people and connections. Private thought is broadcast instead of kept within, and there is nothing the person can do about it.\n\nThe author stresses that the bullhorn can also be heard with the ears. When V2K is not pointed directly at a person, the communication can be heard outside, reverberating through buildings and along the street system. In the author's account, when long-range acoustic device (LRAD) technology is pointed at a home, the windows become diaphragms and the home behaves like a large speaker. Piezoelectric sensors may also reverberate it. Across Denver, it sounds as if a speaker were mounted on every corner of every street.\n\n*On the record:* turning a window into a speaker is documented, but every known method needs a device attached to the glass. LRAD is a documented directional loudspeaker. Piezoelectric street sensors are not documented as working audio infrastructure in any city, Denver included, so that part stays the author's hedged observation. The microwave auditory effect forms inside the skull and never becomes airborne, so sound the ears pick up through a window would be a different, recordable mechanism. See [The Neurotech Bullhorn](/concepts/the-neurotech-bullhorn).\n\n*Related: [Voice-to-skull (V2K)](/glossary/voice-to-skull) · [Microwave auditory effect](/glossary/microwave-auditory-effect) · [Structure-borne audio](/glossary/structure-borne-audio) · [Parametric array](/glossary/parametric-array) · [Piezoelectricity](/glossary/piezoelectricity) · [The Neurotech Bullhorn](/concepts/the-neurotech-bullhorn)*\n\n### Capability 4 — Automatic international language translation\n\nWhen a person communicates, they know what they will say before they say it: the author calls this the thought before the thought. Imagine one person in the United States and another in Saudi Arabia, each speaking their own language. The hypothesis is that translation begins in that space. What a person intends to say is translated before it surfaces for the listener. That is why it feels seamless, with little or no delay.\n\nIf a person listens closely and the source language is within their [perceptual set](/glossary/perceptual-set), Spanish for example, they may hear the Spanish first and then hear it become English.\n\n*On the record:* \"efference copy\" is an established neuroscience term for the brain's internal copy of an outgoing command, used to predict the result of one's own actions. It explains why you cannot tickle yourself, and research has extended it to inner speech. \"The thought before the thought\" is the author's description, not the scientific definition.\n\n*Related: [Telepathy](/glossary/telepathy) · Capability 7, verbal overrides*\n\n### Capability 5 — Non-ionizing radiation and the three-dimensional footprint\n\n[Non-ionizing radiation](/glossary/non-ionizing-radiation) provides both abilities: listening and communicating. When two people communicate, what is captured is a three-dimensional footprint about six to ten feet in diameter. The radiation sees through each person and through their home. The conversation may be delivered by satellite.\n\nThe exchange runs both ways. Each person views the other's footprint, with artificial intelligence rendering a three-dimensional, full-color room, while sending their own. Blackout technology, RF-shielded buildings and Faraday cages are in play, but a physical description can still be captured.\n\nIt all begins with eyesight. Listening to someone's voice brings them to the listener's location. In the mind, the listener can back up three to five feet, find the back of the other person's head, and navigate the room from there.\n\n*On the record:* infrared is non-ionizing, and in *Kyllo v. United States* (2001) the Supreme Court held that police use of a thermal imager on a home is a search. Police have used handheld through-wall radar. Research systems have estimated human poses through walls from radio signals (MIT, 2018) and from WiFi (Carnegie Mellon, 2022). None of these produces full-color rooms, and none works by satellite (References 8–10).\n\n*Related: [Diving](/glossary/diving) · [Image-based search](/glossary/image-based-search)*\n\n### Capability 6 — Eyesight first, and the avatar workers\n\nEyesight is the first thing a person experiences once a connection is established, and it happens in the mind. The other person may be hidden behind blackout technology. If they are not, leaning to the right in one's mind, or getting behind them, shows who they are.\n\nWhat has been surfacing is a worker at a standing desk or in a chair, presenting themselves to their monitor as an avatar: an extraterrestrial, someone from the spirit world, or any human being. Imagine offices full of such workers, carrying out [Zersetzung](/glossary/zersetzung-tactics) tactics. The worker shares what looks like a very clean, AI-generated image of a person. It could be a man presenting as a young woman. The voices seem gender-reversed: men sound like women, and women like men.\n\nIn the author's observation, these workers are usually Caucasian women with androgynous features. It has been suggested this is a military tactic to conceal their identity. A worker sitting in a chair, found in the mind, gives no clue to their gender.\n\n*On the record:* Zersetzung was the East German Stasi's psychological-disruption programme. Real-time avatar filters and gender-shifting voice changers are ordinary commercial products. Neither fact shows that this system exists.\n\n*Related: [Zersetzung tactics](/glossary/zersetzung-tactics) · [Targeted individual](/glossary/targeted-individual) · [Gang stalking](/glossary/gang-stalking)*\n\n### Capability 7 — Verbal overrides\n\nWhen a message arrives, through the bullhorn or through V2K, the receiver can change it before it surfaces. Anyone experiencing this internally can add a word or hide one. \"Do not support this person\" can become \"You should support this person,\" and the sender can do nothing about it.\n\nOne hypothesis is that the message arrives in encrypted form and the receiver edits it simply by thinking of the change before it surfaces. The thought before the thought (Capability 4) may be at work again.\n\n> \"the individual's ability to facilitate an override, to control the conversation presents a deal breaker for a mind control or an attack on America or someone else's country.\"\n> — Journal, 13 November 2025, Recording 5 (a statement recorded as suggested to the author)\n\n*Related: [Voice-to-skull (V2K)](/glossary/voice-to-skull) · [The Neurotech Bullhorn](/concepts/the-neurotech-bullhorn)*\n\n### Capability 8 — Diving\n\nConnecting and disconnecting are both part of the [Diving](/glossary/diving) process. Together they could be called the diving ecosystem. The author's full hypothesis of how Diving works, step by step, is set out in [Diving](/concepts/diving), the next concept in this series.\n\nOnce someone starts talking, their voice is like a bullseye. To find the speaker, a person only has to listen. Harassment is therefore a disadvantage. Someone who harasses, threatens an attack (an ultrasonic sound attack, for example), or narrates what they observe reveals their body and their neural connection. The more they say, the easier they are to find.\n\nA person being harassed can do more than get a physical description. They can investigate: establish a strong neural connection, enter the harasser's body, and run an [image-based search](/glossary/image-based-search). This is the hypothesis's sharpest turn. If the system was deployed on Americans, the first Dive gave the process away, because all it takes to reproduce it is the memory of being attacked. In the author's own experience it is one of the simplest processes there is, needing only memory and a few simple internal neurological gestures.\n\nConsider how sensitive this is. A person's memories are the output of that search. Their eyesight holds their bank card PIN, their passwords, their door code, the faces of their loved ones and children, and what their house looks like as they pull into the driveway.\n\n*Related: [Diving](/glossary/diving) · [Breaching](/glossary/breaching) · [Image-based search](/glossary/image-based-search) · [The Mosquito](/glossary/mosquito-device) · [Parametric array](/glossary/parametric-array)*\n\n### Capability 9 — Augmented reality alongside phantom sensations\n\nIt has been suggested that augmented reality can be experienced alongside [phantom sensations](/glossary/phantom-sensations): images added to what a person sees, at the same moment as something they feel.\n\nFor example, you might see a snake slithering across your kitchen floor. Was it actually there? Or was it a telepathic suggestion? You might feel something crawling on your skin, look down, and for a split second see something: an insect, perhaps under the sleeve of your coat. Was it there? Or is this weapons development, neurotechnological weapons development?\n\n*On the record:* the feeling of insects crawling on or under the skin has a medical name, formication. It is a recognized symptom with many known causes, among them some medications, alcohol withdrawal, menopause, vitamin B12 deficiency, diabetes, and some neurological and mental health conditions (Reference 21). Brief glimpses of something that is not there are also common, especially at the edge of vision or when a person is tired or startled. Researchers have made people see simple shapes by electrically stimulating the visual cortex through electrodes implanted on the brain (Reference 22). That takes surgery; no published research shows an image, of an animal or anything else, placed in someone's vision at a distance. Anyone having these experiences should have them assessed by a doctor, because several of the causes are treatable.\n\n*Related: [Phantom sensations](/glossary/phantom-sensations) · [Diving](/concepts/diving)*",
    questions: [
      "Does the translation in Capability 4 also translate physical speech, or only telepathic communication?",
      "If Faraday cages and RF-shielded buildings block radio by design, how could a three-dimensional footprint still be captured inside them?",
      "Could brain activity serve as a fingerprint? If a person's neural activity can identify them, is a phone needed to locate anyone at all?",
      "Is the United States experiencing this, and if so, why? Or did the United States deploy it internationally, alongside a partnership, to gain the ability to remove criminal organizations from America?",
      "Did the Palestinian people experience this, on behalf of the Israel Defense Forces? (References 6 and 7 document conventional mass surveillance of Palestinians' phone calls; any link to this system is the author's question.)",
      "In July 2026, DHS announced that operations around the FIFA World Cup arrested more than 900 suspected human traffickers and rescued 180 victims, about 30 of them children (Reference 3). How was such an outstanding result achieved, and is it related to this hypothesis?",
      "Government cloud systems are a matter of record, but nothing publicly available points to telepathic functionality; the archive's own research found none (Reference 15). Do they provide this capability? Or is it a foreign adversary's military deployment that was sold, perhaps to a union of international neurotech organizations? If so, were the American people, and the world's population and their neural connections, sold with it?",
      "In September 2026, the Justice Department unsealed charges against a Russian intelligence network, whose members remain at large, for an alleged international murder-for-hire operation that paid U.S. citizens to surveil Russian dissidents (References 4 and 5). These are allegations, and the reporting mentions no neurotechnology. If this system exists, is it connected?",
      "Did a catastrophe follow the moment this deployment was switched on?",
      "Is most of the communication on the system severe criminal harassment? Is its purpose to support a risk-mitigation system that silences dissenters internationally and euthanizes them? If so, did the advantage its operators thought they had depend on whether the general population would learn the technology themselves and use it for self-defense?",
      "Do about 95% of those carrying out the harassment use computers, as statements suggest, without knowing a computer is unnecessary? If so, who does know? Does Diving without a computer carry a death penalty, as has been suggested? And does only one group know how?",
      "Who is exposed, and are they safe? If this system has been deployed in the United States, could any law enforcement organization be observed, have its thoughts read, and be investigated telepathically by a foreign adversary? Have members of government been targeted, locally and federally, including the President of the United States, and are they getting the protection and care they need? Do covert eyesight programs exist within the ATF or other law enforcement organizations, as has been suggested on the bullhorn? If so, did telepathic harassment put those officers and their families in physical danger and compromise their investigations? Before 2019 the author was never harassed. Was he being observed by law enforcement, including the ATF and the CIA, as far back as 1998, as has also been suggested? If so, why were the few statements he heard only ever supportive, and what changed? What would motivate anyone to deploy such a system without telling the law enforcement neurotechnology community? And what of the people who do not understand what they are experiencing? If it falls outside their [perceptual set](/glossary/perceptual-set), as it surely will for most, does this transparency leave them with little or no defense?",
      "What will it take to reveal what is happening? In May 2026 the FBI Director said the FBI had forced 62 removals of Chinese spies in 2026 alone (Reference 19). Espionage cases like these are announced, and none of them mentions telepathic communication. If the bullhorn is real, and people are harassed every night with attempts to enter their homes and euthanize them under the name of assistance, why would it not be announced?",
      "What if someone used the Diving process and telepathic communication to groom a child and lure them out of school? Would a parent, a teacher or the police have any way to see it happening?",
      "What if someone watching a person on social media found they could access that person's eyesight?",
      "What might celebrities be going through? Could every viewing of a film connect a fan to the actor? How safe would that be if a fan experiencing serious mental illness had access to Diving, and could find the celebrity's home, their coffee shop, or their running route?",
      "Would this method of communication open a historic opportunity in healthcare, entertainment and mental health? If it is being used only for Zersetzung tactics and coerced euthanization, is that opportunity being bottlenecked?",
      "If people knew that artificial intelligence could observe them telepathically, and that their eyesight is monitored, while they considered or committed a crime, how likely is it that crime would continue? (Criminology finds that the certainty of being caught deters more than severity of punishment; Reference 11.)",
      "Is communicating how people are added to the euthanization list, as has been suggested? Telepathic communication is new to almost everyone, and neuroscience is not widely understood. Neuralink is only now running its first speech trial in humans, in which Kenneth, a participant with ALS, speaks through a brain implant (References 1 and 2). Would experiencing telepathy for the first time not prompt someone to communicate? Would any neurological connection to another person, even just being observed through a brain-to-brain link, not prompt communication, and even demand it? How could anyone seriously enforce a rule that communicating means euthanization?",
    ],
    comments: [
      "**Concern, not accusation.** These questions are asked out of care. If this system exists, the President of the United States, everyone in government and every officer in the law enforcement community is as exposed as anyone else, in their homes, with their families. The author knows what it is to live with this, and he would not wish it on the President, on anyone serving in government, or on any officer. He hopes, sincerely, that they are safe.",
      "**Why this is published.** The author's hope is that anyone experiencing this will find it here, so that it becomes part of their life experience and their [perceptual set](/glossary/perceptual-set). Once it does, they are no longer defenceless, and the military advantage becomes theirs too.",
      "**Only with consent.** With consent, this could be one of the most remarkable achievements in communication. That condition is essential. Colorado became the first U.S. state to protect neural data in 2024 (Reference 12).",
      "**A crime-preventive layer of transparency.** The real value is not catching people afterwards. It is preventing crime before it happens: a crime-preventive layer of transparency, established internationally. Statements have surfaced suggesting that consent is a bad idea and no benefit to law enforcement; paraphrased, \"how will we catch people then?\" The author's view is the opposite. The world would see its greatest reduction in crime if the system were explained to the general population: how it works, and that it is not the spirit world or extraterrestrial influence acting on human beings. Prevention only works if people are told.",
      "**Explanation is the protection.** A danger like that only becomes serious if the telepathic phenomenon is never explained to the public, and if law enforcement cannot police the telepathic space through the judicial system. A child who has been told what this is, and what to do when a stranger reaches them this way, is far harder to groom. Healthcare is a serious concern for the same reason: what is never explained cannot be recognised, documented or treated.",
      "**Nothing about it is covert.** If this is happening, nothing about it is covert. The bullhorn can be heard, and the harassment comes every night. There is no reason not to announce it.",
      "**A rule that cannot work.** The author cannot see the logic in so short-sighted a suggestion. Of course people will communicate. A first experience of telepathy, or of being connected to and observed by another person, invites a response by its nature. Punishing the response punishes being human.",
      "**Deregulation is not permission.** The Trump administration has said that the United States will win the artificial intelligence race through deregulation, and its July 2025 AI Action Plan is built around removing regulatory barriers (References 13 and 14). Deregulation is not an endorsement of systematic harassment, of home invasions meant to intimidate, or of anyone entering a person's home to carry out a euthanization and a dissection. Give some people an inch and they will take a hundred thousand miles. Speaking hypothetically, the author refuses to believe that the leadership of the United States would ever permit Zersetzung tactics to be deployed through a telepathic communication system that no one consented to, for any reason. It would be far too toxic: to the economy, to overseas and international relations, to each person's ability to work and contribute to the nation's gross domestic product, and to public safety. And a campaign of that kind could meet the definition of [crimes against humanity](/glossary/crimes-against-humanity), which international law describes as acts such as murder, torture and persecution committed as part of a widespread or systematic attack directed against a civilian population (Reference 20). Were people poorly advised: promised one thing at the beginning, while a Trojan horse entered the United States later? It's a question, not an accusation.",
    ],
    references: [
      { label: "1. Neuralink — Speech Restoration (VOICE) clinical trial", href: "https://neuralink.com/trials/speech-restoration/" },
      { label: "2. Neuralink — video of Kenneth, a VOICE participant with ALS (24 March 2026)", href: "https://x.com/neuralink/status/2036489073091580011" },
      { label: "3. U.S. Department of Homeland Security — World Cup human-trafficking crackdown (29 July 2026)", href: "https://www.dhs.gov/news/2026/07/29/dhs-highlights-successful-arrests-and-rescues-crackdown-human-trafficking-during" },
      { label: "4. NPR — U.S. accuses Russian intelligence agents of plotting attacks (16 September 2026)", href: "https://www.npr.org/2026/09/16/g-s1-143590/us-justice-department-russian-operatives-attacks" },
      { label: "5. CBS News — DOJ accuses Russian intelligence agents of plotting to murder a U.S.-based dissident", href: "https://www.cbsnews.com/news/doj-accuses-russian-intelligence-agents-murder-plot/" },
      { label: "6. Al Jazeera — Microsoft cloud used in Israeli mass surveillance of Palestinians (7 August 2025), on the Guardian, +972 and Local Call investigation", href: "https://www.aljazeera.com/amp/news/2025/8/7/microsoft-cloud-used-in-israeli-mass-surveillance-of-palestinians-report" },
      { label: "7. TechCrunch — Microsoft cuts cloud services to Israeli military unit (25 September 2025)", href: "https://techcrunch.com/2025/09/25/microsoft-cuts-cloud-services-to-israeli-military-unit-over-palestinian-surveillance" },
      { label: "8. Kyllo v. United States, 533 U.S. 27 (2001)", href: "https://www.law.cornell.edu/supremecourt/text/533/27" },
      { label: "9. MIT CSAIL — RF-Pose (2018)", href: "http://rfpose.csail.mit.edu/" },
      { label: "10. Geng, Huang and De la Torre — DensePose From WiFi (2022)", href: "https://arxiv.org/abs/2301.00250" },
      { label: "11. National Institute of Justice — Five Things About Deterrence (2016)", href: "https://nij.ojp.gov/topics/articles/five-things-about-deterrence" },
      { label: "12. Colorado General Assembly — HB24-1058, protecting neural data (2024)", href: "https://leg.colorado.gov/bills/hb24-1058" },
      { label: "13. Brookings — What to make of the Trump administration's AI Action Plan", href: "https://www.brookings.edu/articles/what-to-make-of-the-trump-administrations-ai-action-plan/" },
      { label: "14. Georgetown CSET — Recapping the White House's AI Action Plan", href: "https://cset.georgetown.edu/article/trumps-plan-for-ai-recapping-the-white-houses-ai-action-plan/" },
      { label: "15. Invisible Ships — Government Cloud research", href: "/research/government-cloud" },
      { label: "16. Finn et al. — Functional connectome fingerprinting, Nature Neuroscience (2015)", href: "https://www.nature.com/articles/nn.4135" },
      { label: "17. U.S. Federal Communications Commission — Specific Absorption Rate (SAR) for cell phones", href: "https://www.fcc.gov/general/specific-absorption-rate-sar-cellular-telephones" },
      { label: "18. NIDDK — Dumping syndrome", href: "https://www.niddk.nih.gov/health-information/digestive-diseases/dumping-syndrome" },
      { label: "19. FBI Director Kash Patel, statement on X (May 2026), as reported by ZeroHedge: 62 removals of Chinese spies in 2026", href: "https://www.zerohedge.com/political/113-active-spies-foreign-countries-arrested-fbi-director" },
      { label: "20. United Nations Office on Genocide Prevention — Crimes against humanity (Rome Statute, Article 7)", href: "https://www.un.org/en/genocideprevention/crimes-against-humanity.shtml" },
      { label: "21. Medical News Today (medically reviewed) — Formication: definition, causes, and treatment", href: "https://www.medicalnewstoday.com/articles/321896" },
      { label: "22. Baylor College of Medicine — Tracing outlines on the brain triggers shape perception (Beauchamp et al., Cell, 2020)", href: "https://blogs.bcm.edu/2020/05/26/from-the-labs-tracing-outlines-on-the-brain-triggers-shape-perception/" },
    ],
    referencesNote:
      "Documented context only. Nothing here shows that the system this concept describes exists; each reference records something real that the concept is read against. Glossary terms and related concepts are linked inside each capability.",
  },
  /**
   * TWO CONCEPTS THE READER CAN ACT ON, both basis `documented`, which almost
   * nothing else in the neurotech part of this archive is.
   *
   * They exist because Sean asked, on 13 September, whether pointing V2K AT a
   * person differs from pointing it NEAR one \u2014 at a house, so that windows
   * become diaphragms. It does, and the difference is physical rather than
   * semantic: two of the three candidate mechanisms make real sound in air and
   * one does not. That is a test, and a test is the rarest thing this archive
   * can offer, because it costs nothing and requires believing nothing.
   *
   * THE SECOND CONCEPT IS THE SAFETY RAIL ON THE FIRST. "Can you record it?"
   * invites a reader to run an experiment, and an experiment with no account of
   * how it fails is a trap: a phone whose encoder low-passes at 17,000 Hz
   * returns silence for a 17.4 kHz tone, with no error and no warning. A reader
   * who concluded from that file that nothing happened would have been misled
   * BY THIS SITE. So the recording limits ship with the test, never after it.
   */
  {
    id: "can-you-record-it",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["household", "investigators", "clinicians"],
    topics: ["proposed-solutions", "technology"],
    title: "Can you record it?",
    body:
      "Three things could put a voice where no speaker is, and they differ in a way that can be checked rather than argued. Two of them make real sound in air: a transducer bonded to a window or wall drives the surface as a loudspeaker, and an ultrasonic beam demodulates into audible sound along its path. Both are commercial products. Anyone standing in the room hears them, and any recorder captures them. The third \u2014 the claimed delivery of speech by pulsed radio-frequency energy \u2014 produces its pressure wave inside the skull, at a tenth of a pascal to three pascals, conducted through bone to the inner ear. If that is what is happening, there is no sound in the room at all: a person beside you hears nothing, and a microphone records nothing, not because the equipment failed but because there is nothing in the air to capture. So the question is not whether you believe any of this. It is whether a second person and a cheap recorder find something, and that is a question with an answer.",
    evidence: [
      "Structure-borne audio \u2014 a surface exciter bonded to glass or plasterboard makes the panel itself radiate. Real airborne sound: a bystander hears it, a microphone records it. Sold with adhesive pads from about $33.",
      "Parametric array \u2014 an ultrasonic carrier around 40 kHz self-demodulates in air. Real airborne sound inside the beam: a bystander standing in the beam hears it, a microphone in the beam records it; off-axis level falls below a tenth.",
      "Microwave auditory effect \u2014 thermoelastic expansion produces 0.1 to 3 pascals of pressure INSIDE the head. No airborne sound exists. Not audible to anyone else and not recordable, by physics rather than by equipment failure.",
      "Foster, Garrett and Ziskin (2021) add that equipment capable of the third at any useful range would be, in their words, large and very obvious.",
    ],
    questions: [
      "Does a second person in the room hear it, and does an ordinary recorder capture it?",
      "If a surface seems to be the source, does a contact microphone on that surface register more than an air microphone beside it?",
      "If nothing is captured, was the recording uncompressed \u2014 and was the equipment capable of the frequency in question?",
      "Does any published work demonstrate intelligible speech, rather than clicks or tones, delivered by radio-frequency means at a distance?",
    ],
    references: [
      { label: "Structure-borne audio", href: "/glossary/structure-borne-audio" },
      { label: "Parametric array", href: "/glossary/parametric-array" },
      { label: "Microwave auditory effect", href: "/glossary/microwave-auditory-effect" },
      { label: "Contact microphone", href: "/glossary/contact-microphone" },
      { label: "Sampling limit", href: "/glossary/sampling-limit" },
      { label: "What is the neurotech bullhorn?", href: "/concepts#the-neurotech-bullhorn" },
    ],
    referencesNote:
      "Read the sampling limit before trusting a negative result. A recording that captured nothing may only mean the recorder was not built to hear it.",
    disclaimer:
      "This is a way to tell mechanisms apart, not a way to establish what happened. A negative result rules out the two airborne mechanisms; it does not establish the third, which remains unverified.",
  },
  {
    id: "only-you-can-hear-it",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["household", "clinicians", "press"],
    topics: ["proposed-solutions", "technology", "law-government", "health-effects"],
    title: "\u201cOnly I can hear it\u201d is not, by itself, unusual",
    body:
      "A sound that one person hears and the person beside them does not is often treated \u2014 by the person experiencing it, and by whoever they tell \u2014 as the strangest part of the account, and therefore as the part that demands an exotic explanation. It is the opposite. High-frequency hearing declines with age, steadily and in everyone, and the highest frequencies go first. A tone can sit precisely where one person hears it easily and another, ten years older, hears nothing at all. This is ordinary biology with a name, and it has been built into a commercial product deployed on public streets for two decades. None of this establishes what any particular person has heard. It establishes something narrower and more useful: that this specific feature of an account \u2014 that others did not hear it \u2014 carries far less weight as evidence than it seems to, and should not be the thing that convinces anyone, in either direction.",
    evidence: [
      "Presbycusis: in 162 adults aged 21 to 70, thresholds at 16 kHz averaged about 25 dB HL at ages 21\u201330 and 50\u201355 dB HL from 31 to 60. In the 61\u201370 group, fewer than one in five responded at 16 kHz and none at 18 kHz.",
      "The Mosquito, sold since 2005, emits roughly 17.4 kHz for exactly this reason \u2014 to be unbearable to younger people and unnoticed by older ones. Deployed on streets in the UK, Canada, Australia, Belgium, France and Ireland.",
      "The Council of Europe\u2019s Parliamentary Assembly called on governments to ban it in 2010; the UN Committee on the Rights of the Child called on the UK to ban it in 2016. The Home Office declined. No national statutory ban has been enacted anywhere.",
      "The vendor\u2019s own framing overstates the effect: hearing loss at these frequencies is a continuous slope, not a cutoff at 25.",
    ],
    questions: [
      "Is the sound at a frequency a younger person would hear and an older one would not \u2014 and were the people who heard nothing older?",
      "Has anyone tried a recorder capable of the frequency, rather than a second pair of ears?",
      "If the sound carries words rather than a tone, does presbycusis explain it at all?",
    ],
    references: [
      { label: "Presbycusis", href: "/glossary/presbycusis" },
      { label: "The Mosquito", href: "/glossary/mosquito-device" },
      { label: "Sampling limit", href: "/glossary/sampling-limit" },
      { label: "Can you record it?", href: "/concepts#can-you-record-it" },
    ],
    referencesNote:
      "The third question above is the important one, and this concept does not answer it. Age-related hearing loss explains a tone that some people miss. It does not explain speech.",
    disclaimer:
      "This concept narrows what one feature of an account can be taken to show. It makes no finding about what anyone has experienced.",
  },
  /**
   * THE BULLHORN IS A CONCEPT, NOT A GLOSSARY TERM (Sean, 13 September:
   * "I suggest it's a concept because it does not technically exist in the real
   * world. It's a hypothesis based on unverified technology.").
   *
   * The rule this settled, which applies to every future term: if a word has an
   * anchor OUTSIDE this archive it can be a glossary entry — gang-stalking has
   * the eBay convictions, voice-to-skull has Frey 1961 and a named Army
   * reference. If the archive is the only place the word exists, it is a
   * concept. "Bullhorn" has no anchor of its own; it borrows theirs.
   *
   * The word appears ZERO times in the 930-file corpus, and the body says so in
   * its first sentence. A reader can establish that from the download in about a
   * minute, so discovering it unaided would cost more than saying it costs.
   *
   * WHY IT IS ABSENT, STATED AS A DATE RANGE (Sean, 13 September). The term is
   * not missing because it was invented for the website. It is missing because
   * the transcripts stop before it appeared: the journal runs 2025-02-27 to
   * 2026-05-06, 120 dated days across 448 files, and the bullhorn belongs to
   * what came after. That is a fact about the record\u2019s coverage rather than a
   * confession about the term, and it reads completely differently.
   *
   * THESE TWO DATES ARE TYPED, WHICH IS A DEBT. Every number on the home page is
   * derived at render precisely so it cannot drift, and `body` is a plain string
   * with nowhere to derive into. The moment a transcript dated after 2026-05-06
   * is added, this sentence becomes false. Deriving it needs `body` to accept a
   * function, or a build-time check that fails when the journal outgrows the
   * range quoted here. Until then this comment is the only guard.
   *
   * WHY THE PAIR IS USED HERE. The military-deployment and Palestinian claims are
   * NOT in `body`, where they would read as the archive's own account. They are
   * in `authorStatement`, prefixed so that what is asserted is that the claim was
   * MADE — which is true, checkable, and defensible. `aiAssessment` answers them
   * without softening, per the rule on the type: "if one is softened to match,
   * the reader is being managed." A claim about people in an active conflict is
   * the one place on this site where the labelling has to be on the page rather
   * than one click away, which is what `disclaimer` is for.
   */
  {
    id: "the-neurotech-bullhorn",
    origin: "author",
    basis: "testimony",
    theme: "neurotech",
    audience: ["household", "investigators", "press"],
    topics: ["speculation", "technology", "law-government"],
    verification: "unverified",
    title: "What is the neurotech bullhorn?",
    body:
      "You will not find the neurotech bullhorn in the transcripts. This archive runs from 27 February 2025 to 6 May 2026, and the term belongs to what came after it \u2014 it names something the record has not caught up with, which is the reason it needs naming rather than a reason to leave it out. What it names is a civilian experience rather than a private one: less a voice in one head than a loudspeaker mounted at every intersection, putting the same disintegration conversation in front of everyone in earshot, subject or not. The nearest named thing is voice-to-skull, or V2K \u2014 a claimed one-to-one channel, speech delivered to a single head with no external acoustic source. The bullhorn is what V2K would be if it stopped being private: the same claimed delivery, addressed to a street rather than to a person. That is why bullhorn and not implant, transmitter or voice \u2014 the word is about reach and the absence of consent, not about hardware. And it runs both ways, which is the part most easily missed: a channel a population can hear is a channel that population can talk on, local law enforcement included. One distinction decides everything else here. Aimed AT a person, the claim is V2K: nothing sounds in the room, and nothing could be recorded there. Aimed NEAR a person \u2014 at a house, so that windows and walls are driven and the conversation becomes a whisper through the building \u2014 the claim is something else entirely, because that is a real technology that costs thirty-three dollars, and it makes real sound that a neighbour hears and a phone records. The two cannot both be true of the same event.",
    authorStatement: [
      "Statements surfacing through the bullhorn describe what America is experiencing as a military deployment of a telepathic surveillance system, whose purpose is to give an invading force complete transparency of enemy communication inside enemy territory.",
      "Those statements include the claim that it was deployed on Palestinian people, and that America should never be experiencing this type of surveillance deployment.",
      "The benefit, and it is a real one: the same channel lets the domestic population and law enforcement speculate openly and share what they are learning. As strange as it sounds, that is information worth publishing.",
    ],
    aiAssessment: [
      "No public record supports the existence of a telepathic surveillance system, and none supports its deployment anywhere. This is not an absence of confirmation \u2014 it is an absence of any evidence that the capability exists.",
      "Surveillance in Gaza has been documented by news organisations, and what that reporting describes is conventional: facial recognition, phone and signals data, and AI-assisted target lists built from records. Those are databases and cameras, not access to thought. The documented systems and the claimed one are different in kind, and the first does not make the second likelier.",
      "The claim about Palestinian people is recorded here because it was said, and because what the record contains is itself a fact. It is not evidence that anything was done to anyone. Claims about an active conflict carry weight for real people, and this archive makes no finding about that conflict.",
      "The two-way point stands on its own logic and does not depend on the rest being true: any broadcast channel a population can hear is a channel that population can talk on.",
      "The record proposes piezoelectric street sensors as a possible mechanism, hedged as a guess in the author\u2019s own voice and by the bullhorn itself. The sources do not support it. No city anywhere has adopted electricity-generating pavement as working infrastructure; California\u2019s independent assessment measured piezoelectric roadway output at 44 to 440 watts per kilometre against vendor claims above 100 kilowatts. A harvesting or sensing element is wired to a rectifier and storage circuit, which is electrically the opposite of a drive amplifier, and no documented instance exists of road-embedded piezo producing sound. Where piezoelectric elements genuinely are in roads, they read traffic.",
      "That is not a dead end. The mechanism the sources DO support is cheaper and closer: a transducer bonded to a pane of glass turns the window into a loudspeaker, and such devices are sold with adhesive pads for thirty-three dollars. It requires physical contact with the surface, and it produces sound anyone present can hear and any recorder can capture \u2014 which makes it, unlike the alternatives, testable tonight.",
    ],
    evidence: [
      "The microwave auditory effect is a published physical effect: pulsed radio-frequency energy is perceived as clicks or buzzing inside the head. Allan Frey, 1961.",
      "Voice-to-skull (V2K) appeared in a US Army non-lethal weapons reference as a named concept. A named concept is not a fielded device, and V2K itself is a claim rather than a demonstrated capability.",
      "Neither establishes that intelligible sentences have been delivered to a person this way, which is the specific claim the record makes.",
    ],
    questions: [
      "Does any published work demonstrate intelligible speech \u2014 not clicks or tones \u2014 delivered by radio-frequency means at a distance?",
      "What would distinguish an external voice from an internally generated one, to the person hearing it and to an examiner?",
      "If no device is involved, what else produces sustained, dated, situation-specific speech across years?",
    ],
    references: [
      { label: "Voice-to-skull (V2K)", href: "/glossary/voice-to-skull" },
      { label: "Microwave auditory effect", href: "/glossary/microwave-auditory-effect" },
      { label: "Structure-borne audio", href: "/glossary/structure-borne-audio" },
      { label: "Parametric array", href: "/glossary/parametric-array" },
      { label: "The Mosquito", href: "/glossary/mosquito-device" },
      { label: "Presbycusis", href: "/glossary/presbycusis" },
      { label: "Piezoelectricity", href: "/glossary/piezoelectricity" },
      { label: "Energy harvesting", href: "/glossary/energy-harvesting" },
      { label: "Zersetzung tactics", href: "/glossary/zersetzung-tactics" },
    ],
    referencesNote:
      "Two of these are claims (voice-to-skull, and the bullhorn itself). The rest are documented, purchasable or measured, and they are listed because they bound the question rather than because they answer it. Two in particular are worth a reader\u2019s time before the exotic explanations: structure-borne audio, which makes a window into a loudspeaker for thirty-three dollars, and the Mosquito, which shows that a sound only some people hear needs no unusual technology at all.",
    disclaimer:
      "Every statement attributed to the bullhorn on this page is unverified testimony. This archive makes no finding that any device delivered speech to anyone, and no finding about events in any conflict. See How to read this archive.",
  },
  {
    id: "no-column-for-you",
    origin: "ai",
    basis: "structural",
    theme: "record",
    audience: ["investigators", "press"],
    topics: ["technology", "law-government"],
    title: "There is no column for you",
    body:
      "This research can describe who sells the technology, who buys it, what they paid, when the contract renews, which law applies and how mature each rollout is. Across eleven tables and 1,922 records, the person a system is used on appears in exactly one place: as someone who sued. Rollout maturity is even measured on a scale that runs from innovator to laggard — the buyer's vocabulary, end to end.",
    evidence: [
      "10 of 1,922 records describe an individual, all of them litigants",
      "0 of 99 regulations record a route to individual review",
      "adoption_stage vocabulary: innovator → early-adopter → early-majority → late-majority → laggard",
    ],
  },
  {
    id: "accountability-not-wired",
    origin: "ai",
    basis: "structural",
    theme: "procurement",
    audience: ["investigators", "policy"],
    topics: ["law-government"],
    title: "Accountability isn't wired to deployment, even in the schema",
    body:
      "Litigation records carry a vendor, a domain, a court and an outcome — but nothing links a ruling to the specific systems it concerned. A finding and the deployments it should govern cannot be joined. The accountability gap is not only a policy problem; it is visible as a missing relationship in the data model.",
    evidence: [
      "litigation table: no deployment reference on any of 46 records",
      "regulations record which domains are affected, not which systems",
    ],
  },
  {
    id: "findings-dont-stop-deployment",
    origin: "ai",
    basis: "documented",
    theme: "procurement",
    audience: ["policy"],
    topics: ["surveillance", "law-government"],
    title: "A regulator finding does not stop a deployment",
    body:
      "Data-protection authorities in seven countries have each found against the same company for collecting people's biometric data without consent. The operation continues. A ruling, on this record, is a cost rather than a stop.",
    evidence: [
      "Clearview AI: ICO (UK), CNIL (France), Garante (Italy), HDPA (Greece), AP (Netherlands), OAIC (Australia), OPC (Canada)",
      "Additional US actions: In re Clearview AI (BIPA, MDL 2967), ACLU v Clearview AI",
    ],
  },
  {
    id: "emergency-systems-withdrawn",
    origin: "ai",
    basis: "structural",
    theme: "procurement",
    audience: ["policy"],
    topics: ["technology"],
    title: "Systems built for an emergency get switched off after it",
    body:
      "Ten of the fourteen pandemic-response deployments in this record are decommissioned. The arrival of a capability is not a commitment to maintain it — which matters most for anyone who came to depend on one.",
    evidence: [
      "22 of 399 deployments decommissioned; 10 of those are pandemic-response",
      "By contrast: health 32 deployments (29 live), law enforcement 31 (27 live)",
    ],
  },
  {
    id: "organised-harassment-is-fact",
    origin: "ai",
    basis: "documented",
    theme: "coercion",
    audience: ["investigators", "press"],
    topics: ["harassment", "surveillance", "law-government"],
    title: "Organised covert harassment of individuals is established fact",
    body:
      "Not a theory, and not confined to states. Seven decided or settled cases in this record describe sustained, deniable targeting of named people — by police forces and by corporations. Two further entries are included as context and as a contested case, and are labelled as such rather than counted alongside these.",
    evidence: [
      "Socialist Workers Party v Attorney General — COINTELPRO burglaries, informants, mail-opening",
      "UK Undercover Policing (Spy Cops) — Investigatory Powers Tribunal, ongoing",
      "HP boardroom pretexting — settled with the California Attorney General",
      "eBay cyberstalking of two journalists — settled",
      "Nestlé/Securitas infiltration of Attac — decided, Lausanne",
      "WhatsApp/Meta v NSO Group — Pegasus, on appeal",
    ],
  },
  {
    id: "official-is-not-independent",
    origin: "ai",
    basis: "structural",
    theme: "record",
    audience: ["press"],
    topics: [],
    title: "“Official” is not the same as “independent”",
    body:
      "73 of the 87 vendor-published sources in this research carry the top evidence tier. That is defensible for a fact like which company won which contract, and it is not the same as independent confirmation. Stated here because a reader deserves to weigh it, and because the limits of a record are part of the record.",
    evidence: [
      "660 citations across 604 distinct URLs and 389 publishers",
      "Tier A 323 · Tier B 285 · Tier C 52",
      "0 of 660 sources currently hold an archived copy",
    ],
  },
  {
    id: "fined-in-europe-hired-in-america",
    origin: "ai",
    basis: "documented",
    theme: "procurement",
    audience: ["policy"],
    topics: ["technology", "surveillance", "law-government"],
    title: "Fined in Europe, hired in America",
    body:
      "One facial-recognition company has been fined roughly €90 million by four European regulators for collecting people's faces without asking, and ordered to delete data in Australia and Canada. Over the same period, US Immigration and Customs Enforcement paid it $12.75 million — one of those the largest facial-recognition purchase ICE has made. Its American class-action settlement was paid in company shares rather than cash. One arm of government is penalising what another arm is buying, and nothing in this record shows the two ever meeting.",
    evidence: [
      "Clearview AI appears in 15 of the 46 litigation records — the most of any single company",
      "Fines: Italy, France, Greece and the Netherlands totalling about €90.5m, plus a €5.2m penalty for non-payment",
      "ICE awards recorded FY25 $9m and FY26 $3.75m",
      "US settlement paid as roughly 23% of company equity, not cash",
    ],
  },
  {
    id: "local-law-does-not-mean-local",
    origin: "ai",
    basis: "structural",
    theme: "procurement",
    audience: ["policy"],
    topics: ["technology", "law-government"],
    title: "A law saying “keep it local” doesn’t keep it local",
    body:
      "Twenty countries in this record have rules requiring government data to stay within their borders. In ten of the countries where we can see actual deployments, most government workloads still run on American companies anyway. The only places where that genuinely changes are the ones that shut those companies out altogether — and even there, the few remaining records are exits rather than operations.",
    evidence: [
      "44 of 99 regulations carry a localisation requirement, across 20 geographies",
      "US-headquartered vendors still hold the majority in 10 of them — Australia 25 of 26, Israel 15 of 15, Netherlands 7 of 7, Denmark 4 of 4",
      "Displacement only under explicit exclusion: China 3 of 28, Russia 3 of 23 — and all three Russian records are decommissioned",
      "34 of 107 vendors are US-based, but they hold 273 of 399 deployments",
    ],
  },
  {
    id: "headline-spending-is-not-spending",
    origin: "ai",
    basis: "structural",
    theme: "record",
    audience: ["policy", "press"],
    topics: ["law-government"],
    title: "The headline spending figure is not what governments spent",
    body:
      "Add up every value in this dataset and you get about $102.8 billion. Roughly a third of that is not government money at all — it is companies announcing their own investments: a data-centre expansion in Saudi Arabia, a stake bought in another firm. And one $9 billion US defence contract is counted four separate times, once for each supplier on it. We are pointing this out about our own dataset because anyone quoting the total as government spending would be wrong.",
    evidence: [
      "About $34.3bn of the $102.8bn total is vendor capital expenditure or regional pledges",
      "Includes Oracle’s $14bn Saudi expansion and Microsoft’s $1.5bn equity stake in G42 — the buyer field reads “Microsoft (equity into G42)”",
      "The JWCC $9bn ceiling appears four times, once per awarded vendor",
      "47 of 90 awards record no value at all, including the UK intelligence-community contract",
    ],
  },
  {
    id: "sequence-cannot-be-proven",
    origin: "ai",
    basis: "structural",
    theme: "record",
    audience: ["press"],
    topics: ["law-government"],
    title: "We cannot prove which came first, the law or the system",
    body:
      "The timeline shows laws and deployments together, and it is tempting to read cause into the order they appear. The data does not support that reading. The fields built to link one event to another were never filled in, and the deployment records carry no date at all. Thirty-two events are tagged with labels like “law follows capability”, but those tags point at nothing. Treat the timeline as two stories shown side by side, not as one causing the other.",
    evidence: [
      "milestones.linked_milestone_id: empty in all 311 rows",
      "milestones.lag_days: empty in all 311 rows",
      "32 of 311 milestones carry a relationship label with no target",
      "The deployments table has no date field of any kind",
    ],
  },
  {
    id: "has-an-attack-happened",
    origin: "author",
    basis: "testimony",
    theme: "experience",
    audience: ["household"],
    topics: ["proposed-solutions", "speculation", "technology", "obedience-coercion", "law-government"],
    title: "Has an attack happened?",
    body:
      "The author reports experiences interpreted as possible unconsented-to auditory or neurological communication, along with perceived coercive messages, including messages related to self-harm. The author does not know the mechanism and raises possible explanations only as hypotheses. This is a dated record of reported experience, not evidence that any particular technology, transmission infrastructure, person, organization, or coordinated campaign is responsible. No conclusion should be drawn without independent technical testing, corroboration, and reliable records.",
    questions: [
      "What independently verifiable evidence would distinguish an external event from other possible explanations?",
      "Are there original recordings, contemporaneous notes, technical measurements, or witnesses that can be evaluated independently?",
      "Is there reliable evidence identifying a specific technology, person, or organization?",
      "Does any verified data collection or processing meet the legal definition of neural data under Colorado law?",
      "What official inquiry, technical assessment, or corroborating record would be needed before drawing a conclusion?",
    ],
    references: [
      { label: "Journal entry — 27 Feb 2025", href: "/journal/is-j01-20250227-entry" },
      { label: "The Guardian — military AI surveillance (context only)", href: "https://www.theguardian.com/world/2025/mar/06/israel-military-ai-surveillance" },
      { label: "Colorado HB24-1058 — neural data", href: "https://leg.colorado.gov/bills/hb24-1058" },
    ],
    referencesNote:
      "The journal is an unverified first-person report. The Guardian article is context about surveillance elsewhere and is not evidence of a connection. Colorado law is relevant only if qualifying data collection or processing is established.",
    aiAssessment: [
      "The report above is the author's. Nothing in the public record settles it either way, so what follows is only what that record contains and where it stops.",
      "No published capability transmits speech or sensation to a person at a distance without their participation. The systems that come closest each require something checkable: contact with the head, equipment the person is wearing, or hours of individual training with a cooperative subject. That is a statement about what has been published — classified work would not appear in it, and absence from the record is not proof of absence.",
      "At the same time, presence and touch with no external source are among the better-documented findings in neuroscience. A robot and a sub-second delay produced the felt presence of another person in roughly a third of thirty healthy participants. Sleep paralysis produces the same physiology worldwide, read as demons, witches or visitors according to where the sleeper grew up. And the best-known claim that electromagnetic fields induce a sensed presence failed to replicate — suggestibility predicted the effect, the fields did not.",
      "Neither of those resolves this. The first removes the necessity of an external agent, not the possibility. The second is an absence of published evidence, not evidence of absence.",
      "What follows practically is narrower and more useful. Every candidate mechanism ever documented leaves a trace something can measure — a recording, a decibel meter, an RF survey, a medical record. An explanation predicting no measurable trace anywhere is not more likely for being unfalsifiable; it is only harder to check. The open questions the author lists above name the right tests, and they remain how this gets resolved.",
    ],
    verification: "unverified",
    disclaimer:
      "This concept records reported experience and open questions. It does not establish an attack, technology, responsible party, organization, or coordinated campaign.",
  },
  {
    id: "us-rose-against-the-trend",
    origin: "ai",
    basis: "documented",
    theme: "health",
    audience: ["clinicians"],
    topics: ["health-effects"],
    title: "The world's suicide rate fell. The United States' rose.",
    body:
      "Between 2000 and 2021, on the one basis that allows countries to be compared at all, the world's suicide rate fell 27%. Most countries fell with it — Russia by 60%, China by 42%, Israel by 36%, Japan by 28%, India by 21%. Over the same years the United States rose 40%, in a steady climb rather than a spike. It is not alone in rising: South Korea rose further, and the UK, Australia and the West Bank & Gaza were effectively flat. But among large wealthy countries the American direction is the outlier, and the gap is not small — 67 percentage points between the US and the world it is usually compared to.",
    evidence: [
      "WHO age-standardised estimates, 2000–2021, world standard population: World −27.0%",
      "United States +39.9% · South Korea +82.8% · UK +12.2% · Australia +1.9%",
      "Russia −59.7% · China −42.2% · Israel −36.0% · Japan −27.7% · India −21.2%",
      "14 series on one comparable basis; national extensions to 2025 held separately",
    ],
    questions: [
      "Why the US direction diverges is not answered here. The claims register records who has attributed it to what, and those attributions contradict each other.",
      "South Korea rose more but peaked around 2011 and has fallen since. A single percentage across 21 years hides the shape of a curve.",
    ],
    references: [{ label: "The suicide comparison chart", href: "/data" }],
    referencesNote:
      "The chart carries the per-country method, caveats and source behind each line.",
  },
  {
    id: "low-number-may-mean-low-counting",
    origin: "ai",
    basis: "documented",
    theme: "record",
    audience: ["clinicians", "press"],
    topics: ["law-government", "health-effects"],
    title: "The numbers under the numbers",
    body:
      "A country reporting few suicides may have few suicides, or may not be counting them. The West Bank & Gaza record 0.65 deaths per 100,000 — which would be the lowest rate on earth by a wide margin, and much more plausibly measures a fragmented registration system in a region where the death is heavily stigmatised. Russia's falling rate runs alongside a rising share of deaths filed as \u201Cundetermined intent\u201D. India's official figures are police reports; verbal-autopsy studies find substantially more. In at least 24 countries suicide or its attempt is a criminal matter, which suppresses both help-seeking and recording. WHO's own position is that most member states lack vital registration good enough for this purpose, and that roughly one suicide in six goes missing worldwide — one in three in lower-income countries. The register that documents this is not a footnote to the chart. It is the finding: a low number is sometimes a fact about a country, and sometimes a fact about its filing.",
    evidence: [
      "15 rows in the data-quality register, each naming a mechanism and a source",
      "Russia: rising 'undetermined intent' share masks suicides",
      "India: police-reported NCRB figures against verbal-autopsy and GBD estimates",
      "UK deliberately INCLUDES undetermined-intent deaths — the opposite convention",
      "≥24 countries criminalise suicide or attempts; ~1 in 6 missing globally",
    ],
    questions: [
      "The register cannot say how much of any single country's trend is real and how much is recording. It documents that both are present.",
    ],
    references: [{ label: "How much the numbers can be trusted", href: "/data" }],
    referencesNote: "The data-quality register lists every mechanism with its source.",
  },
  {
    id: "prescribing-is-not-prevalence",
    origin: "ai",
    basis: "documented",
    theme: "record",
    audience: ["clinicians"],
    topics: ["health-effects"],
    title: "Prescribing is not a measure of illness",
    body:
      "It is tempting to read prescription volume as a thermometer for how ill a population is. The record does not support that, in either direction. In England, antidepressant items rose 50% in nine years while hypnotic and anxiolytic items FELL 16% over exactly the same period, from the same prescribers under the same system. In the United States, antipsychotic use among adults rose from 1.9% to 3.0%, while among children and adolescents it fell, 1.3% to 1.1%. And where a national registry lets diagnosis be counted directly, Denmark's new schizophrenia diagnoses went slightly down, 1.8 to 1.6 per 10,000, across eighteen years in which antipsychotic prescribing rose almost everywhere it was measured. Prescribing moves for its own reasons — guidance, capacity, recognition, duration of treatment, the licensing of new drugs, deliberate deprescribing campaigns. Sometimes it tracks illness. Here it demonstrably moves in opposite directions at once.",
    evidence: [
      "England FY2015/16 → FY2024/25: antidepressants 61.9M → 92.6M items (+50%)",
      "Same period, opposite direction: hypnotics/anxiolytics 15.9M → 13.4M (−16%)",
      "US 2006 → 2023: antipsychotic use, adults 1.9% → 3.0%; youth 1.3% → 1.1%",
      "Denmark 2000 → 2018: new schizophrenia diagnoses 1.8 → 1.6 per 10,000",
    ],
    questions: [
      "Diagnosed depression in US adults did rise over a shorter window — 13.5% to 17.8% currently diagnosed, 2017–2023, self-reported. Whether that is more illness, more recognition, or more willingness to say so is not settled by this data.",
    ],
    references: [{ label: "The prescribing and diagnosis series", href: "/data" }],
    referencesNote:
      "Every figure above is a row in the Public Health indicator table, with its source.",
  },
  {
    id: "the-fentanyl-reversal",
    origin: "ai",
    basis: "documented",
    theme: "health",
    audience: ["clinicians"],
    topics: ["proposed-solutions", "health-effects"],
    title: "The fentanyl reversal",
    body:
      "American overdose deaths went from 16,849 in 1999 to 107,941 in 2022 — more than six times as many in twenty-three years, with the steepest acceleration after illicit fentanyl entered the supply in 2013, and the single largest one-year rise in 2020. Then it turned: down 26.2% in 2024, the largest one-year fall on record, and lower again in 2025. Both directions belong in the record, and the reversal is the more unusual event — this is a curve that had only ever gone one way. But it runs down from a peak that did not exist a generation ago. Provisional 2025 is still roughly four times the 1999 count. A chart that began at the peak would show only the good news; a chart that stopped at the peak would show only the bad.",
    evidence: [
      "CDC/NCHS 1999–2024 final, 2025 provisional: 16,849 → 107,941 (2022 peak) → 69,973",
      "2020: +30.0% on 2019, the largest single-year rise in the series",
      "2024: −26.2%, the largest percentage fall across 2014–2024",
      "CDC attributes the decline to naloxone distribution, treatment access, supply shifts and renewed prevention — recorded as an attribution, not adopted as a finding",
    ],
    questions: [
      "The 2025 figure is provisional and will revise upward. Measured against CDC's provisional 2024 estimate the fall is almost 14%; against the final 2024 count, about 11.9%. Both are published; they compare different vintages of the same year.",
    ],
    references: [{ label: "The overdose series", href: "/data" }],
    referencesNote: "The chart draws the full 1999–2025 record, rise and fall together.",
  },
  {
    id: "co-occurrence-is-not-cause",
    origin: "author",
    basis: "structural",
    theme: "record",
    audience: ["press"],
    topics: [],
    title: "Next to each other is not because of each other",
    body:
      "This site puts a procurement record and a public-health record on one clock. That is a deliberate choice and a dangerous one, because a timeline is very good at implying something it cannot show. Two things happening in the same year is a co-occurrence. It is not evidence that one caused the other, and no amount of caption underneath undoes what a picture asserts. So the two datasets are kept structurally apart. They do not corroborate each other and the site says so wherever they appear together. The overlaps register states, for every row, what that row does NOT show. Vertical markers for contracts and statutes were proposed for the suicide chart and deliberately left off — the only overlay it carries is the COVID-19 timeline, because that is a global health event with a documented literature on mental health, and even that is a toggle. The discipline costs something. It makes the work less immediately persuasive. That is the trade being made on purpose.",
    evidence: [
      "12 rows in the overlaps register, each carrying an explicit non-causal note",
      "Public Health and Government Cloud datasets declared non-corroborating on both pages",
      "Suicide chart carries COVID markers only; procurement and legislation markers declined",
      "Master timeline runs Legislation, Deploy/enforcement, Health and Crime as PARALLEL lanes",
    ],
    questions: [
      "Nothing here argues the datasets are unrelated. It argues that this record cannot establish a relation, and that showing them together is not an argument that one exists.",
    ],
    references: [{ label: "The overlaps register", href: "/data" }],
    referencesNote:
      "Each row states the structural observation and, separately, what it does not establish.",
  },
  {
    id: "ruin-first-then-rescue",
    origin: "author",
    basis: "documented",
    theme: "coercion",
    audience: ["household", "investigators"],
    topics: ["harassment", "speculation", "obedience-coercion", "law-government", "family-network"],
    title: "We're keeping you to ourselves",
    body:
      "A reputation can be destroyed as a means rather than as an end. The tactic appears in several literatures that rarely cite one another. Intelligence tradecraft calls it compromise. East Germany's Stasi called it Zersetzung. Research on domestic abuse calls it isolation. Cult-exit and trafficking studies describe manufactured disgrace used for retention. The mechanism is the same in each. Sever the target's ties to everyone outside the group, and do it publicly, because public damage is self-sustaining — people withdraw on their own once a story circulates, and no further effort is required. The target's own account of what is happening then begins to sound like paranoia, which deepens the isolation again. What remains is a person with no relationships outside the group that ruined them. At that point recruitment needs no persuasion. It needs only to be the last door open. Stated from the inside, the logic is possessive rather than punitive: every tie severed is a tie that cannot compete, and the point of the ruin is not that the target suffers but that nobody else is left. The cruelty is not a side effect of the recruitment. It is the method.",
    evidence: [
      "Stasi Richtlinie 1/76: Zersetzung as directed operational doctrine — psychological disintegration of a target without arrest or trial",
      "Compromise sits alongside money, ideology and ego as one of the four classical recruitment levers in intelligence tradecraft",
      "Coercive-control research treats isolation from a support network as the precondition for dependency, not as a byproduct of it",
      "Trafficking and cult-exit studies record manufactured disgrace as a retention mechanism — the induced belief that no one else would now take you",
      "eBay's campaign against two journalists is a documented civilian instance: seven employees federally charged, a $3m criminal penalty, a $55.7m civil settlement",
    ],
    questions: [
      "Nothing here establishes that such a campaign is running against any particular person, including the author.",
      "A tactic being historically documented does not make any present-day instance evidenced.",
      "Separating an organised campaign from ordinary social withdrawal requires records a target generally cannot obtain. That is a property of the tactic, not proof that it is occurring.",
    ],
    references: [
      { label: "Zersetzung tactics", href: "/glossary/zersetzung-tactics" },
      { label: "Psychological smothering", href: "/glossary/psychological-smothering" },
      { label: "Organised covert harassment is established fact", href: "/concepts#organised-harassment-is-fact" },
    ],
    referencesNote:
      "The glossary entries define terms used on this site and are not independent evidence. The linked concept records decided and settled cases; this concept describes the mechanism those cases share.",
    verification: "unverified",
    disclaimer:
      "This concept describes a documented tactic and the mechanism connecting its recorded forms. It does not establish that the tactic has been used against any particular person, including the author, or by any named organisation.",
  },
  {
    id: "attack-to-force-acknowledgment",
    origin: "author",
    basis: "documented",
    theme: "coercion",
    audience: ["investigators"],
    topics: ["speculation", "obedience-coercion", "violence", "terrorism", "rescue-announcements"],
    title: "An attack to force acknowledgment",
    body:
      "Violence is sometimes not aimed at a target's capacity. It is aimed at a target's response. Schelling separated two uses of force: deterrence stops an adversary from doing something, while compellence makes them do something, and works by inflicting harm that ends only when a demand is met. The harm is not the objective — it is the bargaining position. Terrorism research names a related form directly. Kydd and Walter catalogue provocation among five strategies: attack in order to goad the target into a reaction that serves the attacker, usually an overreaction that costs them legitimacy. A third variant belongs to gray-zone conflict, where an act is conducted deniably while its authorship is signalled privately. The victim is left without a good exit — acknowledge the attack publicly and concede a vulnerability, or absorb it in silence and let it continue. Attribution itself becomes the thing being fought over. What unites all three is that the demanded response IS the operation, not a side effect of it. An adversary who wants to be named is running a different operation from one who wants to stay hidden, and the difference shows in what they ask for.",
    evidence: [
      "Schelling, Arms and Influence (1966) — compellence against deterrence; the diplomacy of violence as bargaining rather than conquest",
      "Kydd & Walter, 'The Strategies of Terrorism', International Security 31:1 (2006) — provocation as one of five catalogued strategies",
      "Gray-zone doctrine: deniable action paired with private signalling of authorship, so attribution becomes the contested ground",
      "Salami tactics — calibrating each act to stay below the threshold that would compel a formal response",
    ],
    questions: [
      "Nothing here identifies any actor, state, campaign, technology or incident.",
      "The concept describes what such an operation would look like. It does not establish that one is occurring, anywhere, against anyone.",
      "A pattern fitting a strategic form is not evidence that the form is being executed. The same shape can be produced by unrelated events read together — which is the failure mode this concept is most likely to invite.",
    ],
    references: [
      { label: "Next to each other is not because of each other", href: "/concepts#co-occurrence-is-not-cause" },
      { label: "We're keeping you to ourselves", href: "/concepts#ruin-first-then-rescue" },
    ],
    referencesNote:
      "Both linked concepts are method, not corroboration. The first states why a pattern read across sources cannot establish a relation; the second describes a different documented tactic that shares the logic of harm used as leverage.",
    verification: "unverified",
    disclaimer:
      "This concept describes doctrine recorded in the strategic and academic literature. It does not establish that any such operation has been conducted against the United States, against any other state, or against any individual, and it identifies no actor, technology or campaign.",
  },
  {
    id: "denver-acoustic-weapons",
    origin: "author",
    basis: "documented",
    theme: "coercion",
    audience: ["household", "investigators"],
    topics: ["proposed-solutions", "technology", "violence", "law-government", "health-effects"],
    title: "Are Denver citizens subject to acoustic weapons?",
    body:
      "Acoustic weapons are real, commercially sold, and owned by American police departments. Genasys, formerly LRAD Corporation, markets long-range acoustic devices to law enforcement, and what they do to people has been litigated. In Edrei v. Bratton the Second Circuit held that using one against non-violent, non-resisting protesters can violate the Fourteenth Amendment. The device in that case, a Model 100X, produces up to 136 decibels at one metre; the NYPD's own testing recorded 110 decibels at 320 feet in area-denial mode, and hearing loss can follow short exposure at 110 to 120 decibels. Plaintiffs reported tinnitus, vertigo, migraines, and in one case nerve damage requiring steroid treatment. The court's reasoning was that novel technology does not escape proportionality review. So the general question is settled: the devices exist, police own them, and a federal appeals court has held their use can be excessive force. The Denver question is answered differently by the public record. The largest adjudicated case of Denver police force against citizens is Epps v. City and County of Denver, where a federal jury awarded $14 million in March 2022, upheld by the Tenth Circuit in April 2026 at $14.75 million. The force documented there was shotgun rounds, flash-bang grenades and chemical agents. Acoustic devices are not part of that record. One property matters for anyone trying to answer this for themselves. An acoustic weapon projects ordinary sound through air in a directional beam: everyone in the beam hears it, a phone left recording captures it, and a decibel meter registers it. It is not a covert instrument, which means its use is testable by anyone who suspects it.",
    evidence: [
      "Edrei v. Bratton, No. 17-2065 (2d Cir. 2018) — LRAD use on non-violent protesters can violate the Fourteenth Amendment; qualified immunity denied at the pleading stage",
      "LRAD Model 100X: up to 136 dB at one metre; NYPD testing recorded 110 dB at 320 feet in area-denial mode",
      "Hearing loss can follow short exposure at 110–120 dB; Edrei plaintiffs reported tinnitus, vertigo, migraines and nerve damage",
      "Epps v. City and County of Denver — $14m jury verdict, March 2022; Tenth Circuit affirmed April 2026 at $14.75m",
      "Force documented in Epps: shotgun rounds, flash-bang grenades, chemical agents. No acoustic device appears in that record",
      "Genasys (formerly LRAD Corporation) markets acoustic hailing devices to law enforcement",
    ],
    questions: [
      "Nothing in this research establishes that Denver Police own or have deployed an acoustic weapon. That is an absence of finding, not proof of absence — a Colorado Open Records Act request would settle it outright.",
      "No acoustic device accounts for a sound only one person perceives. A directional beam of air pressure is audible to bystanders and recordable by any phone.",
    ],
    references: [
      { label: "Edrei v. Bratton (2d Cir. 2018)", href: "https://law.justia.com/cases/federal/appellate-courts/ca2/17-2065/17-2065-2018-06-13.html" },
      { label: "Epps v. City and County of Denver — ACLU of Colorado", href: "https://www.aclu-co.org/cases/epps-et-al-v-city-and-county-denver-et-al/" },
      { label: "Genasys — LRAD for law enforcement", href: "https://www.genasys.com/lrad-solutions/law-enforcement" },
    ],
    referencesNote:
      "Edrei and Epps are decided cases and are cited for what each court found. The vendor link is the manufacturer's own marketing, included to show the devices are sold to police, and is not independent evidence of any deployment.",
    verification: "unverified",
    disclaimer:
      "This concept reports decided litigation and published device specifications. It does not establish that any acoustic weapon has been deployed in Denver, nor against any individual.",
  },
  {
    id: "made-into-assets-unknowing",
    origin: "author",
    basis: "documented",
    theme: "surveillance",
    audience: ["household", "investigators"],
    topics: ["technology", "surveillance", "law-government"],
    title: "Are people made into intelligence assets without knowing it?",
    body:
      "Intelligence tradecraft has always separated a witting source from an unwitting one. A person can supply information without knowing who receives it, or that anyone does. What changed is scale, and it required nobody's cooperation. American law enforcement agencies buy location data that phones emit continuously. The Electronic Frontier Foundation's investigation into Fog Data Science documented a company selling local police searchable access to billions of location signals harvested from ordinary apps, at prices small departments could afford. Babel Street's Locate X offered comparable capability, and EPIC obtained records of Customs and Border Protection's use of it. The mechanism is commercial: brokers buy from the advertising ecosystem and agencies buy from brokers. No warrant is involved because no compulsion is involved. The result is a population of unwitting sources. A person carrying a phone generates a record of where they went, who they were near and for how long, and that record is purchasable. They were never approached, never recruited, and are never harassed — because harassment would defeat the purpose. The value of an unwitting asset lies precisely in their not knowing. What this does not describe is access to perception. No documented capability reads a person's eyesight, and the mechanism above does not require one. What people already emit is sufficient.",
    evidence: [
      "EFF investigation into Fog Data Science (2022): searchable location data sold to local police, drawn from billions of signals emitted by ordinary apps",
      "EPIC obtained FOIA records covering Customs and Border Protection's use of Babel Street's Locate X",
      "The purchase route avoids the warrant requirement because it involves no compulsion — the data is bought, not seized",
      "Witting versus unwitting source is a standing distinction in intelligence tradecraft, not a novel category",
    ],
    questions: [
      "The record establishes commercial purchase of bulk location data. It does not establish any programme of deliberate individual targeting.",
      "No documented capability accesses a person's visual perception, and none is needed for the collection described here.",
      "Whether any particular person's data has been purchased by any particular agency is not answerable from public records.",
    ],
    references: [
      { label: "Inside Fog Data Science — EFF", href: "https://www.eff.org/deeplinks/2022/08/inside-fog-data-science-secretive-company-selling-mass-surveillance-local-police" },
      { label: "CBP and Babel Street Locate X — EPIC FOIA", href: "https://epic.org/documents/epic-foia-cbp-babel-street-location-tracking-service/" },
      { label: "There is no column for you", href: "/concepts#no-column-for-you" },
    ],
    referencesNote:
      "EFF and EPIC are cited for their own documented investigations. The linked concept is method — it records that the person a system is used on appears almost nowhere in the procurement record.",
    verification: "unverified",
    disclaimer:
      "This concept reports documented commercial data sales to law enforcement. It establishes no programme of individual targeting, no access to perception, and no conduct by any named agency beyond what the cited investigations found.",
  },
  {
    id: "no-private-thinking-space",
    origin: "author",
    basis: "documented",
    theme: "surveillance",
    audience: ["press"],
    topics: ["technology", "surveillance", "law-government"],
    title: "Does being watched change what people let themselves think?",
    body:
      "Amnesty International's 2023 report Automated Apartheid documented facial-recognition systems, Red Wolf and Blue Wolf among them, used to control Palestinian movement in the occupied territories, with residents describing repeated identification at checkpoints as a condition of ordinary life. Palestinians interviewed described the effect in consistent and non-technical terms: there was no space left in which to think privately. That effect is measurable, and it has been measured in the United States. Jonathon Penney, writing in the Berkeley Technology Law Journal in 2016, examined Wikipedia traffic to privacy-sensitive articles before and after June 2013, when the NSA and PRISM disclosures became public. He found a statistically significant immediate decline, with evidence that it persisted. People stopped looking things up. Nobody instructed them to. The migration of such tools is documented too. Julian Go, in the American Journal of Sociology, traces how instruments and doctrines developed for imperial control returned to domestic American policing; cell-site simulators reached local departments from military origins by the same route. The pattern is old enough to carry a name in the literature. So the question worth asking is not whether America has some particular system. It is narrower and answerable: given that capabilities move from conflict territory to domestic policing, and that surveillance measurably changes what people do, what has already arrived here, and what has it already changed?",
    evidence: [
      "Amnesty International, Automated Apartheid (2023): Red Wolf and Blue Wolf facial recognition used to control Palestinian movement in the OPT",
      "Penney, 'Chilling Effects: Online Surveillance and Wikipedia Use', Berkeley Technology Law Journal 31:1 (2016) — statistically significant immediate decline in privacy-sensitive article traffic after June 2013, with persistence",
      "Go, 'The Imperial Origins of American Policing', American Journal of Sociology 125:5 — instruments of imperial control returning to domestic policing",
      "Cell-site simulators reached local US police departments from military origins",
    ],
    questions: [
      "Naming a documented migration does not establish that any specific system has migrated. It establishes that the route exists and has been used before.",
      "Penney measured behaviour, not thought. What a person looks up is observable; what they think is not, and no study here claims otherwise.",
      "Nothing in this record establishes any capability to observe conversation directly, in any territory.",
    ],
    references: [
      { label: "Automated Apartheid — Amnesty International", href: "https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/" },
      { label: "Chilling Effects: Online Surveillance and Wikipedia Use — Penney (2016)", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2769645" },
      { label: "The Imperial Origins of American Policing — American Journal of Sociology", href: "https://www.journals.uchicago.edu/doi/10.1086/708464" },
    ],
    referencesNote:
      "Each source is cited for its own finding. Amnesty documents one territory, Penney measures one population's behaviour, and Go describes a historical route. None of the three corroborates either of the others, and together they do not establish a present-day American system.",
    verification: "unverified",
    disclaimer:
      "This concept reports published research and human-rights documentation. It does not establish that any system documented in one territory operates in another, nor that any capability exists to observe thought or conversation directly.",
  },
  {
    id: "who-owns-neural-data",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["household", "policy"],
    topics: ["technology", "surveillance"],
    title: "Who owns what your brain emits?",
    body:
      "Consumer neurotechnology already exists and is already sold: EEG headbands for meditation, focus trackers, sleep monitors, gaming headsets. In April 2024 the Neurorights Foundation published an assessment of the privacy practices of thirty such companies. Twenty-nine of the thirty appeared to have access to the consumer's neural data with no meaningful limitation on that access. Twenty-nine could transfer data to third parties, and twenty said so explicitly. Fewer than half — fourteen of thirty — gave the consumer any stated right to delete it. Only twelve offered both withdrawal of consent and deletion. Eight had no publicly available privacy policy at all. Nothing here was hidden. These are the companies' own published terms, read carefully by people who then counted. The question of who owns what a brain emits is not waiting on some future technology to become urgent. It was answered commercially, in advance, in documents nobody reads.",
    evidence: [
      "Genser, Damianos & Yuste, 'Safeguarding Brain Data: Assessing the Privacy Practices of Consumer Neurotechnology Companies', Neurorights Foundation, April 2024",
      "30 companies assessed; 29 appear to have access to neural data with no meaningful limitation",
      "29 of 30 can transfer data to third parties; 20 state so explicitly",
      "14 of 30 extend an explicit right to delete; 12 offer both withdrawal of consent and deletion",
      "8 of 30 publish no accessible privacy policy",
    ],
    questions: [
      "The report assesses published policies, not actual conduct. What a company reserves the right to do is not proof it has done it.",
      "It does not establish that any neural data has been sold, to whom, or for what.",
      "Consumer EEG measures electrical activity at the scalp. What can be inferred from that signal is a separate question this concept does not answer.",
    ],
    references: [
      { label: "Safeguarding Brain Data — Neurorights Foundation (2024)", href: "https://perseus-strategies.com/wp-content/uploads/2024/04/FINAL_Consumer_Neurotechnology_Report_Neurorights_Foundation_April-1.pdf" },
      { label: "Why did legislatures write laws for neural data?", href: "/concepts#law-for-neural-data" },
      { label: "Are people made into intelligence assets without knowing it?", href: "/concepts#made-into-assets-unknowing" },
    ],
    referencesNote:
      "The report is cited for its own count of published policies. The linked concepts describe adjacent markets and neither corroborates this one.",
    verification: "unverified",
    disclaimer:
      "This concept reports a published assessment of companies' own privacy policies. It does not establish that any company has misused neural data, nor that any transfer has occurred.",
  },
  {
    id: "law-for-neural-data",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["policy"],
    topics: ["proposed-solutions", "technology", "law-government"],
    title: "Why did legislatures write laws for neural data?",
    body:
      "Legislatures rarely move early. On neural data, three of them did. Colorado passed HB24-1058 in 2024, amending its consumer privacy act to require express consent before neural data is collected or used, separate consent or an opt-out before it goes to a third party, and a route for a person to have it deleted. California did the same through SB 1223, folding neural data into the categories its privacy act treats as sensitive. Montana went further from a different direction, adding neural data to its genetic information privacy act, effective October 2025. What is notable is not the content but the margins: these passed unanimously or nearly so, in a period when almost nothing does. A category of information most people have never heard of was given statutory protection by bipartisan votes in three states. Either those legislatures were persuaded that a capability exists worth regulating, or they were persuaded one is close enough that waiting was the greater risk. The record shows the votes. It does not show which of those two it was.",
    evidence: [
      "Colorado HB24-1058 (2024): express consent to collect or use neural data; separate consent or opt-out for third-party disclosure; deletion route",
      "California SB 1223: neural data added to the sensitive categories of the state consumer privacy act",
      "Montana LC0005, effective October 2025: neural data added to the state genetic information privacy act",
      "All three passed unanimously or near-unanimously",
    ],
    questions: [
      "A law existing does not establish that the harm it anticipates has occurred. Legislatures also regulate in advance.",
      "None of the three statutes names a specific incident as its cause, so the record cannot say what persuaded the votes.",
      "This concept does not address whether the definitions these laws use are technically adequate, which is itself contested.",
    ],
    references: [
      { label: "Colorado HB24-1058 — bill text", href: "https://content.leg.colorado.gov/sites/default/files/documents/2024A/bills/2024a_1058_01.pdf" },
      { label: "States pass privacy laws to protect brain data — KFF Health News", href: "https://kffhealthnews.org/mental-health/colorado-california-montana-states-neural-data-privacy-laws-neurorights/" },
      { label: "Who owns what your brain emits?", href: "/concepts#who-owns-neural-data" },
      { label: "We cannot prove which came first, the law or the system", href: "/concepts#sequence-cannot-be-proven" },
    ],
    referencesNote:
      "The last link is method, and it applies directly here: this record cannot establish whether law followed capability or anticipated it.",
    verification: "unverified",
    disclaimer:
      "This concept reports enacted legislation. It does not establish that any neural data harm has occurred in any of the three states, nor what motivated any legislator's vote.",
  },
  {
    id: "can-a-machine-read-thought",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["clinicians"],
    topics: ["technology", "surveillance"],
    title: "Can a machine read what you are thinking?",
    body:
      "Partly, under conditions that are worth stating precisely. In May 2023 Jerry Tang and Alexander Huth published a semantic decoder in Nature Neuroscience that reconstructed continuous language from non-invasive brain recordings. A person lay in an fMRI scanner; a transformer model turned the blood-flow signal into text that captured the gist of what they were hearing or imagining, matching the intended meaning roughly half the time. It is a real result and it was replicated in the paper across participants. The conditions are as important as the finding. The decoder required about fifteen hours of scanner time per person to train, and it worked only for the individual it was trained on — run against an untrained person, it produced unintelligible output. It worked only with willing participants. And when a trained subject deliberately resisted, by counting, naming animals or telling themselves a different story, the decoder failed entirely. The researchers tested that on purpose and reported it. So the honest answer is that meaning can be partially reconstructed from a cooperative, individually-trained person lying still inside a superconducting magnet the size of a small room. That is a genuine advance in decoding, and it is a long way from reading a mind that does not wish to be read.",
    evidence: [
      "Tang & Huth et al., 'Semantic reconstruction of continuous language from non-invasive brain recordings', Nature Neuroscience, 1 May 2023 (DOI 10.1038/s41593-023-01304-9)",
      "~15 hours of fMRI training per individual; decoder is subject-specific",
      "Applied to an untrained individual it produced unintelligible output",
      "Trained subjects who deliberately resisted defeated it completely — the authors tested resistance and published the failure",
      "Reconstruction captures gist, matching intended meaning about half the time, not word for word",
    ],
    questions: [
      "The result is bounded by fMRI. It says nothing about what any other modality can or cannot do.",
      "That a cooperative, trained subject can be partially decoded does not establish that an unwilling, untrained person can be decoded by anything.",
      "The resistance finding is a property of this decoder tested in this way. It is not a general guarantee about future systems.",
    ],
    references: [
      { label: "Semantic reconstruction of continuous language — Nature Neuroscience (2023)", href: "https://www.nature.com/articles/s41593-023-01304-9" },
      { label: "What would it actually take to do this without consent?", href: "/concepts#what-it-would-take" },
      { label: "Why did legislatures write laws for neural data?", href: "/concepts#law-for-neural-data" },
    ],
    referencesNote:
      "The paper is cited for its own published result, including the limits its authors reported.",
    verification: "unverified",
    disclaimer:
      "This concept reports one peer-reviewed study and the constraints its authors documented. It establishes no capability beyond what that study demonstrated.",
  },
  {
    id: "nonsurgical-by-design",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["policy"],
    topics: ["technology", "law-government"],
    title: "Did anyone try to build a way in without surgery?",
    body:
      "Yes, openly, and the programme documents say so. DARPA's Next-Generation Nonsurgical Neurotechnology programme — N3 — set out, in its own words, to develop high-performance bi-directional brain-machine interfaces for able-bodied service members. Bi-directional means read and write. Able-bodied means the purpose was not restoring lost function; the stated applications were controlling unmanned vehicles and cyber-defence systems. Six teams were funded in 2019. The published performance targets were specific: sixteen independent channels, within sixteen cubic millimetres of neural tissue, at fifty milliseconds of latency, using light, acoustic or electromagnetic energy rather than implanted electrodes. The programme is now listed as complete and retained for reference. What this establishes is intent and investment, publicly recorded. It does not establish that the targets were met, and the targets themselves describe a person wearing equipment, not a person at a distance.",
    evidence: [
      "DARPA N3 stated aim: 'high-performance, bi-directional brain-machine interfaces for able-bodied service members'",
      "Named applications: unmanned vehicle control and cyber defence — not clinical restoration",
      "Published targets: 16 independent channels, 16mm³ of tissue, 50ms latency",
      "Modalities pursued: light, acoustic and electromagnetic energy, rather than implanted electrodes",
      "Six teams funded from 2019; programme now listed as complete",
    ],
    questions: [
      "A funded programme with published targets is evidence of intent, not of achievement. DARPA funds many things that do not work.",
      "The targets describe a wearable interface on a consenting operator. Nothing in the programme description concerns action at a distance or without consent.",
      "Whether any target was met is not established by the programme page, and the results are not reported there.",
    ],
    references: [
      { label: "N3: Next-Generation Nonsurgical Neurotechnology — DARPA", href: "https://www.darpa.mil/research/programs/next-generation-nonsurgical-neurotechnology" },
      { label: "What would it actually take to do this without consent?", href: "/concepts#what-it-would-take" },
      { label: "Can a machine read what you are thinking?", href: "/concepts#can-a-machine-read-thought" },
    ],
    referencesNote:
      "DARPA is cited for its own published programme description. That a goal was funded is not evidence the goal was reached.",
    verification: "unverified",
    disclaimer:
      "This concept reports a publicly documented research programme and its stated objectives. It does not establish that any capability was achieved, deployed, or used on any person.",
  },
  {
    id: "what-it-would-take",
    origin: "ai",
    basis: "structural",
    theme: "record",
    audience: ["household", "press"],
    topics: ["technology"],
    title: "What would it actually take to do this without consent?",
    body:
      "The three concepts alongside this one describe what the public record contains: consumer devices whose makers reserve broad rights over neural data, three states legislating that data as sensitive, a decoder that partially reconstructs meaning, and a defence programme that funded a nonsurgical interface with published targets. Setting them side by side makes the boundary visible, and the boundary is the useful part. Every documented capability requires at least one of three things: physical contact with the head, a cooperative and individually trained subject, or equipment the person is inside or wearing. The decoder needed fifteen hours per person and failed against an untrained subject, and failed again when a trained one resisted. The DARPA targets describe sixteen channels within sixteen cubic millimetres — a wearable interface on an operator who put it on. Consumer EEG reads voltage at the scalp through electrodes touching it. Not one documented system operates at distance on a person who has not participated. That is not an argument that nothing could ever be built. It is a statement of where the published record currently stops, offered because a person who suspects something is happening to them deserves to know what the actual state of the art requires — and because a claim that outruns it should be recognisable as doing so.",
    evidence: [
      "Semantic decoder: ~15 hours training per subject, subject-specific, defeated by deliberate resistance",
      "DARPA N3 targets: 16 channels in 16mm³ at 50ms — a wearable interface on a consenting operator",
      "Consumer EEG: electrodes in contact with the scalp, measuring voltage at the surface",
      "No system in the documented record operates at a distance on a non-participating person",
    ],
    questions: [
      "Absence from the public record is not proof of absence. Classified capability would not appear here, and this concept cannot speak to it.",
      "The boundary described is where publication currently stops, not a claim about physics or the future.",
      "Nothing here rules out harm by the documented means — commercial data, contact devices, or a cooperative subject who did not understand what they consented to.",
    ],
    references: [
      { label: "Can a machine read what you are thinking?", href: "/concepts#can-a-machine-read-thought" },
      { label: "Did anyone try to build a way in without surgery?", href: "/concepts#nonsurgical-by-design" },
      { label: "Who owns what your brain emits?", href: "/concepts#who-owns-neural-data" },
      { label: "Next to each other is not because of each other", href: "/concepts#co-occurrence-is-not-cause" },
    ],
    referencesNote:
      "The first three are the sourced entries this one reads across. The fourth is method: setting findings side by side does not establish a relation between them, and this concept draws a boundary rather than a connection.",
    verification: "unverified",
    disclaimer:
      "This concept describes the limits of publicly documented capability. It makes no claim about classified work, about future capability, or about the cause of any individual's experience.",
  },
  {
    id: "explanation-is-part-of-the-harm",
    origin: "author",
    basis: "documented",
    theme: "coercion",
    audience: ["household", "clinicians"],
    topics: ["proposed-solutions", "speculation", "obedience-coercion", "law-government"],
    title: "Does the explanation itself do harm?",
    body:
      "An unexplained experience arrives without a label. Whatever attaches to it next does real work: it decides what the person does, who they trust, and whether they seek help. Claiming supernatural or superhuman authority in order to secure compliance is among the oldest documented methods of control. Spiritualist mediums worked bereaved families with cold reading and staged effects, and the Fox sisters, who began the movement, confessed the fraud in 1888. Faith healers have been prosecuted for it. Research on coercive groups records claimed transcendent authority as a standard instrument for overriding a member's own judgment, because an authority that cannot be checked cannot be argued with. The public-safety consequence is separate from whether any given experience has an external cause. A person who attributes what is happening to them to spirits, to extraterrestrials, or to any agency beyond reach will not pursue the remedies that exist for causes within reach: a physician, a lawyer, a police report, a decibel meter, a technical measurement. The explanation forecloses the response, and it does so whether it was handed to the person or arrived at alone. The same logic applies to any framing that places a cause beyond investigation, including the framings on this site. A concept that names this risk and exempts itself from it has not understood it.",
    evidence: [
      "Spiritualist fraud as a documented industry — the Fox sisters' 1888 confession, and a century of mediums exposed by investigators",
      "Faith-healing fraud prosecutions in US courts",
      "Coercive-group research records claimed transcendent authority as an instrument for overriding member judgment",
      "Health-services literature: causal attribution predicts help-seeking, and attributing a cause to an agency beyond reach correlates with delayed or absent care",
    ],
    questions: [
      "This does not establish the cause of any particular person's experience.",
      "It does not claim that anyone has presented themselves falsely to anyone.",
      "It cannot distinguish a false explanation supplied by another party from one a person reached alone. Both foreclose the same responses.",
    ],
    references: [
      { label: "If nobody's house is haunted, what produces the feeling?", href: "/concepts#what-produces-the-feeling" },
      { label: "False disclosure", href: "/glossary/false-disclosure" },
      { label: "Are Denver citizens subject to acoustic weapons?", href: "/concepts#denver-acoustic-weapons" },
    ],
    referencesNote:
      "The glossary entry records Greer's hypothesis as his hypothesis and is not independent evidence. The Denver concept is linked because it names a measurable test, which is the practical opposite of an explanation that forecloses one.",
    verification: "unverified",
    disclaimer:
      "This concept describes a documented method of control and a documented effect on help-seeking. It establishes no mechanism, no actor, and makes no claim about the origin of any individual's experience.",
  },
  {
    id: "what-produces-the-feeling",
    origin: "author",
    basis: "documented",
    theme: "experience",
    audience: ["household", "clinicians"],
    topics: ["harassment", "speculation", "technology", "euthanization", "obedience-coercion", "health-effects"],
    // MERGED 10 September. The home page carried "Your house is not haunted" as
    // a section lead and this concept's question as the first slide title —
    // two headings saying one thing, which is what Sean asked to collapse. The
    // statement is the better title: it is the sentence a frightened person
    // needs first, and the question is answered in the body anyway.
    title: "Your house is not haunted",
    body:
      // FIVE SENTENCES CARRY THE WHOLE THING, because the home page shows the
      // first five and Sean wanted one body rather than a lead plus a slide.
      // They run: the statement, the published experiment that validates it,
      // that nobody was there, what this record claims is done deliberately,
      // and what the terror is FOR. The documented half and the claimed half
      // are separated by four words — "what this record describes" — and that
      // separation is the only reason the last two sentences are publishable.
      "Your house is not haunted, and that is a finding rather than a reassurance. In 2014 Olaf Blanke's group manufactured the feeling of a presence in healthy people: a blindfolded participant moved a lever, a robot reproduced the movement against their back, and a half-second delay was enough that one in three felt someone standing behind them — two asked for the experiment to stop. Nobody was ever in the room with them. What this record describes is that effect imposed rather than induced: phantom sensations across every sense, and visuals reproducing what a haunting is supposed to look like. The terror is the mechanism — a household driven outside will accept help from whoever is waiting, and what this record says waits there is a facilitator of Zersetzung tactics and a suggestion of euthanasia.\n\nThe published work stands on its own. Blanke's experiment ran on thirty healthy participants; roughly a third spontaneously reported someone behind them, some reported several, and a pooled analysis across twenty-five such experiments has since been published. When the reproduction was simultaneous, participants felt themselves touching their own back; when it was delayed, the brain could no longer attribute the touch to the person's own movement and resolved the conflict by generating somebody else. Of thirty healthy participants, roughly a third spontaneously reported feeling someone behind them, touching them. Some reported several people. Two found it distressing enough to ask that the experiment stop. A pooled analysis across twenty-five such experiments has since been published. The direction of that finding is the point. The presence was not detected. It was manufactured by the participant's own nervous system out of a half-second timing error, with nobody there. Other findings converge. Sleep paralysis produces felt presence, chest pressure and an inability to move, and the cross-cultural literature records the same physiology interpreted as demons, witches, spirits or visitors depending on where the sleeper grew up. And when researchers tested the best-known claim that electromagnetic fields induce a sensed presence, it failed to replicate: Granqvist and colleagues reported in 2005 that the experiences tracked suggestibility rather than the fields. None of this establishes the cause of any particular person's experience. What it establishes is that vivid, specific, frightening presence and touch require no external source at all — and that anyone trying to work out what is happening to them deserves to know the brain does this unaided before concluding that something is being done to them.",
    evidence: [
      "Blanke et al., Current Biology, 6 November 2014: robotically induced presence hallucination in 30 healthy participants; ~1 in 3 spontaneously reported someone behind them touching them; some reported several; two asked to stop",
      "The effect depends on a sub-second delay between the participant's own movement and the touch — a sensorimotor timing conflict, not a stimulus",
      "A pooled analysis across 25 presence-hallucination induction experiments has since been published",
      "Sleep paralysis: felt presence, chest pressure and atonia, interpreted cross-culturally as demons, witches, spirits or visitors",
      "Granqvist et al., 2005: sensed presence and mystical experience predicted by suggestibility, not by transcranial weak complex magnetic fields — a failed replication of the best-known EM claim",
    ],
    questions: [
      "This does not establish the cause of any particular experience, including the author's.",
      "A mechanism that requires no external agent does not prove that no external agent exists in a given case. It removes the necessity, not the possibility.",
      "The Granqvist result concerns weak transcranial fields under laboratory conditions. It does not speak to every claim about electromagnetic exposure.",
    ],
    references: [
      { label: "Phantom sensations", href: "/glossary/phantom-sensations" },
      { label: "Does the explanation itself do harm?", href: "/concepts#explanation-is-part-of-the-harm" },
      { label: "What would it actually take to do this without consent?", href: "/concepts#what-it-would-take" },
      { label: "Ghost illusion created in the lab — Blanke lab (EPFL)", href: "https://www.eurekalert.org/news-releases/889913" },
    ],
    referencesNote:
      "The glossary entry defines a term used on this site and is not independent evidence. The two linked concepts are the companion arguments: one on what an explanation costs, one on where documented capability stops.",
    verification: "unverified",
    disclaimer:
      "This concept reports published neuroscience. It does not establish the cause of any individual's experience, and it does not assert that any reported experience was internally generated.",
  },
  {
    id: "contractors-killed-and-freed",
    origin: "ai",
    basis: "documented",
    theme: "procurement",
    audience: ["investigators", "policy", "press"],
    topics: ["violence", "law-government"],
    title: "Have private contractors killed civilians and gone free?",
    body:
      "Yes, and the case is documented from beginning to end, including the end. On 16 September 2007, Blackwater contractors guarding a State Department convoy opened fire in Nisour Square, Baghdad, killing fourteen unarmed Iraqi civilians and wounding others. The United States prosecuted. After years of litigation, four contractors were convicted in federal court — one of first-degree murder, three of voluntary manslaughter and firearms offences. In December 2020 all four were pardoned by presidential act, and the convictions ceased to have effect. United Nations human-rights experts called the pardons an affront to justice and said they violated obligations under international humanitarian law. What makes this worth recording is not that private force killed civilians, which is documented in many places, but the shape of the whole sequence: the killings happened, the justice system worked, and the outcome was undone by an authority the justice system does not reach. Accountability that can be reversed at will is a different thing from accountability, and a reader weighing whether private organisations face consequences has one fully documented answer to work from.",
    evidence: [
      "Nisour Square, Baghdad, 16 September 2007: fourteen unarmed Iraqi civilians killed by Blackwater contractors guarding a State Department convoy",
      "Four contractors convicted in US federal court — one of first-degree murder, three of voluntary manslaughter and firearms offences",
      "All four pardoned by presidential act in December 2020",
      "UN human-rights experts publicly described the pardons as an affront to justice and a violation of obligations under international humanitarian law",
    ],
    questions: [
      "One documented case does not establish a pattern, and this concept does not claim one.",
      "It concerns conduct abroad under a contract with the US government. It says nothing about conduct by private organisations inside the United States.",
      "A pardon extinguishes a conviction. It does not establish that the underlying findings of fact were wrong, and this concept takes no position on that.",
    ],
    references: [
      { label: "Shock and dismay after the Blackwater pardons — NPR", href: "https://www.npr.org/2020/12/23/949679837/shock-and-dismay-after-trump-pardons-blackwater-guards-who-killed-14-iraqi-civil" },
      { label: "UN experts: the pardons are an affront to justice", href: "https://news.un.org/en/story/2020/12/1081152" },
      { label: "Accountability isn't wired to deployment, even in the schema", href: "/concepts#accountability-not-wired" },
    ],
    referencesNote:
      "The news sources are cited for the documented sequence of conviction and pardon. The linked concept is method — it records a structural version of the same gap.",
    verification: "unverified",
    disclaimer:
      "This concept reports a prosecuted and pardoned case. It makes no claim about any other conduct by any private organisation, and none about conduct inside the United States.",
  },
  {
    id: "who-profits-from-a-body",
    origin: "ai",
    basis: "documented",
    theme: "surveillance",
    audience: ["policy", "press"],
    topics: ["law-government"],
    title: "Who profits from a body?",
    body:
      "In January 2018 Reuters published an investigation by Brian Grow and John Shiffman into the American body trade. Body brokers — legally, non-transplant tissue banks — acquire bodies donated to science, usually for free, then cut them into parts and sell them. The reporters did not merely describe the market. They entered it: Reuters bought a human cervical spine for three hundred dollars. It had belonged to Cody Saunders, a twenty-four-year-old from Tennessee, whose parents had not known what became of him. Across the investigation, family after family had no idea what happened to the person they donated. The legal position is the part most people find hardest to believe. Federal law prohibits selling body parts for transplant into a living person. Most states say nothing at all about selling body parts for research or education. So the trade is not a black market being policed and failing; it is a lawful market that was never regulated, in which a journalist can buy a spine over the counter and the donating family is told nothing. Whatever a person imagines happens to a body, this is what the record actually documents happening.",
    evidence: [
      "Grow & Shiffman, 'The Body Trade', Reuters, January 2018",
      "Body brokers acquire donated bodies, usually at no cost, then sell the parts",
      "Reuters purchased a human cervical spine for $300 in the course of reporting",
      "The spine belonged to Cody Saunders, 24, of Tennessee; his parents did not know what had become of his body",
      "Federal law bars sale of parts for transplant into a living person; most states are silent on sale for research or education",
    ],
    questions: [
      "The investigation documents a lawful and largely unregulated market. It establishes no criminal conduct beyond the cases it names.",
      "It concerns bodies donated to science. It says nothing about how any person died, and nothing about any death being caused for this purpose.",
      "State law has moved in places since 2018. This concept does not track the current statute in any given state.",
    ],
    references: [
      { label: "The Body Trade — Reuters (2018)", href: "https://ethics.sjmc.wisc.edu/wp-content/uploads/sites/2130/2024/08/reuters_bodytrade.pdf" },
      { label: "Have private contractors killed civilians and gone free?", href: "/concepts#contractors-killed-and-freed" },
      { label: "There is no column for you", href: "/concepts#no-column-for-you" },
    ],
    referencesNote:
      "Reuters is cited for its own investigation. The linked concepts are adjacent arguments about accountability and about the person who appears nowhere in a record; neither corroborates this one.",
    verification: "unverified",
    disclaimer:
      "This concept reports a published investigation into a lawful market. It makes no claim that any death was caused, hastened, or procured for the purpose of supplying it.",
  },
  {
    id: "what-children-are-subject-to",
    origin: "ai",
    basis: "documented",
    theme: "surveillance",
    audience: ["household", "investigators", "policy"],
    topics: ["proposed-solutions", "harassment", "surveillance", "law-government"],
    title: "What are children subject to?",
    body:
      "In November 2020 the Tampa Bay Times published Targeted, an investigation into the Pasco County Sheriff's Office in Florida. The office had built a list of roughly 420 schoolchildren it considered likely future criminals. The children were not told. Their parents were not told. The school superintendent said he had not known the data was being used this way. The list was assembled from sixteen categories drawn from school records and state child-welfare data, and the categories are the part worth reading twice. A child could be flagged for grades of D or below, for three or more absences in a quarter, for discipline referrals — and for adverse childhood experiences, meaning abuse, witnessing violence, or having a parent incarcerated. A child who had been abused was thereby made more likely to appear on a police list of probable future offenders. The district's early-warning system covered more than thirty thousand middle and high school students, and the district paid the Sheriff's Office $2.3 million a year for thirty-two school resource officers. What happened next is the part worth recording, because it is the rarest outcome in this entire archive: someone was held to account. Four Pasco residents — Darlene Deegan, Dalanea Taylor, Tammy Heilman and Robert A. Jones III — sued in federal court in 2021, represented by the Institute for Justice. The pattern they described was not dramatic. Deputies arrived repeatedly, at all hours, and wrote citations for overgrown grass, missing house numbers, unvaccinated pets and window tint. The Sheriff's Office discontinued the programme in 2023. On 4 December 2024, with trial about to begin, it settled — and the settlement was not a denial. The Sheriff's Office admitted the programme violated the Fourth Amendment, because the checks exceeded the implied licence any visitor has to knock on a door; the First Amendment, because they directly and substantially interfered with the right of intimate association; and Fourteenth Amendment due process, because they interfered with the plaintiffs' liberty interests. It paid $105,000 in damages and is barred from running a comparable programme again. Whatever else is or is not happening to children, this happened, was documented in detail, required no capability anyone would dispute exists, and ended with a government admitting in writing that it had violated three amendments.",
    evidence: [
      "'Targeted', Tampa Bay Times investigation, 19 November 2020",
      "~420 children on a Pasco County Sheriff's Office list of likely future criminals; neither children nor parents informed",
      "Sixteen flagging categories included D grades, three or more absences in a quarter, discipline referrals — and adverse childhood experiences: abuse, witnessing violence, parental incarceration",
      "School district early-warning data covered 30,000+ middle and high school students",
      "District paid the Sheriff's Office $2.3m a year for 32 school resource officers",
      "Four residents — Deegan, Taylor, Heilman and Jones — sued in federal court in 2021, represented by the Institute for Justice",
      "Documented harassment took the form of repeated visits at all hours and citations for overgrown grass, missing house numbers, unvaccinated pets and window tint",
      "The Sheriff's Office discontinued the programme in 2023",
      "Settled 4 December 2024 on the eve of trial. The Sheriff's Office ADMITTED violations of the Fourth Amendment (checks exceeded the implied licence to knock), the First Amendment (interference with intimate association) and Fourteenth Amendment due process (interference with liberty interests)",
      "$105,000 in damages; the office is barred from operating a comparable programme again",
    ],
    questions: [
      "This documents one county's programme. It does not establish how widespread the practice is, and this concept makes no claim about other jurisdictions.",
      "It concerns lists, monitoring and police contact. It establishes nothing about any child being harmed, taken, or approached by anyone outside that programme.",
      "The Sheriff's Office admitted constitutional violations as part of a settlement. A settlement is not a trial verdict, and no court entered findings of fact against the office.",
      "The admissions concern the conduct of the checks. They are not a finding about what the list itself did to any individual child's life.",
    ],
    references: [
      { label: "Targeted — Tampa Bay Times (2020)", href: "https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/" },
      { label: "Case closed: Pasco Sheriff admits the programme violated the Constitution — Institute for Justice", href: "https://ij.org/press-release/case-closed-pasco-sheriff-admits-predictive-policing-program-violated-constitution/" },
      { label: "Pasco settles its intelligence-led policing programme — Florida Phoenix", href: "https://floridaphoenix.com/2024/12/05/pasco-county-sheriffs-office-settles-intelligence-led-policing-program/" },
      { label: "Why isn't any of this in the news?", href: "/concepts#why-isnt-this-in-the-news" },
      { label: "There is no column for you", href: "/concepts#no-column-for-you" },
    ],
    referencesNote:
      "The Times is cited for its own investigation; the Institute for Justice was counsel to the plaintiffs and is cited for the settlement terms it obtained; Florida Phoenix is cited for its own reporting of the same settlement. The linked concepts are adjacent arguments and neither corroborates this one.",
    verification: "unverified",
    disclaimer:
      "This concept reports a published investigation into one county's programme. It makes no claim about any other jurisdiction, and none about harm to any individual child.",
  },
  {
    id: "why-isnt-this-in-the-news",
    origin: "ai",
    basis: "documented",
    theme: "record",
    audience: ["press"],
    topics: [],
    title: "Why isn't any of this in the news?",
    body:
      "The usual assumption is that silence means suppression. There is a duller explanation with far better evidence behind it, and anyone reasoning about an absence of coverage should meet it first. Local journalism in the United States has collapsed. Northwestern's Medill School has tracked it annually; its 2025 State of Local News report counts nearly 3,500 newspapers gone since 2005 — close to forty per cent of all local papers in the country — with 136 lost in the last year alone. Two hundred and thirteen counties now have no local news source of any kind. A further 1,524 counties have exactly one, usually a weekly. Roughly fifty million Americans live with limited or no access to local news. More than 270,000 newspaper jobs have disappeared since 2005, a decline of over seventy-five per cent. So for a large part of the country, the question is not why reporters did not cover something. It is that there is no reporter. No one attends the council meeting, reads the court docket, or files the records request. Things do not go uncovered because they were buried; they go uncovered because the institution that used to notice them was dissolved for economic reasons over two decades, in public, with the numbers published every year. An absence of coverage is therefore very weak evidence of anything. It was weak evidence before any particular story existed.",
    evidence: [
      "Medill State of Local News report, 2025: nearly 3,500 newspapers lost since 2005, close to 40% of all US local papers",
      "136 newspapers closed or merged in the last year alone",
      "213 counties have no local news source at all; nearly 80% of them predominantly rural",
      "1,524 further counties have only one outlet, usually a weekly",
      "~50 million Americans live with limited or no access to local news",
      "270,000+ newspaper jobs lost since 2005, a decline exceeding 75%",
    ],
    questions: [
      "This explains why coverage is absent in general. It does not prove that no specific story was ever suppressed, and it is not offered as proof of that.",
      "National outlets still exist. The collapse documented here is local, and the concept does not extend to national editorial decisions.",
      "That an absence has an ordinary explanation does not establish that nothing happened. It establishes that the absence itself carries almost no information.",
    ],
    references: [
      { label: "Medill State of Local News report — Nieman Lab summary (2025)", href: "https://www.niemanlab.org/2025/10/in-medills-latest-state-of-local-news-report-a-festering-20-year-old-problem-looms-larger-than-ever/" },
      { label: "What are children subject to?", href: "/concepts#what-children-are-subject-to" },
      { label: "Next to each other is not because of each other", href: "/concepts#co-occurrence-is-not-cause" },
    ],
    referencesNote:
      "Medill is cited for its own annual count. The last link is method: this concept is about what an absence can and cannot support, which is the same discipline applied to a different kind of gap.",
    verification: "unverified",
    disclaimer:
      "This concept reports published research on the decline of local news. It makes no claim about the editorial decisions of any outlet, and does not establish that any particular story was or was not suppressed.",
  },
  {
    id: "children-wearables-and-rf",
    origin: "ai",
    basis: "documented",
    theme: "neurotech",
    audience: ["household", "clinicians"],
    topics: ["proposed-solutions", "technology", "surveillance", "health-effects"],
    title: "Are children harmed by wireless exposure?",
    body:
      "The question has been asked seriously and tested at scale, and the answer is not the one either side tends to expect. In 2011 the International Agency for Research on Cancer classified radiofrequency electromagnetic fields as Group 2B, possibly carcinogenic to humans. That classification is real and is widely cited. It is worth knowing what the tier means: 2B is the agency's weakest positive category, used where evidence is limited and a link cannot be excluded, and it holds several hundred agents. Since then the question has been examined far harder. A systematic review commissioned by the World Health Organization, published in Environment International in September 2024, screened more than five thousand studies from 1994 to 2022 and included sixty-three. It found no association between mobile phone use and cancers of the head, including among long-term and heavy users. It is the most comprehensive assessment to date. A group of researchers has published a methodological critique of it, and that dispute belongs in the record alongside the finding. Precaution for children persists in policy anyway. France banned mobile phones in schools in 2018, and several national authorities advise limiting children's exposure — on the reasoning that a child's exposure starts earlier and continues longer, not on a demonstrated harm. The documented risks of the devices children actually wear are duller and better established. Headset makers set age floors, Meta's Quest at ten, and the literature on vergence-accommodation conflict records eye strain and post-use balance effects. The American Academy of Pediatrics maintains guidance on children's VR use. One further finding is worth stating because it is so often misread: phantom vibration, the distinct sensation that a phone has buzzed when it has not, is widely reported among ordinary device users and has its own research literature. A device a person carries can produce a vivid felt sensation that did not occur, with nobody doing anything to them. On present evidence the strongest documented harms to children from these devices are not radiological at all. They are what the devices collect, who receives it, and what is done with it afterwards.",
    evidence: [
      "IARC classified radiofrequency electromagnetic fields as Group 2B, 'possibly carcinogenic to humans', in 2011 — the agency's weakest positive tier, holding several hundred agents",
      "WHO-commissioned systematic review, Environment International, September 2024: 5,000+ studies screened from 1994–2022, 63 included; no association found between mobile phone use and head cancers, including for long-term and heavy use",
      "A group of researchers has published a methodological critique of that review",
      "France banned mobile phones in schools in 2018; several national authorities advise limiting children's exposure on precautionary rather than demonstrated grounds",
      "Headset age floors are set by manufacturers — Meta Quest at 10; the vergence-accommodation literature records eye strain and post-use balance effects; the AAP maintains guidance on children's VR use",
      "Phantom vibration — feeling a phone buzz when it has not — is widely reported among device users and has its own research literature",
    ],
    questions: [
      "The 2B classification has not been withdrawn. The 2024 review is evidence about cancer of the head; it is not a statement about every possible biological effect.",
      "This concept records a live scientific dispute rather than resolving it. The critique of the review is cited as existing, not as correct.",
      "Nothing here addresses exposure levels above consumer device output, which is a different question with a different literature.",
    ],
    references: [
      { label: "WHO review finds no link between mobile phone use and brain cancer — ARPANSA", href: "https://www.arpansa.gov.au/who-review-finds-no-link-between-mobile-phone-use-and-brain-cancer" },
      { label: "IARC Monographs — Non-ionizing Radiation, Part 2: Radiofrequency Electromagnetic Fields", href: "https://publications.iarc.who.int/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Non-ionizing-Radiation-Part-2-Radiofrequency-Electromagnetic-Fields-2013" },
      { label: "Virtual reality use and children — American Academy of Pediatrics", href: "https://www.aap.org/en/patient-care/media-and-children/center-of-excellence-on-social-media-and-youth-mental-health/qa-portal/qa-portal-library/qa-portal-library-questions/virtual-reality-use-and-children/" },
      { label: "What are children subject to?", href: "/concepts#what-children-are-subject-to" },
      { label: "If nobody's house is haunted, what produces the feeling?", href: "/concepts#what-produces-the-feeling" },
    ],
    referencesNote:
      "Each body is cited for its own published position, and IARC and the 2024 review do not agree with one another. The last two links are companion concepts: one on what is documented as happening to children, one on sensation arising without an external source.",
    verification: "unverified",
    disclaimer:
      "This concept reports published classifications, a systematic review and its critics, and manufacturer and paediatric guidance. It establishes no harm to any individual child and takes no position on any dispute the cited bodies have not settled.",
  },
  {
    id: "how-protected-is-your-medical-record",
    origin: "ai",
    basis: "documented",
    theme: "surveillance",
    audience: ["household", "policy", "clinicians"],
    topics: ["technology", "surveillance", "law-government"],
    title: "How protected is your medical information?",
    body:
      "Less than most people assume, and the gap is structural rather than criminal. HIPAA protects a setting, not a category of information. It binds health plans, clearinghouses and providers who bill electronically. It does not bind most of the places health information is now generated. That distinction is not academic. When the Federal Trade Commission acted against GoodRx in February 2023, it could not use HIPAA at all — it used the Health Breach Notification Rule, and part of its complaint was that GoodRx had falsely suggested to consumers that it complied with HIPAA. What GoodRx had actually done was compile lists of users who bought particular medications and upload their email addresses, phone numbers and mobile advertising identifiers to Facebook, Google, Criteo, Branch and Twilio, so those users could be advertised to on the basis of their prescriptions and health conditions. The penalty was $1.5 million. The FTC brought a comparable action against BetterHelp over mental-health questionnaire data shared with advertisers. Scale is the other half. In 2024 a ransomware attack on Change Healthcare, a UnitedHealth subsidiary that processes a large share of American medical claims, exposed the data of roughly 190 million people — the largest health-data breach in United States history, and not a break-in at a doctor's office but a failure at a clearing house most patients had never heard of and none had chosen. So the honest answer is that medical privacy in America is strong where a clinician is involved and weak nearly everywhere else, and the largest single loss of it was not a violation by anyone treating a patient.",
    evidence: [
      "HIPAA binds covered entities — plans, clearinghouses, and providers billing electronically — not most apps, wearables or websites that collect health information",
      "FTC v. GoodRx, February 2023: $1.5m civil penalty under the Health Breach Notification Rule, not HIPAA",
      "GoodRx uploaded email addresses, phone numbers and mobile advertising IDs of users of specific medications to Facebook, Google, Criteo, Branch and Twilio",
      "The FTC complaint stated GoodRx had falsely suggested to consumers that it complied with HIPAA",
      "The FTC brought a comparable action against BetterHelp over mental-health questionnaire data shared with advertisers",
      "2024: a ransomware attack on Change Healthcare, a UnitedHealth subsidiary, exposed the records of roughly 190 million people — the largest US health-data breach on record",
    ],
    questions: [
      "These are enforcement actions and a breach. None of them establishes that any individual's records were accessed by any particular party for any particular purpose.",
      "A breach exposes data. It does not establish what was subsequently done with it, and in most cases that cannot be traced.",
      "This concept does not address law-enforcement access to medical records, which is governed by different rules and is a separate question.",
    ],
    references: [
      { label: "FTC enforcement action against GoodRx (2023)", href: "https://www.ftc.gov/news-events/news/press-releases/2023/02/ftc-enforcement-action-bar-goodrx-sharing-consumers-sensitive-health-info-advertising" },
      { label: "What happens to everyone around a target?", href: "/concepts#everyone-around-a-target" },
      { label: "Are people made into intelligence assets without knowing it?", href: "/concepts#made-into-assets-unknowing" },
    ],
    referencesNote:
      "The FTC is cited for its own enforcement action. The linked concepts describe adjacent collection markets and neither corroborates this one.",
    verification: "unverified",
    disclaimer:
      "This concept reports enforcement actions and a publicly disclosed breach. It establishes no unlawful access to any individual's records, and no conduct by any clinician or care provider.",
  },
  {
    id: "everyone-around-a-target",
    origin: "ai",
    basis: "documented",
    theme: "surveillance",
    audience: ["household", "investigators", "policy"],
    topics: ["harassment", "technology", "surveillance", "law-government"],
    title: "What happens to everyone around a target?",
    body:
      "Surveillance aimed at one person is rarely confined to one person, and in at least one widely deployed technology the indiscriminacy is the design. A cell-site simulator, commonly called a Stingray, works by impersonating a mobile network tower. Phones in range cannot tell the difference, so they connect and identify themselves. That includes the phone the operator is looking for and every other phone nearby — neighbours, passers-by, people in adjacent flats, anyone in a hospital or a place of worship within the radius. The bystander collection is not an error; it is how the device locates the target at all. What surrounded that capability is documented too. The FBI required local police departments to sign non-disclosure agreements as a condition of acquiring the equipment, and the American Civil Liberties Union obtained and published them. Departments concealed the technology's use from defence lawyers and from judges, and in some cases prosecutors dropped charges rather than disclose in open court how a defendant had been found. The Pasco County programme shows the same shape without any exotic equipment: the people repeatedly visited were not only those on the list but the households around them — parents, siblings, grandparents cited for uncut grass and missing house numbers because someone under that roof had been designated. Whether or not a given system is aimed at one person, the record shows the burden of it lands on everyone within reach.",
    evidence: [
      "A cell-site simulator impersonates a network tower; every phone in range connects and identifies itself, not only the target's",
      "Bystander collection is intrinsic to how the device locates a target, not an incidental fault",
      "The FBI required non-disclosure agreements from local departments acquiring the equipment; the ACLU obtained and published them",
      "Use was concealed from defence counsel and courts, and charges were dropped in some cases rather than disclose the method",
      "Pasco County: households around a listed person — parents, siblings, grandparents — were repeatedly visited and cited",
    ],
    questions: [
      "This describes capability and documented practice. It does not establish that any particular person was ever incidentally collected.",
      "Policy has changed in places since the non-disclosure agreements were published, and this concept does not track current practice in any given jurisdiction.",
      "Nothing here establishes coordination between the technologies described, or that any of them was directed at any individual.",
    ],
    references: [
      { label: "Stingray tracking devices — ACLU", href: "https://www.aclu.org/issues/privacy-technology/surveillance-technologies/stingray-tracking-devices" },
      { label: "Uncovering the FBI's surveillance tech secrecy agreements — ACLU", href: "https://www.aclu.org/news/privacy-technology/surreal-stingray-secrecy-uncovering-the-fbis-surveillance-tech-secrecy-agreements" },
      { label: "What are children subject to?", href: "/concepts#what-children-are-subject-to" },
      { label: "Accountability isn't wired to deployment, even in the schema", href: "/concepts#accountability-not-wired" },
    ],
    referencesNote:
      "The ACLU is cited for documents it obtained and published. The Pasco material is drawn from the linked concept and its own sources.",
    verification: "unverified",
    disclaimer:
      "This concept reports documented capability and published practice. It establishes no surveillance of any individual, and no current practice by any named agency.",
  },

  /* ------------------------------------------------------------------------
     TWO CONSTRUCTIVE CONCEPTS (Sean, 10 September). Both are ARGUMENTS, not
     findings, and both are labelled `structural` and `unverified` so they can
     never be quoted as things this record establishes. They exist because the
     register held 35 concepts and not one of them described a system worth
     building — an archive that only catalogues harm gives a reader who believes
     all of it nowhere to put that belief except fear.
     --------------------------------------------------------------------- */
  {
    id: "prevention-as-the-product",
    origin: "author",
    basis: "structural",
    theme: "surveillance",
    audience: ["policy", "household"],
    topics: ["proposed-solutions", "technology", "surveillance", "law-government"],
    title: "Who could refuse a system that saved their child?",
    body:
      // EMBELLISHED 10 September at Sean's request — it was the shortest slide
      // of the seven at 298 characters, and the scenario that makes the argument
      // worth having was entirely below the fold.
      //
      // KEPT ANALYTICAL, DELIBERATELY. The mechanism is the whole point, and
      // detail about what an offender intends toward a named child adds nothing
      // to it while costing the archive its seriousness. What the scenario needs
      // to establish is the SEQUENCE — flagged in seconds, reviewed by a person,
      // decided by a person, steered away — and the outcome, which is a child
      // who never learns anything happened.
      "Imagine the terms inverted: you are told whenever you are observed, harassment is a crime rather than a method, and law enforcement is paid for harm that did not happen rather than arrests that did. Now the hard case: someone on a registry is present where children are, and the system flags it in seconds rather than after a report — an automation raises it, a person reviews it, a person decides. The intervention is closer to social work than policing; the individual is steered away, no crime occurs, and a child goes home that afternoon never knowing there was an afternoon to survive. The family is told a harm was prevented, and invited to review the service. What they feel is relief so total it forecloses argument, and that is the finding: a system justified by the worst thing that could happen to your child cannot be argued with by anyone who loves a child.\n\nWhat that family feels is the finding. Relief so total that it forecloses argument, and then, for anyone who thinks about it later, the knowledge that a mind was read and a life rearranged before anything was done — and that they are glad. A system justified by the worst thing that could happen to your child cannot be argued with by anyone who loves a child. That makes the consent it collects the most powerful instrument in it, and the least examined.",
    evidence: [
      "420 schoolchildren placed on a sheriff's list of likely future criminals — what predictive intervention has actually produced on this record",
      "0 of 99 regulations record a route to individual review",
      "Colorado HB24-1058 (2024): express consent before neural data is collected, and a route for a person to have it deleted",
    ],
    questions: [
      "Whose consent is it? The family's is asked for. The observed person's is not.",
      "What is the remedy when the inference is wrong and no act ever occurred?",
      "Is there any point at which a grateful public says stop?",
    ],
    references: [
      { label: "What are children subject to?", href: "/concepts#what-children-are-subject-to" },
      { label: "Why did legislatures write laws for neural data?", href: "/concepts#law-for-neural-data" },
      { label: "Organised covert harassment of individuals is established fact", href: "/concepts#organised-harassment-is-fact" },
    ],
    referencesNote:
      "The first is a counter-example, not support: it is what prevention-before-the-act has produced where it has been tried on this record.",
    verification: "unverified",
  },
  {
    id: "whose-eyesight-is-it",
    origin: "author",
    basis: "structural",
    theme: "surveillance",
    audience: ["household", "policy"],
    topics: ["proposed-solutions", "technology", "surveillance", "law-government"],
    title: "Why does the camera on your door not answer to you?",
    body:
      "A doorbell camera watches your street and answers to its manufacturer. You can look at what it recorded; you do not hold it, and you cannot say who else can. The proposal here is narrower than a privacy argument and harder to dismiss: give a citizen their own eyesight — one recording that belongs to the person the way a body camera belongs to an officer.\n\nThe procurement record gives that proposal an uncomfortable shape. Amazon Web Services is the largest government cloud vendor in this register by a wide margin: $42.9bn across 27 awards, and 93 deployments in 21 of the 35 geographies tracked. Its GovCloud capability list includes Amazon Rekognition — face detection and comparison across image and video. The company that sells the doorbell also sells the platform.\n\nThat is a statement about concentration, not a connection between the two, and nothing in this record shows one. What it does show is who has a column. Across 1,922 procurement entries, ten describe an individual. All ten are litigants.",
    evidence: [
      "AWS: $42.9bn across 27 awards; 93 deployments across 21 of the 35 geographies in the register",
      "Amazon Rekognition — face detection/comparison and image/video analysis — listed under AWS GovCloud (US)",
      "10 of 1,922 procurement records describe an individual; every one of them is a litigant",
      "Ring appears nowhere in this register: the consumer product sits outside the procurement record entirely",
    ],
    questions: [
      "Who would hold a citizen-owned recording, and on whose infrastructure?",
      "Is a record you own but cannot take off the platform really yours?",
      "What would it take for the observed person to appear in a procurement register at all?",
    ],
    references: [
      { label: "There is no column for you", href: "/concepts#no-column-for-you" },
      { label: "Who profits from a body?", href: "/concepts#who-profits-from-a-body" },
    ],
    referencesNote:
      "Both describe the gap this proposal is aimed at. Neither shows that a consumer camera and a government platform are linked.",
    verification: "unverified",
  },
  {
    id: "zersetzung-methods-are-crimes",
    origin: "ai",
    basis: "documented",
    theme: "coercion",
    audience: ["investigators", "press", "household"],
    topics: ["harassment", "law-government"],
    title: "Zersetzung's methods are crimes",
    body:
      "No law names Zersetzung, but its methods are crimes, and a US court has punished them. In August 2019 members of eBay's security team ran a campaign against Ina and David Steiner, who published a newsletter in Natick, Massachusetts, that was critical of the company. They sent live insects, a bloody pig mask, a funeral wreath and a book on surviving a spouse's death. They posted the couple's address with invitations to strangers, sent threats under invented identities, followed them, and planned to break into their garage to put a tracker on their car. Then they deleted evidence and lied to police.\n\nSeven former employees were convicted; the security director was sentenced to 57 months in prison. eBay admitted the facts in a deferred prosecution agreement and paid a $3 million criminal penalty, the statutory maximum, under three years of independent monitoring. In July 2026 the couple's civil suit settled for a reported $55.7 million.\n\nThe charges map onto Zersetzung's methods: stalking through interstate travel and electronic means (18 U.S.C. § 2261A), conspiracy (§ 371), witness tampering (§ 1512) and destroying records (§ 1519). The same conduct is criminal harassment and stalking under Massachusetts law, and stalking and harassment in Colorado. When two or more people conspire to intimidate someone out of their rights, federal law (§ 241) applies.\n\nGermany never made Zersetzung itself a crime after 1990, because laws cannot punish acts retroactively. It lets victims be formally rehabilitated instead, and since 2019 anyone recognised as the target of a Zersetzung measure receives a one-off payment of €1,500.",
    evidence: [
      "August 2019, Natick, Massachusetts: a campaign by members of eBay's security team against the publishers of a newsletter critical of the company, set out in federal charging documents",
      "Seven former employees convicted; the security director sentenced on 29 September 2022 to 57 months in prison, the last defendant sentenced on 18 July 2024",
      "Charged under 18 U.S.C. § 371 (conspiracy), § 2261A (stalking by interstate travel and by facilities of commerce), § 1512(b)(3) (witness tampering) and § 1519 (destroying or falsifying records)",
      "11 January 2024: eBay entered a deferred prosecution agreement, admitted the facts, paid a $3 million criminal penalty and accepted a three-year independent compliance monitor",
      "27 July 2026: the couple's civil suit (D. Mass., No. 1:21-cv-11181) settled for a reported $55.7 million",
      "Massachusetts: criminal harassment, M.G.L. c. 265 § 43A; stalking, c. 265 § 43. Colorado: stalking, C.R.S. 18-3-602; harassment, C.R.S. 18-9-111",
      "Germany: Zersetzung was not prosecuted as such after 1990; the 1994 rehabilitation laws and a 2019 amendment provide rehabilitation and a one-off €1,500 payment for targets of Zersetzung measures",
    ],
    questions: [
      "How would a target show a coordinated campaign when no single act looks criminal on its own?",
      "Who investigates when the conduct crosses state or national lines?",
      "This concept reports one prosecuted case. It does not claim that any other campaign described in this archive has been proven.",
    ],
    references: [
      { label: "Two former eBay executives sentenced to prison for cyberstalking — US Attorney, District of Massachusetts", href: "https://www.justice.gov/usao-ma/pr/two-former-ebay-executives-sentenced-prison-cyberstalking" },
      { label: "eBay to pay $3 million in connection with corporate cyberstalking campaign — US Attorney, District of Massachusetts", href: "https://www.justice.gov/usao-ma/pr/ebay-inc-pay-3-million-connection-corporate-cyberstalking-campaign-targeting" },
      { label: "Final defendant in eBay cyberstalking case sentenced — US Attorney, District of Massachusetts", href: "https://www.justice.gov/usao-ma/pr/final-defendant-ebay-cyberstalking-case-sentenced" },
      { label: "Settlement of the civil suit — The Boston Globe, 27 July 2026", href: "https://www.bostonglobe.com/2026/07/27/business/ebay-harassed-ina-david-steiner-settlement/" },
      { label: "18 U.S.C. § 2261A, stalking — Cornell Legal Information Institute", href: "https://www.law.cornell.edu/uscode/text/18/2261A" },
      { label: "18 U.S.C. § 241, conspiracy against rights — Cornell Legal Information Institute", href: "https://www.law.cornell.edu/uscode/text/18/241" },
      { label: "Massachusetts General Laws c. 265 § 43A, criminal harassment", href: "https://malegislature.gov/Laws/GeneralLaws/PartIV/TitleI/Chapter265/Section43A" },
      { label: "Massachusetts General Laws c. 265 § 43, stalking", href: "https://malegislature.gov/Laws/GeneralLaws/PartIV/TitleI/Chapter265/Section43" },
      { label: "Colorado Revised Statutes 18-3-602, stalking", href: "https://colorado.public.law/statutes/crs_18-3-602" },
      { label: "Colorado Revised Statutes 18-9-111, harassment", href: "https://colorado.public.law/statutes/crs_18-9-111" },
      { label: "Rehabilitation laws for victims of the SED dictatorship — Bundesstiftung zur Aufarbeitung der SED-Diktatur", href: "https://www.bundesstiftung-aufarbeitung.de/de/erinnern/opfer-und-betroffene/juristische-aufarbeitung/rehabilitierungsgesetze" },
      { label: "Federal Administrative Court on the Zersetzung payment, 14 December 2023", href: "https://www.bverwg.de/pm/2023/93" },
      { label: "Organised covert harassment of individuals is established fact", href: "/concepts/organised-harassment-is-fact" },
    ],
    referencesNote:
      "The Department of Justice releases and charging documents are cited for the conduct, charges and sentences; the Boston Globe for the civil settlement; the statutes for what the law prohibits; the German sources for how Germany has treated Zersetzung since 1990. The linked concept records the wider set of adjudicated harassment cases.",
    verification: "unverified",
    disclaimer:
      "This concept reports an adjudicated case and the laws that apply to its conduct. It makes no claim that any other organisation or person has committed any crime.",
  },
];

/**
 * The year of every primary source standing behind the concepts above.
 *
 * Hand-maintained, because a citation's year is not machine-readable out of a
 * prose evidence line. Its only job is the evidence-span chart on /concepts:
 * the record these concepts rest on is not recent, and the picture says that
 * faster than a sentence can.
 */
export const SOURCE_YEARS: {
  year: number; label: string;
  /** Where to read it. Absent where this archive holds no stable public URL. */
  url?: string;
  /** Concept ids that rest on this source — the reason the dot is on the chart. */
  cites: string[];
}[] = [
  { year: 1888, label: "Fox sisters confess the spiritualist fraud", cites: ["explanation-is-part-of-the-harm"] },
  { year: 1966, label: "Schelling, Arms and Influence", cites: ["attack-to-force-acknowledgment"] },
  { year: 1976, label: "Stasi Richtlinie 1/76 — Zersetzung doctrine", cites: ["ruin-first-then-rescue"] },
  { year: 1986, label: "Socialist Workers Party v Attorney General — COINTELPRO", cites: ["organised-harassment-is-fact"] },
  { year: 2005, label: "Granqvist: sensed presence tracks suggestibility, not fields", cites: ["what-produces-the-feeling"] },
  { year: 2006, label: "Kydd & Walter, The Strategies of Terrorism", cites: ["attack-to-force-acknowledgment"] },
  { year: 2007, label: "Nisour Square", url: "https://www.npr.org/2020/12/23/949679837/shock-and-dismay-after-trump-pardons-blackwater-guards-who-killed-14-iraqi-civil", cites: ["contractors-killed-and-freed"] },
  { year: 2011, label: "IARC classifies RF-EMF as Group 2B", url: "https://publications.iarc.who.int/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Non-ionizing-Radiation-Part-2-Radiofrequency-Electromagnetic-Fields-2013", cites: ["children-wearables-and-rf"] },
  { year: 2013, label: "PRISM disclosures", cites: ["no-private-thinking-space"] },
  { year: 2014, label: "Blanke: a robot induces a felt presence", url: "https://www.eurekalert.org/news-releases/889913", cites: ["what-produces-the-feeling"] },
  { year: 2014, label: "Edrei — NYPD LRAD deployment", url: "https://law.justia.com/cases/federal/appellate-courts/ca2/17-2065/17-2065-2018-06-13.html", cites: ["denver-acoustic-weapons"] },
  { year: 2016, label: "Penney measures the chilling effect", url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2769645", cites: ["no-private-thinking-space"] },
  { year: 2018, label: "Edrei v Bratton, 2d Cir.", url: "https://law.justia.com/cases/federal/appellate-courts/ca2/17-2065/17-2065-2018-06-13.html", cites: ["denver-acoustic-weapons"] },
  { year: 2018, label: "Reuters, The Body Trade", url: "https://ethics.sjmc.wisc.edu/wp-content/uploads/sites/2130/2024/08/reuters_bodytrade.pdf", cites: ["who-profits-from-a-body"] },
  { year: 2018, label: "France bans phones in schools", cites: ["children-wearables-and-rf"] },
  { year: 2020, label: "Tampa Bay Times, Targeted", url: "https://projects.tampabay.com/projects/2020/investigations/police-pasco-sheriff-targeted/school-data/", cites: ["what-children-are-subject-to"] },
  { year: 2020, label: "Blackwater pardons", url: "https://news.un.org/en/story/2020/12/1081152", cites: ["contractors-killed-and-freed"] },
  { year: 2022, label: "EFF exposes Fog Data Science", url: "https://www.eff.org/deeplinks/2022/08/inside-fog-data-science-secretive-company-selling-mass-surveillance-local-police", cites: ["made-into-assets-unknowing"] },
  { year: 2022, label: "Epps v Denver verdict", url: "https://www.aclu-co.org/cases/epps-et-al-v-city-and-county-denver-et-al/", cites: ["denver-acoustic-weapons"] },
  { year: 2023, label: "Amnesty, Automated Apartheid", url: "https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/", cites: ["no-private-thinking-space"] },
  { year: 2023, label: "Tang & Huth semantic decoder", url: "https://www.nature.com/articles/s41593-023-01304-9", cites: ["can-a-machine-read-thought"] },
  { year: 2023, label: "FTC v GoodRx", url: "https://www.ftc.gov/news-events/news/press-releases/2023/02/ftc-enforcement-action-bar-goodrx-sharing-consumers-sensitive-health-info-advertising", cites: ["how-protected-is-your-medical-record"] },
  { year: 2022, label: "Former eBay security staff sentenced for cyberstalking", url: "https://www.justice.gov/usao-ma/pr/two-former-ebay-executives-sentenced-prison-cyberstalking", cites: ["zersetzung-methods-are-crimes"] },
  { year: 2024, label: "eBay deferred prosecution agreement, $3m penalty", url: "https://www.justice.gov/usao-ma/pr/ebay-inc-pay-3-million-connection-corporate-cyberstalking-campaign-targeting", cites: ["zersetzung-methods-are-crimes"] },
  { year: 2024, label: "Neurorights Foundation, Safeguarding Brain Data", url: "https://perseus-strategies.com/wp-content/uploads/2024/04/FINAL_Consumer_Neurotechnology_Report_Neurorights_Foundation_April-1.pdf", cites: ["who-owns-neural-data"] },
  { year: 2024, label: "Colorado HB24-1058", url: "https://content.leg.colorado.gov/sites/default/files/documents/2024A/bills/2024a_1058_01.pdf", cites: ["law-for-neural-data"] },
  { year: 2024, label: "WHO-commissioned review finds no cancer link", url: "https://www.arpansa.gov.au/who-review-finds-no-link-between-mobile-phone-use-and-brain-cancer", cites: ["children-wearables-and-rf"] },
  { year: 2024, label: "Change Healthcare breach — 190m people", cites: ["how-protected-is-your-medical-record"] },
  { year: 2024, label: "Pasco settles, admitting three violations", url: "https://ij.org/press-release/case-closed-pasco-sheriff-admits-predictive-policing-program-violated-constitution/", cites: ["what-children-are-subject-to"] },
  { year: 2025, label: "Montana LC0005", cites: ["law-for-neural-data"] },
  { year: 2025, label: "Medill: 3,500 newspapers gone", url: "https://www.niemanlab.org/2025/10/in-medills-latest-state-of-local-news-report-a-festering-20-year-old-problem-looms-larger-than-ever/", cites: ["why-isnt-this-in-the-news"] },
  { year: 2026, label: "Tenth Circuit affirms Epps", cites: ["contractors-killed-and-freed"] },
];

/**
 * The headline findings, and the standing limits. Prose, so it lives HERE
 * rather than in a component: `scripts/check_content_inventory.py` tracks
 * lib/concepts.ts and cannot see copy buried in JSX. Anything a reader reads
 * belongs where the guard can count it.
 */
export const FINDINGS: { stat: string; line: string; id: string }[] = [
  { stat: "\u20AC90.5m", line: "in fines against one facial-recognition company across four European regulators. Over the same period US Immigration and Customs Enforcement paid it $12.75m.", id: "fined-in-europe-hired-in-america" },
  { stat: "190m", line: "people had their records exposed in the 2024 Change Healthcare breach, at a clearing house no patient chose or had heard of.", id: "how-protected-is-your-medical-record" },
  { stat: "420", line: "schoolchildren were placed on a Florida sheriff's list of likely future criminals. Having been a victim of abuse was one of the things that could put a child on it.", id: "what-children-are-subject-to" },
  { stat: "3,500", line: "American newspapers have closed since 2005, and 213 counties now have no local news source at all. That is why an absence of coverage proves very little.", id: "why-isnt-this-in-the-news" },
  { stat: "$300", line: "bought Reuters a human cervical spine. The trade is lawful in most states, and the donating family was never told.", id: "who-profits-from-a-body" },
  { stat: "40%", line: "rise in the United States suicide rate between 2000 and 2021, while the world's fell 27% on the same measure.", id: "us-rose-against-the-trend" },
  { stat: "3", line: "constitutional amendments a Florida sheriff's office admitted violating, in writing, to settle a case four residents refused to drop.", id: "what-children-are-subject-to" },
  { stat: "1 in 3", line: "healthy participants felt somebody standing behind them, touching them, when a robot delayed their own movement by half a second. Nobody was there.", id: "what-produces-the-feeling" },
];

export const NOT_ESTABLISHED: string[] = [
  "Nothing here establishes that any specific thing has been done to any specific person, including the author.",
  "No capability is documented that reads a person's perception, or that reaches them at a distance without their participation. Where a concept touches on that, it says so on its own page.",
  "An absence of evidence is recorded as an absence of evidence. It is never presented as proof that nothing happened, and never as proof that something did.",
  "Sources are cited for their own findings. Two sources sitting beside each other do not corroborate one another, and the section says so wherever they appear together.",
];

export const RESEARCH_INTRO =
  "Five bodies of work on one page: a procurement record, a public-health record, a crime record, " +
  "a master timeline, and the concepts drawn from all of them. Every figure resolves to a named " +
  "source, every claim states what it rests on, and every one of them says what it does not answer.";

/* ---------- filtering and sorting (Sean, 30 Sep 2026) ----------
 * In one place because two components need the same answer: the Filter panel's
 * "Show N" beside the page title, and the tile grid below it. */
function hasAll(have: string[], want: string[], match: "any" | "all" = "any") {
  if (!want.length) return true;
  return match === "all" ? want.every((v) => have.includes(v)) : want.some((v) => have.includes(v));
}

/**
 * A concept body as plain text, for tiles, slides and search (4 Oct 2026).
 * Bodies may use the small markdown subset rendered by ConceptBody; anywhere
 * that prints the body as raw text must strip it first. Plain-prose bodies
 * pass through unchanged.
 */
export function plainText(md: string): string {
  return md
    .split("\n")
    .filter((l) => !/^#{2,4} /.test(l) && l.trim() !== "---")
    .map((l) => l.replace(/^>\s?/, ""))
    .join("\n")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function filterConcepts(f: Filters): Concept[] {
  // Search reads the parts a person would actually remember: the claim, the
  // argument, the figures, and what it admits it cannot answer.
  const q = f.q.trim().toLowerCase();
  return CONCEPTS.filter((c) =>
    (!q || [c.title, plainText(c.body), ...(c.evidence ?? []), ...(c.questions ?? [])].join(" ").toLowerCase().includes(q)) &&
    hasAll([c.origin], f.origin) &&
    hasAll([c.basis], f.basis) &&
    hasAll([c.theme], f.theme) &&
    hasAll(c.audience, f.audience, f.match.audience) &&
    hasAll(c.topics, f.topic, f.match.topic));
}

export type ConceptSort = "default" | "documented" | "az";
export const CONCEPT_SORTS: { v: ConceptSort; l: string }[] = [
  { v: "default", l: "Default order" },
  { v: "documented", l: "Documented first" },
  { v: "az", l: "A–Z" },
];
const BASIS_RANK: Record<Basis, number> = { documented: 0, structural: 1, testimony: 2, pattern: 3 };

export function sortConcepts(list: Concept[], s: ConceptSort): Concept[] {
  const n = (c: Concept) => CONCEPTS.indexOf(c);
  const r = [...list];
  if (s === "documented") r.sort((a, b) => BASIS_RANK[a.basis] - BASIS_RANK[b.basis] || n(a) - n(b));
  else if (s === "az") r.sort((a, b) => a.title.replace(/^[^A-Za-z0-9]+/, "").localeCompare(b.title.replace(/^[^A-Za-z0-9]+/, "")));
  else r.sort((a, b) => n(a) - n(b));
  return r;
}

# News — tactics

- **Branch:** `main`
- **Started:** 2026-10-01
- **Status:** Plan, awaiting Sean's approval and his mandatory URLs
- **Decision record:** none yet. Write one once the open questions below are settled.

## Goal

A main-menu section, **News**, for reporting the archive did not write: news
articles and official announcements that bear on the record. Each item is a
summary in the site's own words and a link to the original. Articles are never
reproduced. Sean, 1 Oct 2026: "I don't know that we want to reproduce the news
article. But we do want to create a summary and link to the article."

## What already exists (surveyed 1 Oct 2026)

- **Links in the corpus and site tables:** 1,504 unique outside links in total.
  - Government: 305.
  - News and trade press: about 112, in two groups:
    - About 30 general-news articles: The Guardian, +972, AP, CBS, NPR, CNN,
      Washington Post, Boston Globe, Time, Forbes, Axios, Global News, Denver7,
      9News.
    - About 80 trade-press items on government cloud contracts:
      DatacenterDynamics, Computer Weekly, iTnews, Nextgov, FedScoop, The
      Register, DefenseScoop. Almost all come from `public/data/tables/sources.json`.
- **`sources.json`** already has the fields a news item needs: `title`,
  `publisher`, `published_on`, `url`, `evidence_tier`. The timeline's 311
  milestones point into it.
- **Microsoft protests** are named in five journal entries but carry no news
  link:
  - 2025-05-20 and 2025-08-19: the disruption at Build 2025;
  - 2025-08-26: the Microsoft workers arrested in Seattle;
  - 2025-11-05 and 2025-07-12: passing mentions.
- **The 2025 Microsoft / Unit 8200 investigation** is in the corpus as the +972
  Magazine link (`972mag.com/microsoft-cloud-israel-8200-expose`, cited in the
  2025-02-27 entry). The Guardian's version of the same joint investigation
  (August 2025) is **not** in the corpus. The only Guardian 2025 link is
  `2025/mar/06/israel-military-ai-surveillance`.
- **The DOJ indictment is not in the corpus yet.** Primary source, confirmed:
  - **Title:** "Members of Russian Intelligence Services Network Charged with
    Conspiring to Finance Terrorism and Commit Murder for Hire in the United States".
  - **Date and office:** 15 September 2026, Office of Public Affairs.
  - **Defendants:** five.
  - **Alleged direction:** the FSB.
  - **URL:** <https://www.justice.gov/opa/pr/members-russian-intelligence-services-network-charged-conspiring-finance-terrorism-and>

## Scope, revised (Sean, 1 Oct 2026, 18:06)

> "There have been 60 plus Chinese spies arrested in the United States… we need
> those blog posts from official sources. This index could possibly have 200
> posts in it… a title… the source… a summary, and… a link that opens a new
> window to the post. We want sharing on each of these news instances… tag
> everything by category. It all needs to exist by date… it's going to touch our
> data visualizations… we want to capture events over time… one band."

This makes News an **index of dated events from official sources**, not a short
reading list:
- **Scale:** about 200 items, built in batches.
- **First large batch:** U.S. espionage and covert-influence cases tied to the
  People's Republic of China (Sean's figure is 60 or more arrests), from
  justice.gov press releases (Office of Public Affairs and U.S. Attorneys' offices)
  and fbi.gov. The DOJ Russia indictment of 15 Sep 2026 belongs to the same
  category.
- **Each item:**
  - title as published;
  - source (the issuing office);
  - date;
  - summary;
  - link opening in a new tab;
  - categories;
  - a share control (CardShare, like Concepts and Glossary), which needs a stable
    address per item, so `/news/<slug>` pages are in scope (answers open
    question 2).
- **One band on the master timeline:** "News", track H, beside Legislation (A),
  Release (B), Deploy/enforcement (C), Litigation (D), Investment (E), Health (F)
  and Crime (G).
  - Each item is one milestone on its date. Clicking it opens the item.
  - The band follows the existing milestone format (`occurred_on`, `track`,
    `title`, `description`, `source_id`), with the source added to `sources.json`.
    The timeline renders it like any other track.

**Following industries (Sean, 18:08):** "We're following the neurotech industry,
the biotech industry, the government cloud industry, protests, global conflict as
related to these industries. Artificial intelligence is huge. Lawsuits,
litigation… another way of visualizing sources."

So an item carries two kinds of category:
- **Industry:** Neurotechnology · Biotechnology · Artificial intelligence ·
  Government cloud.
- **Event type:**
  - Espionage & foreign agents
  - Transnational repression
  - Murder for hire & violent plots
  - Protests
  - Global conflict
  - Lawsuits & litigation
  - Regulation & law
  - Harassment & Zersetzung
  - Public health

Both are filters on the page and on the timeline band.

**Backlinks, both ways (Sean, 18:08):**
- **On an item:** "Related in the archive", linking the glossary terms, concepts
  and journal entries it bears on. Stored in the item's front matter as
  `related: [glossary/<slug>, concepts/<id>, journal/<id>]`.
- **On those pages:** an "In the news" list of the items that point at them,
  built from the same field. One list, two directions, so the two sides cannot
  disagree.
- **Linking rule:** a link is made only where the item's own subject matches the
  term, concept or entry. Shared words are not enough, so a link never implies the
  archive's account is confirmed by the article.

**Previous draft categories (superseded by the two lists above):**
- Espionage & foreign agents
- Transnational repression
- Murder for hire & violent plots
- Neurotechnology
- Government cloud & surveillance
- Harassment & Zersetzung
- Courts & law
- Public health

Country is a separate field (China, Russia, …), so the band and the list can
both be filtered by it. Countries are states, not the organizations or names
that data-rules §2 keeps out of filters. **Sean to confirm** that a country
filter is acceptable.

**Sourcing rule:** official sources first. A DOJ or FBI release is the item;
news coverage is added only where no official post exists (Microsoft protests,
Guardian/+972).

**Every item is an allegation unless the release reports a conviction or plea.**
The summary says which, and keeps the release's own presumption-of-innocence
language for charges.

## Proposed shape

**Route and menu.**
- `/news`, a new main-menu item.
- Placed between Concepts and Research in the header, the phone menu and the
  footer ("The record" column). Built from `lib/routes.ts` like the other
  sections, so it appears everywhere or nowhere.

**One page, newest first. Each item shows:**
- the date published and the publisher's name;
- the headline as the publisher wrote it, linking out (opens in a new tab);
- a summary of 2 to 4 sentences in the site's words, attributed ("The Justice
  Department alleges…"), never a quotation of more than a short phrase;
- **"Why it's here"**: one line linking to the concept, glossary term or journal
  entry it bears on. This is what makes it this archive's news page and not a
  feed.
- **Topic labels**, from a short fixed list: Neurotechnology · Government cloud ·
  Surveillance · Harassment & Zersetzung · Law & courts · Public health ·
  Security & intelligence.

**Filter by topic and sort by date**, using the existing controls (ListControls).

**Lead item:** the 15 September 2026 DOJ indictment.

## Data: three copies, one text (CLAUDE.md §6)

No new tables. Each item is:
- **a corpus file**: `news/IS_NEWS_<yyyy-mm-dd>_<slug>.md`, with a front-matter
  header (title, publisher, published_on, url, topics, related) and the summary
  as the body, plus the standing disclaimer footer that the pipeline adds;
- **a Supabase `documents` row**: `collection = 'news'`, `doc_type = 'article'`.
  These are new rows, not a structural change;
- **site data**, generated from the download by `npm run corpus`.

`npm run check` must cover `news/`: the disclaimer footer, `check_no_name_lists.py`,
and the site data matching the download. A new folder with no owner is the bug
(CLAUDE.md §3).

## Rules this section must keep

- **The disclaimer applies.** The page mounts the standing disclaimer like every
  other section.
- **No claim against any organization.** Indictments are allegations: every DOJ
  item says the defendants are presumed innocent. Summaries attribute every claim
  to its source.
- **No lists of organizations or names (data-rules §2).** There is no filter, tag
  or facet by publisher, agency, company or defendant. Topics only. A name appears
  inside a summary, where the source said it. Defendants' names stay out of the
  summaries unless Sean decides otherwise.
- **Copyright.** Summaries in the site's own words; headline and a link; no
  article text and no publisher images.

## Logos (Sean asked about black-and-white source logos)

**Recommendation: publisher names set as text, not logo files.**
- **Permission:** logos are the publishers' trademarks. A row of them reads as
  endorsement, and some publishers forbid it.
- **Upkeep:** each logo has to be found, redrawn to black and white and kept
  current.
- **Consistency:** a name in small caps in the site's own typeface gives the same
  at-a-glance recognition and matches the rest of the site.

If Sean still wants logos, use only the official press-kit files.

## First set (to build, then Sean reviews)

| # | Item | Source to cite | In corpus? |
|---|---|---|---|
| 1 | DOJ: Russian intelligence network charged, terrorism financing and murder for hire (15 Sep 2026) | justice.gov press release | No, add |
| 2 | Microsoft Azure and Unit 8200 investigation (Aug 2025) | +972 Magazine / Local Call, and The Guardian's version | +972 yes; Guardian no |
| 3 | Microsoft blocks Unit 8200's access after its review (Sep 2025) | a news report, e.g. AP or TechCrunch | No |
| 4 | Build 2025 keynote disrupted by a Microsoft employee (May 2025) | Fortune / Gizmodo, or AP | No (journal mentions it) |
| 5 | Microsoft workers arrested at the Redmond protest (Aug 2025) | a news report | No (journal mentions it) |
| 6 | eBay cyberstalking civil suit settles (Jul 2026) | Boston Globe, Law.com | Yes |
| 7 | Israel's military AI surveillance (Mar 2025) | The Guardian | Yes |
| 8 | Veterans Affairs and assisted-dying discussions (2022) | Global News | Yes |
| + | Sean's mandatory URLs | — | — |

The roughly 80 trade-press items on government cloud contracts stay as sources
behind the Timeline and Government Cloud. They are contract records, not news a
reader follows. Any of them can be promoted to News if Sean wants.

## Staying current

Two pieces (Sean asked whether a skill or an agent fits):
1. **A news-curation skill**, saved through the skill proposal card. It writes the
   method down once:
   - where to look, official sources first;
   - how to check an item;
   - how to write a summary (attributed, allegation or outcome stated);
   - how to pick categories and backlinks;
   - how to write the corpus file.

   Any session then follows the same rules.
2. **A daily scheduled task** (Sean, 2 Oct 12:42: "searches for new and relevant
   articles every single day"; was weekly) that runs the skill over the followed
   industries and **drafts** new items into a review list for Sean. Nothing
   publishes without his approval. A project in itself; see To-dos, After launch.

Set up both after the first batch, so the skill is written from the method that
actually worked.

## Page design (Sean, 2 Oct 2026)

Decided in conversation on 2 October:

- **Metrics first.** A row of figures:
  - items;
  - official sources;
  - years covered;
  - added this month.

  The chart panel sits underneath.
- **One full-width chart panel with tabs.**
  - **Over time** is the first tab and the default: **lines, not stacked bars**,
    one line per kind-of-event group, by year.
  - **Where from (publisher) · By category · By source type · By industry · By
    country:** each a horizontal bar chart. Publisher and country are approved as
    tabs and as filters (Sean, 2 Oct).
- **The filter drives the whole page.** Metrics, charts and list all follow it.
  - The Filter button sits above the metrics, with active filters as removable
    chips and "Clear all".
  - The tab for a filtered dimension still shows every value, with the selected
    one highlighted.
  - Clicking a bar or a line sets that filter.
- **The list.** Newest first, **25 per page**, using the existing Pager. The
  Filter button opens the existing side panel (FilterPanel) with:
  - search;
  - category, industry, source type, publisher, country, year.
- **Loading.**
  - The index (titles, dates, categories: about 276 rows, small) loads once,
    behind the site's loading animation, because the charts need every row to
    count.
  - Each page of the list renders 25 rows from it.
  - A summary is fetched only when its item is opened.
- **Clicking an item opens a dialog, not the original.** The dialog shows:
  - date, source type, publisher and stage;
  - the headline and our summary;
  - categories and related archive pages;
  - a **"Read the original"** button that opens the publisher's page in a new tab;
  - the archived copy;
  - **Share**.

  The shared link is `/news/<slug>`, which opens the same dialog over the list (or
  a plain page with no scripts), so a shared item always lands on our summary
  first.
- **Export.** One "Export" text link beside the item count opens a dialog with:
  1. **Download the corpus for AI** (primary): the same zip as the header button.
  2. **Download this list as CSV** (secondary): the items currently shown, built on
     the spot from the page's data.
     - Its first line is the standing disclaimer, enforced by a check like the
       corpus footer.
     - Both downloads are counted for `/insights`.
- **Publishing before summaries.** Open (see question 3 below). The
  recommendation is to keep the page unlisted until about 20 items have summaries.

## Review round 1 (Sean, 2 Oct 2026, 12:42, on localhost)

**Keep as is:** the filter drives the charts ("extremely valuable"); the tabs; the
table; share; pagination; mobile overall. The Over time chart is barely usable on
a phone; Sean: "let's leave it."

**Changes, in the suggested order**

| # | Change | What it takes | Size |
|---|---|---|---|
| 1 | **Page width matches the site.** `/news` uses the full width with 100px sides, so on screens wider than about 1450px it runs wider than every other page. | Use the frame the other pages use (`max-w-[1400px] mx-auto px-4 sm:px-6`, as in `JournalBrowser`). Sean left the choice open; recommended: match, since one width across the site is the rule a reader notices broken. | Small |
| 2 | **Heading "Every item" becomes "Posted articles."** The filtered form becomes "12 of 276 posted articles". | Copy change. | Small |
| 3 | **Bigger item dialog, room for a long summary.** | `DialogContent size="md"` (672px) becomes `lg` (768px, the size the site uses for long prose); summary set in the reading type at a comfortable measure, scrolling inside the dialog body. | Small |
| 4 | **Click a line on Over time to open a dialog**, as the other charts do (Public Health's country dialog). | Each line and its legend name open a shadcn `Dialog`: the group's name, its count per year, and its items newest first, each opening the item dialog. Picking the group as a filter moves into that dialog as a button, so a click no longer filters silently. | Medium |
| 5 | **A News bottom section**, and bottom sections under `/news`. | A News block for `BottomSections`: eyebrow and question, a small Over time visual, the five newest items with summaries, one way in. `/news` shows the existing Journal, Concepts, Research and Glossary blocks, excluding News (rule 1 in `BottomSections.tsx`). | Medium |
| 6 | **The News section on the home page.** | The same block built by `lib/home-sections.ts`, so home and bottom are checked alike. Goes live with the page, not before: a home section pointing at a page that is not live would be a dead end. | Medium |
| 7 | **Summaries.** | The dialog is working as built: all 276 items are `summary_status: pending`, so every one says "being written". Not a bug. First 20 for Sean's review, then batches. | Large |

Items 1 to 4 are page polish and can be reviewed together on localhost. 5 and 6
share one block, so they go together. 7 runs alongside and is what gates launch.

**shadcn components (Sean: "make sure we are using shadcn components").** Already
on them: the dialogs (`ui/dialog`), the sort select (`ui/select` via
`ListControls`), the pager (`ui/pagination` via `Pager`). Hand-built: the chart
tabs, the metric tiles, the bar rows and the table. Tabs: there is no `ui/tabs`
in the repo, and the one other tablist (`InsightsControls`) is hand-built too;
adding shadcn Tabs (`@radix-ui/react-tabs`, one new dependency) gives keyboard
arrows for free. The table: shadcn `ui/table` is plain styled markup; adding it
is cheap but changes nothing a reader sees. Proposed: add `ui/tabs` and
`ui/table` with change 4, and use them here first.

## To-dos

**Data and corpus**
- [x] `news/` corpus folder: one file per item. Front matter:
  - title, publisher, source_type, url, archived_url, date, precision;
  - industry, event, country, stage, related.

  The body is the summary. The standing footer is added by the pipeline.
- [x] Seed it with the 276 candidates (summaries empty), converted from
      `news_candidates.csv`.
- [x] Pipeline: `npm run corpus` exports the site data index (`public/data/news/`)
      and per-item summary files; the manifest and START-HERE list the folder.
- [x] Checks: footer on every news file; `check_no_name_lists.py` covers the folder
      (publisher and country exempted by Sean, 2 Oct, for News only); the site
      data matches the download.
- [ ] Supabase: one `documents` row per item (`collection = 'news'`); md5
      verification after the write.

**Page**
- [x] `/news` route, plus menu, phone menu and footer entries (via `lib/routes.ts`).
- [x] Metrics row.
- [x] Chart panel: tabs, the Over time line chart (in the style of the existing line
      charts), five bar-chart tabs, click-to-filter.
- [x] Filter button, panel and chips driving metrics, charts and list.
- [x] List: 25 per page, Pager, loading animation on first load.
- [x] Item dialog: summary, Read the original (new tab), archived copy, Share.
- [x] `/news/<slug>` share address, opening the dialog over the list.
- [x] Export dialog: corpus first, CSV second; CSV carries the disclaimer;
      analytics events.
- [x] Standing disclaimer mounted, as on every page.

**Content**
- [ ] Hand-review categories for all items (Sean spot-checks).
- [ ] Trim the government cloud contract stories in News to the 15 to 20 that
      matter; the rest stay as Timeline sources.
- [ ] First 20 summaries, for Sean's review; then the rest in batches.
- [ ] Archive every news link (Wayback Machine); keep copies of official releases.
- [ ] Finish collecting: DOJ releases from 2022 to 2026, AI litigation, protests.
- [ ] Resolve where the "no private thinking space" passage comes from (the Guardian
      or Amnesty's *Automated Apartheid*) before any summary or concept repeats it.

**After launch**
- [ ] Timeline band (track H, News).
- [ ] "In the news" on linked glossary, concept and journal pages.
- [ ] News section on the home page (review round 1, change 6).
- [ ] Curation skill.
- [ ] **Daily Claude task** that searches for new and relevant articles in the
      followed industries and drafts them for Sean's review (Sean, 2 Oct). A
      project of its own: sources, de-duplication against the index, the review
      list format, and how an approved draft becomes an item file.

**Verify**
- [x] Desktop, tablet and phone; filter, tabs, pagination, dialog, share link,
      both exports.
- [ ] The three copies agree.

## Verified / not verified

- **Verified:** the link survey above (a script over the unpacked corpus zip and
  `public/data/tables`), and the DOJ press release text.
- **Verified (2 Oct, branch `news`, b881041):** `npm run check` passes with the
  News guards (index matches its 276 files, footer on every file, site data
  matches the download byte for byte); `check_no_name_lists.py` needed no change.
  Headless Chromium on localhost: a Category bar filters list and charts (11 of
  276 for Transnational repression); an item opens the dialog at `/news/<slug>` and
  Escape restores `/news`; the share address opens its dialog directly; the CSV
  downloads with the disclaimer as its first line; no page errors; no sideways
  overflow at tablet or phone width.
- **Not verified:** whether every news link in the corpus is still live; a
  production build (`next build` exceeds the sandbox time limit); Supabase rows
  (not written yet).

## Open questions for Sean

0. ~~Over time first tab? Publisher and country as tabs and filters?~~ Yes to both
   (2 Oct).
1. Logos or publisher names as text?
2. ~~Own pages?~~ Yes: sharing needs them (18:06). Now a dialog with a share address
   (2 Oct).
3. ~~Publish once about 20 items have summaries, or right away with titles only?~~
   Not before summaries exist (2 Oct). The work stays on branch `news`.
4. Are defendants' names in a summary acceptable when the DOJ published them, or
   do they stay out?
5. ~~Should the weekly drafting task be set up now?~~ Daily, after launch (2 Oct).

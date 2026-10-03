# Source watch — a scheduled Claude task that keeps the site's outside sources current

- **Branch:** none yet (plan only)
- **Started:** 2026-10-02 (plan)
- **Status:** Plan, awaiting Sean's answers to the questions at the end
- **Decision record:** none yet. Write one once the questions are settled.

## Goal

Sean, 2 Oct 2026: "we need to create a Claude task that searches for new related
articles and any changes to existing articles… it would apply to all aspects of
the site."

A task that runs on a schedule without Sean at the desk, and does two jobs:

1. **Find new items** for News in the industries the site follows
   (neurotechnology, biotechnology and health, artificial intelligence,
   government cloud and surveillance technology), official sources first.
2. **Watch what the site already cites** for changes, across every section, and
   report what changed.

It **drafts and reports only**. Nothing reaches the live site without Sean's yes,
the same rule as every other publication here.

## What "a change to an existing article" means

For each outside link the site cites, the task can notice:

| Change | Example | What the task drafts |
|---|---|---|
| **The case moved on** | A Justice Department release says charged; a later release reports a plea, conviction or sentence | The new release as its own News item, and a stage update for the original item |
| **The page was edited or corrected** | A news article adds a correction, or an official page is updated | A note of what changed, and a revised summary if the change matters |
| **The link broke or moved** | A 404, or a redirect to a different page (as the +972 link did) | The working address, or the archived copy |
| **No archived copy yet** | Most items today | A Wayback Machine snapshot request, and the `archived_url` field filled |
| **A retraction** | A publisher withdraws an article | A flag for Sean. Nothing removed automatically |

## What it covers ("all aspects of the site")

| Section | Outside links | What the task may change |
|---|---|---|
| News | 276 items, one link each | Drafts new items, stage updates, link fixes, archived copies |
| Timeline, Government Cloud | about 660 sources in `public/data/tables/sources.json` | Link fixes, archived copies; flags changed figures |
| Crime and Public Health research | source rows in their tables and briefs | Link fixes; flags when a statistic has a newer release (for example, the FBI's annual figures) |
| Glossary and Concepts | cited examples and sources | Link fixes; flags only, since these are Sean's texts |
| Journal | links inside entries | **Link report only.** The journal record is never edited (standing decision) |
| Sean's Google Docs | — | **Never touched** (standing rule) |

## How it would work

1. **A written method (a skill).** One set of instructions every run follows:
   - where to look;
   - how to check an item;
   - how to write a summary (the rules in `project/features/news.md`: attributed,
     stage stated, presumption of innocence, no personal names);
   - how to choose categories;
   - how to write an item file.

   Written from the method that worked on 2 October.
2. **A schedule.** Proposed:
   - daily for new News items;
   - a rolling link check, about 100 links a day, so all ~1,500 are checked about
     every two weeks;
   - official-source and News links checked first.
3. **Approvals.** Each new website asks for approval once. A scheduled task has
   its own approval setting, and Sean can set it to automatic approval in the
   task's settings if his account allows it. Without that, runs stall on prompts
   no one is there to answer (the 2 October problem).
4. **Where the work lands** (see question 3). Recommended: the task writes its
   drafts to a branch in the GitHub repo, plus a short report. Sean reviews the
   report and either merges in GitHub Desktop or says "approve these" in a session.
   This does not depend on Sean's Mac being awake: a run that needs the Mac fails
   whenever it sleeps, as happened on 2 October.
5. **Checks before anything is proposed.** `npm run corpus` and `npm run check`
   must pass on the branch, so the download still matches the site and every
   file keeps the disclaimer.

## Risks and limits

- **Reading sites costs time and usage.** Hundreds of pages a week. The rolling
  schedule keeps each run small.
- **Some sites refuse automated reading** (Law.com, 9News, CNN). Those fall back
  to search results or another publisher's report of the same story, marked
  `draft-search`, as on 2 October.
- **A changed page is not always a meaningful change.** Ads and layout differ on
  every load. The task compares the article text, not the whole page, and
  reports only changes to facts.
- **Volume.** A daily search could propose more than Sean wants to read. A cap per
  run (for example, the 10 most relevant) keeps the review list short.

## Phases

1. **Settle the questions below**, then write a decision record.
2. **Write the skill** from the 2 October method, and propose it through the
   skill card for Sean to save.
3. **Link and archive check, by hand, once.**
   - Run over News and `sources.json` in a session, to measure how many links are
     broken and how long a pass takes.
   - Fill `archived_url` along the way.
4. **Create the scheduled task**, report-only at first. It produces the report
   and drafts, but no branch, for a week, so Sean can judge the quality and
   volume.
5. **Turn on drafting to a branch** once the reports are useful.
6. **Extend to the research tables**: newer statistics releases.

## Questions for Sean

1. **What should it look for?** The four industries as they stand, plus protests,
   litigation and global conflict as they relate to them? Anything to add or drop?
2. **How often?** Daily for new items and every two weeks for a full link check,
   or something else?
3. **Where should the drafts and the report land?** Options:
   - a branch in GitHub that you merge in GitHub Desktop (recommended);
   - a report in the Claude project that you read, then approve in a session;
   - an email or phone notification with a link to the report;
   - a mix: notification plus branch.
4. **How much per run?** A cap of 10 new items a day, or everything it finds?
5. **Automatic approval for website reading.** Will you turn on automatic
   approval for this one scheduled task, if your account offers it? Without it
   the task cannot read new sites while you are away.
6. **When a case moves on** (charged to convicted), should the original item's
   stage update, a new item be added, or both? Recommended: both.
7. **Research statistics.** When the FBI or another agency publishes a newer
   year, should the task only flag it, or draft the updated numbers too?
8. **Start date.** Build this now, or after the marketing plan?

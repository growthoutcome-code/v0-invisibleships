/**
 * Feature flags — things that are built but must not be visible yet.
 *
 * Sean, 5 September: "remove all contribute buttons temporarily… we don't want
 * to lose that work, but when we roll the home page out, we will not have
 * contribute ready yet."
 *
 * WHY A FLAG AND NOT A HIDE CLASS. A CSS-hidden button still ships to the DOM:
 * screen readers can reach it, keyboard tab order can land on it, and crawlers
 * index the link. The people this archive is aimed at are the least tolerant of
 * a bait-and-switch there are, and a button that promises an account form which
 * does not exist is exactly that. So the markup does not render at all — but it
 * stays in the source, one word from being switched back on.
 *
 * WHAT TURNING THIS ON REQUIRES. Accounts live on the `capture` branch and are
 * unfinished. Before this becomes true: Google sign-in working or hidden behind
 * its own flag, profiles and anonymous IDs, the identifier scanner, personal
 * export, the review queue — and a lawyer. See claude/roadmap.md.
 */

/** Sign-up exists and works. Until then, nothing may advertise an account. */
export const ACCOUNTS_READY = false;

/**
 * Guard for the /insights chart y-axis.
 *
 * WHY THIS IS GUARDED. The chart had two labels, 0 and the series maximum, so nothing
 * between them could be read off. Sean, 28 September: "for the vertical axis, the
 * y-axis, let's include some numbers in between 0 and 13." The replacement is a
 * nice-step algorithm, and a nice-step algorithm is exactly the kind of code that
 * keeps rendering something plausible while being wrong — a fractional label on a
 * count, a top tick below the peak so the line leaves the plot, a step of zero that
 * hangs the loop. None of that throws, and none of it is obvious in a screenshot.
 *
 * The invariants, which matter more than the exact values:
 *   - starts at 0
 *   - every tick is a whole number (these are counts of visits)
 *   - strictly increasing
 *   - the last tick is at or above the peak, so the line cannot touch the ceiling
 *   - between 3 and 7 ticks, or the axis is either unreadable or useless
 */
import { axisTicks, tickIndexes } from "../lib/chart-axis";

let failures = 0;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failures++;
};

// Every count from 0 to 500, plus the sizes this site will plausibly reach.
const cases = [...Array.from({ length: 501 }, (_, i) => i), 1000, 1337, 9999, 250000];

for (const peak of cases) {
  const t = axisTicks(peak);
  const at = `peak ${peak} -> [${t.join(", ")}]`;

  if (t[0] !== 0) fail(`${at}: does not start at 0`);
  if (t.some((v) => !Number.isInteger(v))) fail(`${at}: fractional tick on a count`);
  if (t.some((v, i) => i > 0 && v <= t[i - 1])) fail(`${at}: not strictly increasing`);
  if (t[t.length - 1] < peak) fail(`${at}: top tick is below the peak`);
  // Below a peak of 2 there is genuinely nothing to put between 0 and the top without
  // inventing fractional visits, so the readability floor starts there.
  if (peak >= 2 && t.length < 3)
    fail(`${at}: fewer than 3 ticks, nothing to read between 0 and the top`);
  if (t.length > 7) fail(`${at}: more than 7 ticks, the axis is clutter`);
}

// The case Sean actually named. Not pinned to exact values — the requirement is
// readable intermediate labels, not one particular step — but the top must clear 13
// and there must be something usable in between.
const thirteen = axisTicks(13);
if (thirteen.length < 4) fail(`peak 13 -> [${thirteen.join(", ")}]: needs labels between 0 and the top`);
if (thirteen[thirteen.length - 1] < 13) fail(`peak 13 -> [${thirteen.join(", ")}]: top below 13`);

// A flat-zero range must still draw an axis rather than dividing by zero.
const zero = axisTicks(0);
if (zero[zero.length - 1] < 1) fail(`peak 0 -> [${zero.join(", ")}]: no headroom on an empty chart`);

// --- x axis: which days get a date label -------------------------------------
//
// Same reason to guard as the y axis. Sean, 29 September: "we need x tick marks."
// An off-by-one here does not throw; it silently drops the last date, or repeats one,
// or returns an index past the end of the array and renders "undefined" on the axis.
for (const n of [0, 1, 2, 3, 5, 7, 30, 60, 365, 1000]) {
  for (const want of [2, 3, 5, 8]) {
    const t = tickIndexes(n, want);
    const at = `n=${n} want=${want} -> [${t.join(", ")}]`;

    if (n === 0) {
      if (t.length !== 0) fail(`${at}: no days should mean no ticks`);
      continue;
    }
    if (t[0] !== 0) fail(`${at}: first day is not labelled`);
    if (t[t.length - 1] !== n - 1) fail(`${at}: last day is not labelled`);
    if (t.some((v) => !Number.isInteger(v))) fail(`${at}: non-integer index`);
    if (t.some((v) => v < 0 || v > n - 1)) fail(`${at}: index outside the day array`);
    if (t.some((v, i) => i > 0 && v <= t[i - 1])) fail(`${at}: not strictly increasing`);
    if (t.length > Math.max(2, Math.min(want, n))) fail(`${at}: more ticks than asked for`);
  }
}

if (failures > 0) {
  console.error(`[axis-ticks] ${failures} failure(s).`);
  process.exit(1);
}
console.log(`[axis-ticks] ${cases.length} y scales and 40 x tick sets correct.`);

/**
 * Axis arithmetic for the /insights chart.
 *
 * A PURE MODULE WITH NO REACT IN IT, so scripts/check_axis_ticks.mts can import it
 * from a plain node script. It used to live in components/TrafficChart.tsx, which was
 * fine while that file was a server component and became a problem the moment the
 * chart needed click handling: a "use client" component pulls in React and the shared
 * dialog, and a guard should not have to boot a UI framework to check multiplication.
 */

/**
 * Gridline values from 0 to at or above the series maximum, on a round step.
 *
 * Sean, 28 September: "for the vertical axis, the y-axis, let's include some numbers
 * in between 0 and 13." The chart had exactly two labels, 0 and the maximum, so a peak
 * of 13 gave no way to read the height of anything else on the line.
 *
 * Steps come from the 1-2-2.5-5-10 family, so labels stay whole numbers — these are
 * counts of visits, and an axis reading 3.25 would be nonsense for a thing you cannot
 * have a quarter of. The top tick is rounded UP past the peak, which also stops the
 * line from touching the ceiling of the plot.
 */
export function axisTicks(max: number): number[] {
  const peak = Math.max(1, max);
  const target = peak / 4;
  const mag = 10 ** Math.floor(Math.log10(target));
  const norm = target / mag;
  // 2.5 earns its place on the sizes this page actually shows: a peak of 984 without
  // it lands on a step of 500 and an axis reading 0 / 500 / 1000, which is three
  // labels and no detail. With it the step is 250.
  const nice = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  // INTEGER STEPS ONLY, and never zero.
  //
  // Found by scripts/check_axis_ticks.mts on its first run: a peak of 1 produced a
  // step of 0.5, and rounding the labels for display turned [0, 0.5, 1] into
  // [0, 1, 1] — a duplicated gridline drawn twice at different heights with the same
  // number beside it. Rounding the STEP rather than the labels is the fix; these are
  // counts of visits, and half a visit is not a quantity.
  const step = Math.max(1, Math.round(nice));
  const top = Math.ceil(peak / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top; v += step) out.push(v);
  return out;
}

/**
 * Which positions along the x axis get a date label.
 *
 * Sean, 29 September: "the x-axis time to include some ticks. Right now we've got July
 * to September. For all time, we need x tick marks." The chart labelled only the first
 * and last day, so a peak in the middle could not be dated by eye at all.
 *
 * Returns indexes into the day array rather than dates, because the caller owns
 * formatting and knows how wide a label it can afford. Always includes the first and
 * last day: an axis whose ends are unlabelled is worse than one with no ticks, since
 * the reader cannot tell what range they are looking at.
 */
export function tickIndexes(n: number, want: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const k = Math.max(2, Math.min(want, n));
  // No de-duplication needed, and this is load-bearing rather than luck: k is clamped
  // to at most n, so the spacing (n-1)/(k-1) is never below 1 and two ticks cannot
  // round onto the same day. An earlier version wrapped this in a Set "in case"; a
  // mutation test that deleted the Set still passed, which is how the line was found
  // to be unreachable. Dead code carrying a comment about why it is needed is worse
  // than no code, because the next reader believes it.
  const out: number[] = [];
  for (let i = 0; i < k; i++) out.push(Math.round((i * (n - 1)) / (k - 1)));
  return out;
}

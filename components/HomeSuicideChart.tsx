"use client";

/**
 * The suicide chart as the home page presents it.
 *
 * WHY THIS FILE IS A CLIENT COMPONENT. The chart below has only ever mounted in
 * a browser: on /data/public-health it renders after a client-side fetch, so in
 * two years it has never once been server-rendered. Putting it on the home page,
 * where the data arrives as a build-time prop, ran it through SSR for the first
 * time — and a Next error appeared at exactly that point. This directive puts it
 * back under the conditions it has always run under. The data still comes from
 * the server as a prop; only the rendering moved.
 *
 * THIS IS NO LONGER A CHART. As of 9 September the drawing is the real one —
 * components/SuicideChart.tsx, the same fourteen-series component
 * /data/public-health renders, with both views, the sparkline legend, the
 * per-country detail panel and the phone-width bars. Sean asked for all of it.
 *
 * What remains here is the framing the home page needs and the research page
 * does not: a title that says what the picture shows before a reader has parsed
 * it, and the two facts the chart's own axis cannot carry.
 *
 * Between 8 and 9 September this file held a reduced three-line chart built for
 * exactly the density argument that has now been overruled. Nothing of it
 * survives except the caption, which was the part that mattered.
 */
import { MultiLineChart, type IntlChart } from "@/components/SuicideChart";

export default function HomeSuicideChart({ chart }: { chart: IntlChart }) {
  return (
    <figure className="m-0">
      {/* THE CHART SAYS WHAT IT SHOWS, ABOVE THE PLOT (Sean, 8 September: "that
          chart needs to be called out as an increase in suicide in the United
          States and Korea. Do not forget that part. It's very important.").

          It matters more now, not less. Fourteen lines carry more truth than
          three and they also bury the two that the page is actually about, so
          the sentence above the plot is what tells a reader which lines to look
          for before the legend asks them to choose.

          The falling world line stays in the second half of the sentence: it is
          what makes the rise mean something, and without it "suicide is rising"
          is a claim this data does not support about the world at large. */}
      <p className="font-display m-0 mb-1 text-[21px] font-semibold leading-[1.3] text-foreground sm:text-[24px]">
        Suicide is rising in the United States and South Korea
      </p>
      <p className="m-0 mb-6 text-[17px] text-muted">
        &mdash; while the world&rsquo;s rate fell 27%. Fourteen countries on one
        comparable basis; tap any line for its method, its caveats and its source.
      </p>

      <MultiLineChart chart={chart} />

      {/* THE TWO THINGS THIS CHART MUST NOT LEAVE OUT. The WHO basis stops at
          2021, and that is also the US peak — so a chart that said nothing
          further would leave a reader believing the rise is still running. It is
          not: 13.7 per 100,000 in 2024. An archive that publishes the peak and
          withholds the fall is doing the thing this one exists not to do. */}
      <figcaption className="body-copy measure mt-5 text-[18px] leading-relaxed text-foreground/85">
        The comparable WHO basis ends at 2021; each line continues on its own
        country&rsquo;s national statistics, marked as such in its panel. The United
        States&rsquo; own figures fall after the 2022 peak, to 13.7 per 100,000 in 2024.
      </figcaption>
    </figure>
  );
}

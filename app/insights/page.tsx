import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementNotes from "@/components/MeasurementNotes";
import { getInsights } from "@/lib/insights";
import {
  getTraffic,
  getVisitGroups,
  getShuffledVisits,
  getPostHogSeries,
  automated,
  toRange,
  RANGES,
  type RangeKey,
  type Row,
} from "@/lib/insights-posthog";
import InsightsControls from "@/components/InsightsControls";
// From the plain module, not from InsightsControls: that file is "use client", and a
// function imported across that boundary arrives as a client reference rather than
// something callable here. It typechecks and then throws at request time.
import { toSource, type SourceKey } from "@/lib/insights-source";
import { classifyVisit, CONFIDENCE_LABEL, type Confidence } from "@/lib/visit-trust";
import { getGaTraffic, gaConfigured } from "@/lib/insights-ga";
import TrafficChart from "@/components/TrafficChart";
import PagesTable, { type PageRow } from "@/components/PagesTable";
import { previewForPath } from "@/lib/page-preview";
import OptOutSection from "@/components/OptOutSection";
import InsightsDisclaimer from "@/components/InsightsDisclaimer";

/**
 * The public measurement dashboard.
 *
 * Sean, 26 September: "a traditional analytics page layout, not a bunch of text.
 * We need to hide disclaimers behind links and pop-ups."
 *
 * TWO TABS, ONE TOOL EACH. Google leads; PostHog is the second opinion. There is no
 * "Both" — see components/InsightsControls.tsx for why the side-by-side was a worse
 * idea than it looked, and what leading with the less accurate number costs.
 *
 * SAME SHAPE ON BOTH TABS, so moving between them compares like with like:
 *
 *     tiles -> pages -> locations -> visits over time
 *
 * Sean, 28 September: "what we want to lead with are pages. And then underneath
 * locations for both pages." Pages first because a page title is the only figure here
 * that says what somebody actually read.
 *
 * Every paragraph that used to sit on this page is in components/MeasurementNotes.tsx
 * behind "How this is measured", along with the switch that turns counting off for the
 * reader's own device.
 *
 * `noindex` while it looks like this.
 */

// Dynamic rather than revalidated: the page reads ?source and ?range, so it is
// rendered per request anyway. At this traffic that costs nothing, and it removes the
// up-to-five-minutes staleness the old ISR window introduced — numbers are now
// current at the moment they are read, which is what a page about accuracy should do.
//
// Kept explicit rather than left to Next's inference from searchParams: a later
// refactor that drops a param would otherwise start quietly serving a cached page of
// stale numbers, which is the one failure this page must not have.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Insights — Invisible Ships",
  description: "Visits, pages, locations and downloads, with what is excluded stated in full.",
  alternates: { canonical: "/insights" },
  robots: { index: false, follow: false },
};

const nf = new Intl.NumberFormat("en-US");

/** Attach a resolved preview to each row. Server-side: previewForPath reads the
 *  bundled corpus, and doing it here keeps the browser from requesting the site's own
 *  pages in order to describe them — which would add traffic to the page reporting it. */
function withPreviews(rows: Row[]): PageRow[] {
  return rows.map((r) => ({ ...r, preview: previewForPath(r.label) }));
}

function Tile({ n, label, sub }: { n: number | string; label: string; sub?: string }) {
  return (
    <div className="border border-edge p-4">
      <div className="font-display text-[28px] font-semibold leading-none text-foreground sm:text-[32px]">
        {typeof n === "number" ? nf.format(n) : n}
      </div>
      <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 text-[12px] leading-snug text-muted">{sub || " "}</div>
    </div>
  );
}

/** A table that is also its own bar chart: one measure per row, so a charting
    dependency would earn nothing here. */
function Table({
  title,
  rows,
  unit,
  note,
}: {
  title: string;
  // A row may carry its own flag. Preferred over the callback this once had, which had
  // to rebuild the label and match on the string — so any formatting change silently
  // dropped every flag, and for the locations table a dropped flag is the one failure
  // that must not happen.
  rows: (Row & { flag?: string })[];
  unit: string;
  note?: string;
}) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
        <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">{title}</h2>
        <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">{unit}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">Nothing recorded yet.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {rows.map((r) => {
            const f = r.flag ?? null;
            return (
              <li key={r.label} className="border-b border-edge py-2.5 last:border-b-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[15px] text-foreground">
                    {r.label}
                    {f && (
                      <span className="font-display ml-2 align-middle text-[10px] uppercase tracking-[0.12em] text-muted">
                        {f}
                      </span>
                    )}
                  </span>
                  <span className="font-display text-[15px] tabular-nums text-foreground">{nf.format(r.n)}</span>
                </div>
                <div className="mt-1.5 h-[3px] w-full bg-edge">
                  <div className="h-full bg-foreground" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {note && <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>}
    </section>
  );
}

/** The heading strip above a chart or a custom section, matching Table's. */
function SectionHead({ title, unit }: { title: string; unit: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
      <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">{title}</h2>
      <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">{unit}</span>
    </div>
  );
}

/**
 * Shown when the Google tab has no numbers to show.
 *
 * The one thing this tab must not do is show numbers that are not Google's. An empty
 * tab that explains itself is honest; a tab quietly repeating PostHog's figures under
 * a Google heading would be a lie the page could not detect.
 *
 * It distinguishes the two failures, because they need different fixes and this page is
 * the only place either becomes visible: no credentials in this environment (normal on
 * a development machine) versus credentials that exist and did not work (a service
 * account missing Viewer access on the property, the Data API not enabled on the Cloud
 * project, or a key that did not survive the trip through the environment variable).
 */
function GooglePanel() {
  const configured = gaConfigured();
  return (
    <div className="mt-8 max-w-3xl border border-edge p-5">
      <p className="font-display m-0 text-[11px] uppercase tracking-[0.14em] text-muted">
        {configured ? "Google did not answer" : "Not connected in this environment"}
      </p>
      <p className="m-0 mt-3 text-[15px] leading-relaxed text-foreground/85">
        {configured
          ? "Google Analytics is collecting on this site, and the credentials for reading it are present, but the Data API returned nothing. The usual causes are a service account without Viewer access on the property, the Data API not enabled on the Cloud project, or a key that was truncated on its way into the environment."
          : "Google Analytics is collecting on this site. Reading its figures needs a service account key and a property ID, which are not set here — so this tab has nothing to show rather than showing somebody else’s numbers under a Google heading."}
      </p>
      <p className="m-0 mt-4 text-[14px] leading-relaxed text-muted">
        The PostHog tab is unaffected, and its figures exclude the author.
      </p>
    </div>
  );
}

/**
 * Everything the PostHog tab needs, in one round trip.
 *
 * Gathered in a function rather than inline so that the Google tab can skip it
 * entirely. The page used to fire all six queries on every render regardless of which
 * tab was being looked at, which spent PostHog's API budget on numbers nobody had
 * asked to see.
 */
async function loadPostHog(range: RangeKey) {
  const [d, t, groups, shuffled, series] = await Promise.all([
    getInsights(),
    getTraffic(range),
    getVisitGroups(range),
    getShuffledVisits(range),
    getPostHogSeries(range),
  ]);

  // WHERE VISITS CAME FROM, and whether that can be believed.
  //
  // Built on PostHog page views rather than on gate_events, which is where an earlier
  // version read from and why this table was empty: nothing has been deployed yet, so
  // that table has no rows. PostHog has 470 events with cities and both clocks in them.
  //
  // classifyVisit() holds the rule. It lives in lib/visit-trust.ts as a pure function
  // because it cannot be exercised from a development machine — the sandbox cannot
  // reach PostHog — so it is guarded as arithmetic instead.
  const classified = groups
    .map((g) => ({ group: g, trust: classifyVisit(g) }))
    // Collapse identical (place, confidence) pairs. This is the point of the design:
    // eight VPN cities with the same masked time zone become one row that says what it
    // is, rather than eight rows that each imply a reader.
    .reduce<Map<string, { place: string; confidence: Confidence; visits: number }>>(
      (acc, { group, trust }) => {
        const key = `${trust.confidence}|${trust.place}`;
        const prev = acc.get(key);
        if (prev) prev.visits += group.visits;
        else acc.set(key, { place: trust.place, confidence: trust.confidence, visits: group.visits });
        return acc;
      },
      new Map(),
    );

  const placeRows = Array.from(classified.values())
    .sort((a, b) => b.visits - a.visits)
    .map((r) => ({ label: r.place, n: r.visits, flag: CONFIDENCE_LABEL[r.confidence] }));

  const confirmed = Array.from(classified.values())
    .filter((r) => r.confidence === "confirmed")
    .reduce((a, r) => a + r.visits, 0);

  return {
    d,
    t,
    series,
    shuffled,
    placeRows,
    confirmed,
    bots: t ? automated(t.traffic) : { bots: 0, total: 0 },
    // Downloads: ALL-TIME AND UNFILTERED, which is not the same basis as the rest of
    // this tab and so says so on the tile itself.
    //
    // It read 0 for weeks while 18 downloads sat in PostHog, because it showed the
    // count after the internal-traffic filter and every one of those downloads was
    // excluded by it. A transparency page whose download counter says nothing while
    // downloads have happened is worse than one that counts the author: the first is
    // read as "nobody wants this", which is a different and false claim.
    //
    // Sean, 27 September, after three rounds of this: "I need to see those corpus
    // downloads there." The page-level "all time" line that used to carry this caveat
    // for every figure is gone as of 29 September, so the caption carries it alone.
    downloads: t?.downloadsAll || d.downloadRows || 0,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { source?: string; range?: string };
}) {
  const range = toRange(searchParams?.range);
  // Unrecognised and retired values (the old `both`) fall back to Google rather than
  // erroring, so links shared before 29 September still open something sensible.
  const source: SourceKey = toSource(searchParams?.source);

  // EACH TAB FETCHES ITS OWN SOURCE IN FULL, PLUS THE OTHER ONE'S DAILY SERIES.
  //
  // The second series is the faint comparison line on the chart (Sean, 29 September).
  // Only the series is needed, not the other tool's tiles, tables or locations — so the
  // Google tab still makes one PostHog query rather than five, and the PostHog tab
  // reads Google only for its daily numbers.
  //
  // Worth knowing if this page ever feels slow: getGaTraffic issues five reports to
  // answer, and the PostHog tab uses exactly one of them. A series-only variant would
  // be the first thing to add.
  const [ga, gaCompare] =
    source === "ga"
      ? await Promise.all([getGaTraffic(range), getPostHogSeries(range)])
      : [null, null];
  const [ph, phCompare] =
    source === "posthog"
      ? await Promise.all([loadPostHog(range), getGaTraffic(range)])
      : [null, null];

  // Where the comparison panel sends a reader, keeping their date range. Built the
  // same way InsightsControls builds its tab links — Google is the default source and
  // so carries no ?source at all, which a hand-spliced query string kept getting wrong.
  const tabHref = (to: SourceKey) => {
    const q = new URLSearchParams();
    if (to !== "ga") q.set("source", to);
    if (range !== "all") q.set("range", range);
    const qs = q.toString();
    return `/insights${qs ? `?${qs}` : ""}`;
  };

  const windowLabel = RANGES[range].label.toLowerCase();

  return (
    <>
      <Header />

      <main className="w-full max-w-[1400px] mx-auto px-4 py-14 sm:px-6">
        <InsightsDisclaimer />

        <h1 className="font-display m-0 text-[32px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[40px]">
          Insights
        </h1>

        <InsightsControls source={source} range={range} />

        {source === "ga" ? (
          ga ? (
            <>
              {/* Google's own numbers, unfiltered by nature. Pages first: Sean,
                  28 September, "what we want to lead with are pages."

                  Every tile that includes the author says so on the tile. There is no
                  longer a line under the headline saying it once for the whole page,
                  and an uncaptioned number here would be read as a reader count. */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile n={ga.views} label="Pages viewed" sub="author included" />
                <Tile n={ga.sessions} label="Sessions" sub="author included" />
                <Tile n={ga.users} label="Users" sub="distinct browsers" />
                <Tile
                  n={ga.downloads}
                  label="Corpus downloads"
                  sub={ga.downloads > 0 ? "author included" : "none before 28 Sep"}
                />
              </div>

              <section className="mt-10">
                <SectionHead title="Visits per day" unit={windowLabel} />
                <TrafficChart
                  points={ga.series}
                  label="Google"
                  compare={
                    gaCompare && gaCompare.length > 0
                      ? {
                          points: gaCompare,
                          label: "PostHog",
                          href: tabHref("posthog"),
                          blurb:
                            "PostHog counting the same days. It is the site\u2019s second analytics tool, and it applies filters this line does not \u2014 preview deployments and non-production hosts are kept out of it.",
                        }
                      : null
                  }
                  note="Google counts every visit, the author&rsquo;s included; there is no author exclusion available on this figure. Downloads are missing before 28 September because the download is confirmed on the server, which a browser tag cannot see."
                />
              </section>

              <PagesTable title="Pages viewed" unit="views" rows={withPreviews(ga.pages)} source="Google" />

              <Table
                title="Where visits came from"
                unit="sessions"
                rows={ga.locations}
              />

            </>
          ) : (
            <GooglePanel />
          )
        ) : !ph?.t ? (
          <p className="mt-8 border border-edge p-4 text-[15px] text-muted">
            Visit counts are not connected in this environment.
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile n={ph.t.views} label="Pages viewed" sub={`${nf.format(ph.t.views30)} in 30 days`} />
              <Tile n={ph.t.visits} label="Visits" sub={`${nf.format(ph.t.visits30)} in 30 days`} />
              <Tile n={ph.confirmed} label="Confirmed location" sub="clocks agree, address precise" />
              <Tile
                n={ph.downloads}
                label="Corpus downloads"
                sub={
                  ph.t.downloads > 0
                    ? `all time · ${nf.format(ph.t.downloads)} not the author’s`
                    : "all time, author included"
                }
              />
            </div>

            <section className="mt-10">
              <SectionHead title="Visits per day" unit={windowLabel} />
              <TrafficChart
                points={ph.series}
                label="PostHog"
                compare={
                  phCompare && phCompare.series.length > 0
                    ? {
                        points: phCompare.series,
                        label: "Google",
                        href: tabHref("ga"),
                        blurb:
                          "Google Analytics counting the same days. It is the site\u2019s other analytics tool, and it filters nothing \u2014 every visit it sees is in that line.",
                      }
                    : null
                }
                note="The author, preview deployments and non-production hosts are excluded from this line, which is why it sits below Google&rsquo;s for the same days."
              />
            </section>

            <PagesTable
              title="Pages viewed"
              unit="views"
              source="PostHog"
              rows={withPreviews(ph.t.pages)}
              note={
                ph.bots.total > 0
                  ? `${nf.format(ph.bots.bots)} of ${nf.format(ph.bots.total)} page views were classified as automated — crawlers and link scanners rather than readers.`
                  : undefined
              }
            />

            {/* WHERE VISITS CAME FROM. One list, a confidence label on every row.
                Sean, 27 Sep: "it really is as simple as whether or not the location is
                from a VPN or not." Three earlier versions overshot that — a mixed
                ranked list with tiny labels, then deleting the VPN cities for a bare
                count, then a separate section. The label was always the requirement.

                What must never come back is an unflagged row: a city with no label
                asserts a reader is there, and for a relay that is false. A relayed row
                shows a TIME ZONE rather than a city, because the zone is true and the
                city is not — the precision the VPN removed is not re-invented here. */}
            <Table
              title="Where visits came from"
              unit="visits"
              rows={ph.placeRows}
            />

            {/* IP ROTATION. Sean spotted this before it was measured: a visit that
                arrives in one city and leaves from another. The clock comparison above
                INFERS a relay; this OBSERVES one, and needs no explanation of time
                zones to land — nobody travels from Denver to Secaucus mid-session.

                Kept as its own section rather than folded into the table above, because
                a row here is one visit across two places, while a row up there is one
                place across many visits. Merging them would mean inventing a shape that
                is neither. */}
            {ph.shuffled.length > 0 && (
              <section className="mt-10">
                <SectionHead
                  title="Visits whose location changed part-way through"
                  unit={`${ph.shuffled.length} ${ph.shuffled.length === 1 ? "visit" : "visits"}`}
                />
                <ul className="m-0 list-none p-0">
                  {ph.shuffled.map((v, i) => {
                    const moved = v.cities > 1;
                    return (
                      <li key={i} className="border-b border-edge py-2.5 last:border-b-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="text-[15px] text-foreground">
                            {moved ? (
                              <>
                                {v.enteredAt ?? "Unknown"} <span className="text-muted">&rarr;</span>{" "}
                                {v.exitedAt ?? "Unknown"}
                              </>
                            ) : (
                              <>
                                {v.enteredAt ?? "Unknown"}{" "}
                                <span className="text-muted">&mdash; same city, new address</span>
                              </>
                            )}
                            <span className="font-display ml-2 align-middle text-[10px] uppercase tracking-[0.12em] text-muted">
                              {moved ? `shuffled · ${v.cities} cities` : "address rotated"}
                            </span>
                          </span>
                          <span className="font-display text-[13px] tabular-nums text-muted">
                            {v.addresses} addresses &middot; {nf.format(v.views)}{" "}
                            {v.views === 1 ? "view" : "views"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">
                  One reading session, more than one network address. The industry term is{" "}
                  <strong className="font-normal text-foreground/85">IP rotation</strong>: a VPN
                  client switching server mid-session, a rotating proxy, Apple&rsquo;s iCloud
                  Private Relay reassigning an egress, a Tor circuit rebuilding, or a phone moving
                  between carrier gateways. Nobody travels between these cities inside one visit,
                  so the places named are the network&rsquo;s and not the reader&rsquo;s. This is
                  the most conclusive evidence of a relay the site has &mdash; the clock comparison
                  above infers one, this observes it. On its own it says little about how careful
                  the reader is: a reconnecting consumer VPN and a phone changing carrier gateway
                  both produce it, and the genuinely security-minded reader blocks this page&rsquo;s
                  counting altogether and never appears here at all.
                </p>
              </section>
            )}


            {ph.d.countries.length > 0 && (
              <Table
                title="Downloads by country"
                unit="downloads"
                rows={ph.d.countries.map((c) => ({ label: c.country, n: c.n }))}
              />
            )}
            {ph.d.roles.length > 0 && (
              <Table
                title="Who says they are reading"
                unit="answers"
                rows={ph.d.roles.map((r) => ({ label: r.visitor_role, n: r.n }))}
                note="Optional, anonymous and unverified — not a census."
              />
            )}
          </>
        )}

        <div className="mt-12 border-t border-edge pt-6">
          <MeasurementNotes>
            <button
              type="button"
              className="font-display text-[12px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
            >
              How this is measured
            </button>
          </MeasurementNotes>
        </div>

        <OptOutSection />
      </main>

      <Footer />
    </>
  );
}

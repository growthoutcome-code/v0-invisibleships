import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementNotes from "@/components/MeasurementNotes";
import MeasurementAlert from "@/components/MeasurementAlert";
import StandingDisclaimer from "@/components/StandingDisclaimer";
import { getInsights } from "@/lib/insights";
import {
  getTraffic,
  getVisitGroups,
  getShuffledVisits,
  getPostHogSeries,
  automated,
  toRange,
  RANGES,
  type Row,
} from "@/lib/insights-posthog";
import InsightsControls, { type SourceKey } from "@/components/InsightsControls";
import { classifyVisit, CONFIDENCE_LABEL, type Confidence } from "@/lib/visit-trust";
import { getGaTraffic, gaConfigured } from "@/lib/insights-ga";
import TrafficChart from "@/components/TrafficChart";
import OptOutSection from "@/components/OptOutSection";

/**
 * The public measurement dashboard.
 *
 * Sean, 26 September: "a traditional analytics page layout, not a bunch of text.
 * We need to hide disclaimers behind links and pop-ups."
 *
 * So: four numbers, two tables, downloads, and one link. Every paragraph that
 * used to sit on this page — what is never recorded, who is not counted, why it
 * exists — is in components/MeasurementNotes.tsx behind "How this is measured",
 * along with the switch that turns counting off for the reader's own device.
 *
 * Same shell and measure as /why, /safety and /author, deliberately: this is a
 * page of the site, not a tool bolted to the side of it.
 *
 * `noindex` while it looks like this. Revalidated every five minutes — a public
 * page that queries on every request is a load test aimed at your own dashboard.
 */

// Dynamic rather than revalidated: the page reads ?source and ?range, so it is
// rendered per request anyway. At this traffic that costs nothing, and it removes the
// up-to-five-minutes staleness the old ISR window introduced — numbers are now
// current at the moment they are read, which is what a page about accuracy should do.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What this site can see — Invisible Ships",
  description: "Visits, pages, locations and downloads, with what is excluded stated in full.",
  alternates: { canonical: "/insights" },
  robots: { index: false, follow: false },
};

const nf = new Intl.NumberFormat("en-US");

function Tile({ n, label, sub }: { n: number | string; label: string; sub?: string }) {
  return (
    <div className="border border-edge p-4">
      <div className="font-display text-[28px] font-semibold leading-none text-foreground sm:text-[32px]">
        {typeof n === "number" ? nf.format(n) : n}
      </div>
      <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 text-[12px] leading-snug text-muted">{sub || " "}</div>
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
  // A row may carry its own flag. Preferred over the callback below, which had to
  // rebuild the label and match on the string — so any formatting change silently
  // dropped every flag, and for the locations table a dropped flag is the one
  // failure that must not happen.
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
      {note && <p className="mt-3 text-[13px] leading-relaxed text-muted">{note}</p>}
    </section>
  );
}

/**
 * The Google Analytics tab, while its numbers are not readable from here.
 *
 * GA4 publishes figures only through its Data API, which needs a Google Cloud
 * service account with Viewer access on the property. That does not exist yet, so
 * this tab cannot show numbers — and the one thing it must not do is show numbers
 * that are not GA's. An empty tab that explains itself is honest; a tab quietly
 * repeating PostHog's figures under a Google heading would be a lie the page could
 * not detect.
 *
 * It is also not a placeholder for its own sake: the discrepancy Sean found between
 * the two dashboards has a known cause, and stating it here is most of the value a
 * side-by-side would have given him.
 */
function GooglePanel() {
  return (
    <div className="mt-8 max-w-3xl border border-edge p-5">
      <p className="font-display m-0 text-[11px] uppercase tracking-[0.14em] text-muted">
        Collecting, not yet readable here
      </p>
      <p className="m-0 mt-3 text-[15px] leading-relaxed text-foreground/85">
        Google Analytics is running on this site and recording page views. Its numbers
        live in the Google Analytics property and cannot be shown on this page yet:
        GA4 publishes figures only through its Data API, which needs a Google Cloud
        service account with read access to the property.
      </p>
      <p className="m-0 mt-4 text-[14px] leading-relaxed text-muted">
        <strong className="font-normal text-foreground/85">
          The two tools will not agree, and neither is wrong.
        </strong>{" "}
        PostHog&rsquo;s figures here exclude the author, preview deployments and
        non-production hosts. Google Analytics applies none of that, so it counts every
        visit including the author&rsquo;s &mdash; which is most of the traffic this site
        has had. Google Analytics also cannot see two things PostHog does: the entry
        gate&rsquo;s optional reader question, and the corpus download, which is recorded
        on the server rather than in the browser.
      </p>
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { source?: string; range?: string };
}) {
  const range = toRange(searchParams?.range);
  const source: SourceKey =
    searchParams?.source === "ga" ? "ga" : searchParams?.source === "posthog" ? "posthog" : "both";
  const showPh = source !== "ga";
  const showGa = source !== "posthog";
  const [d, t, groups, shuffled, phSeries, ga] = await Promise.all([
    getInsights(),
    getTraffic(range),
    getVisitGroups(range),
    getShuffledVisits(range),
    getPostHogSeries(range),
    getGaTraffic(range),
  ]);

  // WHERE VISITS CAME FROM, and whether that can be believed.
  //
  // Built on PostHog page views rather than on gate_events, which is where an
  // earlier version read from and why this table was empty: nothing has been
  // deployed yet, so that table has no rows. PostHog has 470 events with cities and
  // both clocks already in them.
  //
  // classifyVisit() holds the rule. It lives in lib/visit-trust.ts as a pure
  // function because it cannot be exercised from a development machine — the
  // sandbox cannot reach PostHog — so it is guarded as arithmetic instead.
  const classified = groups
    .map((g) => ({ group: g, trust: classifyVisit(g) }))
    // Collapse identical (place, confidence) pairs. This is the point of the design:
    // eight VPN cities with the same masked time zone become one row that says what
    // it is, rather than eight rows that each imply a reader.
    .reduce<Map<string, { place: string; confidence: Confidence; visits: number }>>((acc, { group, trust }) => {
      const key = `${trust.confidence}|${trust.place}`;
      const prev = acc.get(key);
      if (prev) prev.visits += group.visits;
      else acc.set(key, { place: trust.place, confidence: trust.confidence, visits: group.visits });
      return acc;
    }, new Map());

  const placeRows = Array.from(classified.values())
    .sort((a, b) => b.visits - a.visits)
    .map((r) => ({ label: r.place, n: r.visits, flag: CONFIDENCE_LABEL[r.confidence] }));

  const confidenceCounts = Array.from(classified.values()).reduce<Partial<Record<Confidence, number>>>(
    (acc, r) => ({ ...acc, [r.confidence]: (acc[r.confidence] ?? 0) + r.visits }),
    {},
  );
  const confirmed = confidenceCounts.confirmed ?? 0;

  const bots = t ? automated(t.traffic) : { bots: 0, total: 0 };
  // Downloads: our own table once the logging is deployed, PostHog until then.
  // ALL-TIME TOTAL, not the author-excluded figure.
  //
  // This tile read 0 for weeks while 18 downloads sat in PostHog, because it showed
  // the count after the internal-traffic filter and every one of those downloads was
  // excluded by it. A transparency page whose download counter says nothing while
  // downloads have happened is worse than one that counts the author: the first is
  // read as "nobody wants this", which is a different and false claim.
  //
  // Sean, 27 September, after three rounds of this: "I need to see those corpus
  // downloads there." So the number shown is every download recorded, and the
  // caption says whose. The page-level "all time" line says the same for every
  // figure on the page.
  const downloads = t?.downloadsAll || d.downloadRows || 0;

  return (
    <>
      <Header />

      <main className="w-full max-w-[1400px] mx-auto px-4 py-14 sm:px-6">
        {/* The caveat, once, on the face of the page rather than only behind a link.
            Dismissible per device; "How this is measured" also lives permanently at
            the foot of the page, so dismissing removes the banner and not the
            explanation. */}
        <MeasurementAlert />

        <div className="flex flex-wrap items-baseline gap-3">
          <div>
            <p className="font-display m-0 text-[11px] uppercase tracking-[0.16em] text-muted">Measurement</p>
            <h1 className="font-display mt-2 text-[32px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[40px]">
              What this site can see
            </h1>
            {/* Stated once, governing every figure below, rather than repeated per
                tile — and deliberately not a date-range control. Sean: "We're not
                going to include a date range filter. It just needs to say all time." */}
            <p className="font-display m-0 mt-3 text-[12px] uppercase tracking-[0.14em] text-muted">
              {range === "all"
                ? "All time \u00b7 every figure since the site launched"
                : `${RANGES[range].label} \u00b7 every figure on this page`}
            </p>
          </div>
        </div>

        <InsightsControls source={source} range={range} />

        {source === "ga" ? (
          ga ? (
            <>
              {/* GA's own numbers, unfiltered by nature. Deliberately a different set
                  from the PostHog tiles: GA has no author exclusion to offer and
                  cannot produce a confirmed-location figure, so pretending to the same
                  four tiles would imply a parity that does not exist. */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile n={ga.sessions} label="Sessions" sub="author included" />
                <Tile n={ga.users} label="Users" sub="distinct browsers" />
                <Tile n={ga.views} label="Pages viewed" sub="author included" />
                <Tile
                  n={ga.downloads}
                  label="Corpus downloads"
                  sub={ga.downloads > 0 ? "server-reported" : "from 28 Sep onward"}
                />
              </div>

              <section className="mt-10">
                <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
                  <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
                    Visits per day
                  </h2>
                  <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">
                    {RANGES[range].label.toLowerCase()}
                  </span>
                </div>
                <TrafficChart
                  series={[{ key: "ga", label: "Google Analytics", points: ga.series, dashed: true }]}
                  note="Google Analytics counts every visit, the author&rsquo;s included. There is no author exclusion on this figure, and GA recorded no corpus downloads before 28 September because the download is confirmed on the server, which its browser tag cannot see."
                />
              </section>

              <Table title="Pages viewed" unit="views" rows={ga.pages} />

              <p className="mt-10 max-w-3xl border-t border-edge pt-4 text-[13px] leading-relaxed text-muted">
                Locations and relay detection are not shown here. Those depend on comparing
                the address&rsquo;s time zone against the device&rsquo;s own clock, and Google
                Analytics does not publish either signal through its API &mdash; so on this tab
                a city could not be marked as a reader&rsquo;s or a VPN&rsquo;s. They are on the
                PostHog tab, where both signals exist.
              </p>
            </>
          ) : (
            <GooglePanel />
          )
        ) : (
          <>
        {!t ? (
          <p className="mt-8 border border-edge p-4 text-[15px] text-muted">
            Visit counts are not connected in this environment.
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile n={t.visits} label="Visits" sub={`${nf.format(t.visits30)} in 30 days`} />
              <Tile
                n={confirmed}
                label="Confirmed location"
                sub="clocks agree, address precise"
              />
              <Tile n={t.views} label="Pages viewed" sub={`${nf.format(t.views30)} in 30 days`} />
              <Tile
                n={downloads}
                label="Corpus downloads"
                sub={
                  t.downloads > 0
                    ? `${nf.format(t.downloads)} not the author\u2019s`
                    : "author included \u2014 see notes"
                }
              />
            </div>

            {/* VISITS OVER TIME, replacing the confidence donut.
                The donut answered "what share of traffic can be believed", a fair
                question but a static one. Sean's actual question is whether anyone is
                arriving, which is a question about time — a ring cannot show a
                marketing push landing and a line can. The confidence breakdown did
                not disappear: it is the flag on every row of the locations table. */}
            <section className="mt-10">
              <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
                <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
                  Visits per day
                </h2>
                <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">
                  {RANGES[range].label.toLowerCase()}
                </span>
              </div>
              <TrafficChart
                series={[
                  ...(showPh ? [{ key: "ph", label: "PostHog", points: phSeries }] : []),
                  ...(showGa && ga
                    ? [{ key: "ga", label: "Google Analytics", points: ga.series, dashed: true }]
                    : []),
                ]}
                note={
                  showPh && showGa && ga
                    ? "The two lines are not measuring the same population, and the gap is not a dispute about arithmetic. PostHog\u2019s figures have the author, preview deployments and non-production hosts filtered out; Google Analytics has nothing filtered, so it counts the author too \u2014 which on this site is most of the traffic so far. Read the shapes rather than the levels: a real arrival should lift both."
                    : showGa && !showPh && ga
                      ? "Google Analytics counts every visit, the author\u2019s included. There is no author exclusion on this line."
                      : "Author, preview deployments and non-production hosts are excluded from this line."
                }
              />
            </section>

            <Table
              title="Pages viewed"
              unit="views"
              rows={t.pages}
              note={
                bots.total > 0
                  ? `${nf.format(bots.bots)} of ${nf.format(bots.total)} page views were classified as automated — crawlers and link scanners rather than readers.`
                  : undefined
              }
            />

          </>
        )}

        {/* WHERE VISITS CAME FROM. One list, a confidence label on every row.
            Sean, 27 Sep: "it really is as simple as whether or not the location is
            from a VPN or not." Three earlier versions overshot that — a mixed ranked
            list with tiny labels, then deleting the VPN cities for a bare count, then
            a separate section. The label was always the whole requirement.

            What must never come back is an unflagged row: a city with no label
            asserts a reader is there, and for a relay that is false. A relayed row
            shows a TIME ZONE rather than a city, because the zone is true and the
            city is not — the precision the VPN removed is not re-invented here. */}
        <Table
          title="Where visits came from"
          unit="visits"
          rows={placeRows}
          note="Every row says how much it can be trusted. Confirmed means the device&rsquo;s own clock agreed with its network address and the address was precise, so the visit came from that place. Relay detected means a VPN or proxy sat in between: the row shows the device&rsquo;s time zone, because the city belongs to the relay and no tool recovers the real one. Confirmed detects relays that cross a time zone — a VPN exit inside the reader&rsquo;s own zone would still read as confirmed, which is what network labelling would catch."
        />

        {/* IP ROTATION. Sean spotted this before it was measured: a visit that
            arrives in one city and leaves from another. The clock comparison above
            INFERS a relay; this OBSERVES one, and needs no explanation of time zones
            to land — nobody travels from Denver to Secaucus mid-session.

            Kept as its own short section rather than folded into the table above,
            because a row here is one visit across two places, while a row up there is
            one place across many visits. Merging them would mean inventing a shape
            that is neither. */}
        {shuffled.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
              <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
                Visits whose location changed part-way through
              </h2>
              <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">
                {shuffled.length} {shuffled.length === 1 ? "visit" : "visits"}
              </span>
            </div>
            <ul className="m-0 list-none p-0">
              {shuffled.map((v, i) => {
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
                          {moved ? `shuffled \u00b7 ${v.cities} cities` : "address rotated"}
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
              <strong className="font-normal text-foreground/85">IP rotation</strong>: a VPN client
              switching server mid-session, a rotating proxy, Apple&rsquo;s iCloud Private Relay
              reassigning an egress, a Tor circuit rebuilding, or a phone moving between carrier
              gateways. Nobody travels between these cities inside one visit, so the places named are
              the network&rsquo;s and not the reader&rsquo;s. This is the most conclusive evidence of
              a relay the site has \u2014 the clock comparison above infers one, this observes it.
            </p>
          </section>
        )}

        {d.countries.length > 0 && (
          <Table title="Downloads by country" unit="downloads" rows={d.countries.map((c) => ({ label: c.country, n: c.n }))} />
        )}
        {d.roles.length > 0 && (
          <Table
            title="Who says they are reading"
            unit="answers"
            rows={d.roles.map((r) => ({ label: r.visitor_role, n: r.n }))}
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

        <StandingDisclaimer className="mt-10 max-w-3xl" />

        <OptOutSection />
      </main>

      <Footer />
    </>
  );
}

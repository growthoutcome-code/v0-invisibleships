import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementNotes from "@/components/MeasurementNotes";
import StandingDisclaimer from "@/components/StandingDisclaimer";
import { getInsights } from "@/lib/insights";
import { getTraffic, getVisitGroups, getShuffledVisits, automated, type Row } from "@/lib/insights-posthog";
import { classifyVisit, CONFIDENCE_LABEL, type Confidence } from "@/lib/visit-trust";
import ConfidenceDonut from "@/components/ConfidenceDonut";
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

export const revalidate = 300;

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

export default async function Page() {
  const [d, t, groups, shuffled] = await Promise.all([
    getInsights(),
    getTraffic(),
    getVisitGroups(),
    getShuffledVisits(),
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
  const downloads = d.downloadRows || t?.downloads || 0;

  return (
    <>
      <Header />

      <main className="w-full max-w-[1400px] mx-auto px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-display m-0 text-[11px] uppercase tracking-[0.16em] text-muted">Measurement</p>
            <h1 className="font-display mt-2 text-[32px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[40px]">
              What this site can see
            </h1>
          </div>
          <MeasurementNotes>
            <button
              type="button"
              className="font-display text-[12px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
            >
              How this is measured
            </button>
          </MeasurementNotes>
        </div>

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
              <Tile n={downloads} label="Corpus downloads" sub="server-confirmed" />
            </div>

            <section className="mt-10">
              <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
                <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
                  How much of this can be believed
                </h2>
                <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">visits</span>
              </div>
              <ConfidenceDonut counts={confidenceCounts} />
              <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">
                Every visit carries two independent location signals: one derived from the network
                address, one reported by the device&rsquo;s own clock. A VPN changes the first and not
                the second, so when they disagree the city belongs to a relay rather than a reader.
                That is what separates these four groups.
              </p>
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

        <StandingDisclaimer className="mt-12 max-w-3xl" />

        <OptOutSection />
      </main>

      <Footer />
    </>
  );
}

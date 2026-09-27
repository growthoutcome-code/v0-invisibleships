import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementNotes from "@/components/MeasurementNotes";
import StandingDisclaimer from "@/components/StandingDisclaimer";
import { getInsights, splitLocations } from "@/lib/insights";
import { getTraffic, automated, type Row } from "@/lib/insights-posthog";
import { asnDatasetAvailable } from "@/lib/asn";

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
  flag,
}: {
  title: string;
  rows: Row[];
  unit: string;
  note?: string;
  flag?: (label: string) => string | null;
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
            const f = flag ? flag(r.label) : null;
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
  const [d, t] = await Promise.all([getInsights(), getTraffic()]);
  // Whether the ASN dataset shipped with this deployment. Drives the wording under
  // the locations table, so a build with no dataset explains its own blank labels
  // instead of looking broken.
  const networkLabelsLive = asnDatasetAvailable();

  // GEOGRAPHY IS SPLIT, NOT MIXED AND FLAGGED.
  //
  // The first version of this table listed every location with a per-row label.
  // That satisfied the rule and still produced the wrong object: a ranked list in
  // which some rows are places readers are and others are places servers are, with
  // the reader left to do the sorting. Sean, 26 September: "I don't want a list of
  // locations that are VPN touchpoints. I just want to know the country, the locale
  // that the visit came from, legitimately."
  //
  // So the untrustworthy rows do not appear as locations at all. They are counted,
  // and the count is published, but they are not given a city — because we do not
  // know their city, and printing the exit node's is answering a question nobody
  // asked. What cannot be placed is reported as a number, not as a place.
  //
  // No reader is dropped: placed + overVpn + unclassified is every row the view
  // returns. A visit that cannot be located still counts as a visit.
  const { placed: placedRows, exitNodes, unclassified } = splitLocations(d.locations);
  const bots = t ? automated(t.traffic) : { bots: 0, total: 0 };
  // Downloads: our own table once the logging is deployed, PostHog until then.
  const downloads = d.downloadRows || t?.downloads || 0;

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
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
              <Tile n={t.visitors} label="Visitors" sub="distinct browsers" />
              <Tile n={t.views} label="Pages viewed" sub={`${nf.format(t.views30)} in 30 days`} />
              <Tile n={downloads} label="Corpus downloads" sub="server-confirmed" />
            </div>

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

        {/* LOCATIONS, with a network label on every row and no exceptions.
            Sean, 26 September: "I absolutely do not want an analytics page with
            locations on it that cite VPN touchpoints without a VPN label." The
            table was withheld for a day for exactly that reason; it returns now
            because each row carries one of three labels, classified server-side
            from a local ASN dataset and stored as the label rather than as an
            address. The rows come from gate_events rather than from PostHog page
            views, because PostHog resolves geography from a city database with no
            network data in it and never returns the address, so a PostHog city
            cannot be labelled at all. */}
        <Table
          title="Where readers are"
          unit="readers"
          rows={placedRows}
          note={
            networkLabelsLive
              ? "Every row here came over a network with no VPN or datacenter provider behind it, so the place is the reader\u2019s own. That is a detection, not a guarantee: it means no such provider matched, which is not the same as proof that none was used. The check runs in memory against a dataset on this site\u2019s own servers \u2014 the address is never sent anywhere and never stored."
              : "Empty because the network dataset is not loaded in this deployment, so no visit can be confirmed as coming from the reader\u2019s own connection. Every visit is counted below instead. Nothing here is a guess."
          }
        />

        {/* The same city data, kept out of the audience ranking and named for what
            it is. Not a bare count: Sean wants to see that a visit came through an
            Amsterdam exit node, he just needs Amsterdam unmistakably marked as a
            server rather than a reader. A separate section does that; a label
            inside the list above did not. */}
        {exitNodes.length > 0 && (
          <Table
            title="Seen over VPN or datacenter networks"
            unit="visits"
            rows={exitNodes}
            note="These are exit nodes, not reader locations. The place named is where the VPN or datacenter server is; the reader could be anywhere. They are listed separately from the figures above for that reason, and counted in every total on this page. No tool recovers the real location from a request \u2014 the only address the site ever receives is the exit node\u2019s \u2014 so the site shows what it saw and does not guess past it."
          />
        )}

        {unclassified > 0 && (
          <div className="mt-4 border border-edge p-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] text-foreground">Network could not be identified</span>
              <span className="font-display text-[15px] tabular-nums text-foreground">
                {nf.format(unclassified)}
              </span>
            </div>
            <p className="m-0 mt-3 text-[13px] leading-relaxed text-muted">
              Counted in every total, and given no location because none can be stood behind. Either
              the classification dataset is not loaded in this deployment, or the address was one it
              does not cover.
            </p>
          </div>
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

        <StandingDisclaimer className="mt-12" />
      </main>

      <Footer />
    </>
  );
}

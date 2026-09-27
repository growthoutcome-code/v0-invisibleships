import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementNotes from "@/components/MeasurementNotes";
import StandingDisclaimer from "@/components/StandingDisclaimer";
import { getInsights, locationRows } from "@/lib/insights";
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
  // A row may carry its own flag. Preferred over the callback below, which had to
  // rebuild the label and match on the string — so any formatting change silently
  // dropped every flag, and for the locations table a dropped flag is the one
  // failure that must not happen.
  rows: (Row & { flag?: string })[];
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
            const f = r.flag ?? (flag ? flag(r.label) : null);
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
  const places = locationRows(d.locations);
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

        {/* LOCATIONS: one list, a VPN label on every row, no exceptions.
            Sean, 27 Sep: "it really is as simple as whether or not the location is
            from a VPN or not." Two earlier versions overshot that — one removed the
            VPN cities entirely, one gave them a second section — and both solved a
            problem the label already answers. What must never come back is an
            unflagged row: a city with no label asserts a reader is there, which for
            an exit node is false.

            Rows come from gate_events, not PostHog page views: PostHog resolves
            geography from a city database with no network data and never returns
            the address, so a PostHog city cannot be labelled at all.

            A filter for non-VPN cities only is the obvious next step and is
            deliberately not built ("I don't think we need to yet"). The flag is
            already the data it would need. */}
        <Table
          title="Where visits came from"
          unit="visits"
          rows={places}
          note={
            networkLabelsLive
              ? "Every row says whether it is a VPN. \u201cVPN or datacenter\u201d means the address belongs to such a provider, so the place named is the server\u2019s and not the reader\u2019s \u2014 the reader could be anywhere, and no tool recovers where. \u201cNot a VPN\u201d means no such provider matched, which is a detection rather than a guarantee. The check runs in memory against a dataset on this site\u2019s own servers; the address is never sent anywhere and never stored."
              : "Every row reads \u201cnetwork unknown\u201d because the classification dataset is not loaded in this deployment. Rather than name cities that may be VPN exits without saying so, the page says it does not know which are which."
          }
        />

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

import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MeasurementNotes from "@/components/MeasurementNotes";
import StandingDisclaimer from "@/components/StandingDisclaimer";
import { getInsights } from "@/lib/insights";
import { getTraffic, automated, type Row } from "@/lib/insights-posthog";

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

            <Table title="Pages viewed" unit="views" rows={t.pages} />

            <Table
              title="Where from"
              unit="visits"
              rows={t.places}
              flag={(label) => (/unknown/i.test(label) ? "unresolved" : null)}
              note={
                bots.total > 0
                  ? `${nf.format(bots.bots)} of ${nf.format(bots.total)} page views were classified as automated — crawlers and link scanners rather than readers. Location is resolved at the network edge; a visitor using a VPN resolves to the VPN's city, not their own.`
                  : undefined
              }
            />
          </>
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

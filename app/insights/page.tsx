import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getInsights, FUNNEL_STEPS } from "@/lib/insights";
import { getTraffic } from "@/lib/insights-posthog";
import StandingDisclaimer from "@/components/StandingDisclaimer";

/**
 * The public measurement page.
 *
 * Sean, 26 September: "it's just going to share data... I don't mind sharing it
 * with people. Later we may have anonymous surveys and I want that data to be
 * transparent to the people visiting the site."
 *
 * That decision changes what this page has to be. A private dashboard can be
 * approximate and unexplained. A public one is a claim the site is making about
 * itself, on an archive whose entire argument is that its numbers resolve to a
 * source — so every number here is stated with what it excludes, and the page
 * says what is recorded about a reader before it says anything about counts.
 *
 * `noindex` for now, deliberately: it is linked from the footer and reachable by
 * anyone, but it does not belong in a search result for the archive while it
 * still looks like this. Remove the robots line when it earns its place.
 *
 * Revalidated every five minutes rather than per request: a public page that
 * queries the database on every hit is a denial-of-service lever pointed at your
 * own database.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: "What this site can see — Invisible Ships",
  description:
    "Every measurement this site takes, what it excludes, and what is never recorded about a reader.",
  alternates: { canonical: "/insights" },
  robots: { index: false, follow: false },
};

function Stat({ n, label, note }: { n: number | string; label: string; note?: string }) {
  return (
    <div className="border border-edge p-4">
      <div className="font-display text-3xl font-semibold text-foreground">{n}</div>
      <div className="font-display mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
      {note && <div className="mt-1 text-[13px] leading-snug text-muted">{note}</div>}
    </div>
  );
}

function Rows({ rows, empty }: { rows: { label: string; n: number }[]; empty: string }) {
  if (!rows.length) return <p className="text-[15px] text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <ul className="m-0 list-none p-0">
      {rows.map((r) => (
        <li key={r.label} className="border-b border-edge py-2 last:border-b-0">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[15px] text-foreground">{r.label}</span>
            <span className="font-display text-[15px] text-foreground">{r.n}</span>
          </div>
          {/* A bar rather than a chart library: one number per row, so the bar is
              the whole visualisation and a dependency would earn nothing. */}
          <div className="mt-1 h-[3px] w-full bg-edge">
            <div className="h-full bg-foreground" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;

export default async function Page() {
  const [d, traffic] = await Promise.all([getInsights(), getTraffic()]);
  const step = (event: string) => d.funnel.find((f) => f.event === event)?.n ?? 0;
  const started = fmtDate(d.firstGateEvent);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <p className="font-display text-[11px] uppercase tracking-[0.16em] text-muted">Measurement</p>
      <h1 className="font-display mt-2 text-[32px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[40px]">
        What this site can see
      </h1>

      <p className="mt-6 font-serif text-lg leading-snug text-foreground/85">
        This archive asks readers to take its sourcing seriously, so it publishes its own. Everything
        this site records about a visit is on this page, in the same numbers the author sees. There is
        no second, better dashboard behind it.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">What is never recorded</h2>
        <ul className="mt-3 list-disc pl-5 text-[15px] leading-relaxed text-foreground/85">
          <li>No name, no account, no email. There is nothing to sign in to.</li>
          <li>
            No IP address. The download endpoint has never forwarded one, and none is stored in any
            table. Country comes from the network edge, which resolves it without the address
            travelling.
          </li>
          <li>No cursor tracking, no scroll heatmaps, no advertising or data-broker tags of any kind.</li>
          <li>
            The answer to the gate question is not attached to a person. It is a count, and it is
            unverified — anyone can pick anything.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Who is not counted</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
          The author&rsquo;s own devices, every preview deployment, local development, and any reader who
          has opted out. An archive whose traffic number counts its own author is telling you nothing;
          these exclusions are why the figures below are small, and they are the point.
        </p>
      </section>

      {!d.configured ? (
        <p className="mt-10 border border-edge p-4 text-[15px] text-muted">
          Measurement is not switched on in this environment, so there is nothing to show. This is the
          normal state when the page is run locally.
        </p>
      ) : d.gateRows === 0 && d.downloadRows === 0 ? (
        <p className="mt-10 border border-edge p-4 text-[15px] text-muted">
          Nothing has been recorded yet. Measurement of the gate began the day this page shipped, and
          no visit by anyone other than the author has been logged since. That is an honest zero, not a
          missing number.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Visits</h2>
        {traffic ? (
          <>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
              A visit is one session: everything a person does in a single sitting. All three windows
              are here because they do not mean the same thing, and the difference is the most honest
              thing on this page.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat n={traffic.visitsAll} label="Visits" note="all time, from 31 July 2026" />
              <Stat n={traffic.viewsAll} label="Pages read" note="all time" />
              <Stat n={traffic.visits30d} label="Visits" note="last 30 days" />
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              The exclusions apply backwards as well as forwards: they match on network and hostname,
              so the author&rsquo;s own sessions are removed from the whole history, not only from the
              day the filters were written. Two things they cannot remove. A crawler that renders
              pages counts as a visit here. And a session of the author&rsquo;s from a network not on
              the list &mdash; a hotel, a hotspot, a new VPN exit &mdash; counts too; at least one is
              known to have done so.
            </p>
          </>
        ) : (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Visit counts are not connected in this environment. They come from the site&rsquo;s analytics
            with the author&rsquo;s own networks filtered out, and appear here when that connection is
            configured.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">The gate</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
          Everyone who arrives meets a notice before the archive: the content warning, a note on
          perceptual set, and the Critical Disclaimer in full.{" "}
          {started ? <>Counting began {started}.</> : null}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FUNNEL_STEPS.map((s) => (
            <Stat key={s.event} n={step(s.event)} label={s.label} note={s.note} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Who says they are reading</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
          Optional, anonymous, unverified, and not a census — the people most worth hearing from are
          the least likely to identify themselves on an archive about covert harassment. Published
          because a reader is entitled to the same view of this as the author has.
        </p>
        <div className="mt-4">
          <Rows
            rows={d.roles.map((r) => ({ label: r.visitor_role, n: r.n }))}
            empty="No one has answered the question yet."
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">The corpus</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
          The whole archive can be downloaded as a single file. This counts transfers the server
          confirmed, which is not the same as readers: a crawler taking the file counts here too, and
          some of these will be exactly that.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat n={d.downloadRows} label="Downloads" note="server-confirmed transfers" />
          <Stat
            n={d.countries.length || "—"}
            label="Countries"
            note="resolved at the network edge, no address stored"
          />
        </div>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-[13px] uppercase tracking-[0.14em] text-muted">By country</h3>
            <div className="mt-2">
              <Rows rows={d.countries.map((c) => ({ label: c.country, n: c.n }))} empty="No downloads yet." />
            </div>
          </div>
          <div>
            <h3 className="font-display text-[13px] uppercase tracking-[0.14em] text-muted">By week</h3>
            <div className="mt-2">
              <Rows rows={d.weeks.map((w) => ({ label: w.week, n: w.n }))} empty="No downloads yet." />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">Why this page exists</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
          Because an archive that documents being watched should not quietly watch its own readers.
          Anything it does record, it publishes here. If a future survey is added, its results will
          appear on this page in the same form: aggregate, anonymous, and unverified, next to what it
          excludes.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
          The measurement policy itself is part of the terms, under{" "}
          <Link href="/disclaimer" className="underline underline-offset-4">
            what this site measures
          </Link>
          .
        </p>
      </section>

        <StandingDisclaimer className="mt-12" />
      </main>

      <Footer />
    </>
  );
}

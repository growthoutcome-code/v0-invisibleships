import { NextResponse } from "next/server";
import { serverDb } from "@/lib/server-log";
import { getTraffic } from "@/lib/insights-posthog";
import { getGaTraffic } from "@/lib/insights-ga";

/**
 * The two numbers the footer shows, as JSON.
 *
 * Why an endpoint rather than props: components/Footer.tsx is a client component
 * mounted on every page, including inside the app shell, so there is no single
 * server boundary to pass a count through. One small cached request is cheaper
 * than making the footer a server component and threading it everywhere.
 *
 * PUBLIC ON PURPOSE, and safe to be: it returns two integers and a date, read
 * from the `insights_*` views, which exclude author-marked rows. There is no
 * row-level data here and nothing that identifies anybody.
 *
 * Cached for five minutes at the edge, so a busy day cannot turn the footer into
 * a load test against the database.
 */

export const revalidate = 300;

export async function GET() {
  const db = serverDb();
  const body = {
    visits: 0,
    downloads: 0,
    since: null as string | null,
    // "all" when the number is real sessions from analytics, "gate" when it is
    // falling back to how many people met the gate. The footer says which.
    window: "gate" as "all" | "gate",
    // Which tool answered. The footer needs this because the three sources do not
    // count the same population — see below.
    source: "gate" as "ga" | "posthog" | "gate",
    ok: false,
  };

  // GOOGLE FIRST, THEN POSTHOG, THEN THE GATE COUNTER.
  //
  // Sean, 29 September: "maybe use the GA data to replace the 22 visits." PostHog
  // was reporting 22 where Google reported 150, and a footer on every page of the
  // site showing the smaller number read as a site nobody visits.
  //
  // The two are not measuring the same thing and Google is not the more accurate
  // one: PostHog applies the author exclusion and Google cannot, so most of the gap
  // is Sean's own visits. Google leads here for the same reason it leads the tabs on
  // /insights — it will not silently drop real readers, and it is the figure anyone
  // else would quote. The cost is paid in the footer's own words, which say the
  // count includes everyone.
  //
  // The order is also a graceful degradation: Google needs a service-account key,
  // PostHog needs a personal API key, and the gate counter needs only our own
  // database, so the footer keeps working as each one goes missing.
  const ga = await getGaTraffic("all");
  if (ga) {
    body.visits = ga.sessions;
    body.window = "all";
    body.source = "ga";
    body.ok = true;
  }

  const traffic = ga ? null : await getTraffic();
  if (traffic) {
    body.visits = traffic.visits;
    body.window = "all";
    body.source = "posthog";
    body.ok = true;
  }

  if (db) {
    const [funnel, meta] = await Promise.all([
      db.from("insights_gate_funnel").select("event, n"),
      db.from("insights_meta").select("*").maybeSingle(),
    ]);
    const opened = (funnel.data ?? []).find((r) => r.event === "gate_opened");
    if (!ga && !traffic) body.visits = Number(opened?.n ?? 0);
    body.downloads = Number(meta.data?.download_rows ?? 0);
    body.since = meta.data?.first_gate_event ?? null;
    body.ok = body.ok || (!funnel.error && !meta.error);
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

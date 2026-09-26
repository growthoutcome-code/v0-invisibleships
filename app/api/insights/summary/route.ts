import { NextResponse } from "next/server";
import { serverDb } from "@/lib/server-log";

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
  const body = { visits: 0, downloads: 0, since: null as string | null, ok: false };

  if (db) {
    const [funnel, meta] = await Promise.all([
      db.from("insights_gate_funnel").select("event, n"),
      db.from("insights_meta").select("*").maybeSingle(),
    ]);
    const opened = (funnel.data ?? []).find((r) => r.event === "gate_opened");
    body.visits = Number(opened?.n ?? 0);
    body.downloads = Number(meta.data?.download_rows ?? 0);
    body.since = meta.data?.first_gate_event ?? null;
    body.ok = !funnel.error && !meta.error;
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

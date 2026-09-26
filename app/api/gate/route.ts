import { NextResponse } from "next/server";
import { ROLES } from "@/lib/gate";
import { serverDb, excludedRequest, clientHash, geoFromHeaders, isAuthorRequest } from "@/lib/server-log";

/**
 * Records one step of the entry gate into public.gate_events.
 *
 * The client fires its PostHog event and calls this route at the same moment.
 * Neither waits for the other and neither is allowed to fail loudly: a reader
 * meeting a consent screen must never see an analytics error, and a database
 * outage must never stop somebody entering the archive. Every path here returns
 * 204, including the refusals — the body would tell a caller what it takes to
 * get a row written, which is not a thing this route should teach.
 *
 * WHAT GETS REFUSED, and it is deliberately more than the client checks:
 * anything that is not the production host (so previews and localhost write
 * nothing), a reader carrying PostHog's opt-out cookie, and a referer from a
 * development host. The client skips the call when analytics are disabled, but
 * a server route cannot see localStorage and must not trust a caller to police
 * itself.
 *
 * `visitor_role` is validated against the ROLES allowlist rather than stored as
 * given. An open text column reachable from the public internet is an invitation
 * to write something into it that nobody meant to store.
 */

const EVENTS = ["gate_opened", "role_selected", "role_declined", "entered"] as const;
type GateEvent = (typeof EVENTS)[number];

function isEvent(v: unknown): v is GateEvent {
  return typeof v === "string" && (EVENTS as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (excludedRequest(request, url.hostname)) return new NextResponse(null, { status: 204 });

  const db = serverDb();
  if (!db) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const event = body.event;
  if (!isEvent(event)) return new NextResponse(null, { status: 204 });

  // Only role_selected carries a role, and only one of the known six. Anything
  // else is dropped rather than stored as an oddity to puzzle over later.
  const claimed = typeof body.visitor_role === "string" ? body.visitor_role : null;
  const visitor_role =
    event === "role_selected" && claimed && (ROLES as readonly string[]).includes(claimed)
      ? claimed
      : null;
  if (event === "role_selected" && !visitor_role) return new NextResponse(null, { status: 204 });

  const geo = geoFromHeaders(request.headers);
  const path = typeof body.path === "string" ? body.path.slice(0, 300) : null;
  const gate_version = typeof body.gate_version === "string" ? body.gate_version.slice(0, 16) : "v2";

  // Awaited, unlike the fire-and-forget capture in /api/corpus: this route has
  // nothing else to do and the client is not waiting on the response either way.
  const { error } = await db.from("gate_events").insert({
    event,
    visitor_role,
    gate_version,
    path,
    client_hash: clientHash(request.headers.get("cookie")),
    is_author: isAuthorRequest(request.headers.get("cookie")),
    ...geo,
  });
  if (error) console.error("[gate-log] insert failed", error.message);

  return new NextResponse(null, { status: 204 });
}

// GET /api/chat-status — availability + this visitor's remaining allowance.
// The Chat tab calls this on load to render the meter and, if the day's limit
// is reached, the disabled state (which points to the library + corpus download).
// Providers are returned for the "resting" display; there is no user-facing
// picker (selection is automatic/random server-side).

import { supabase, IP_PER_DAY, clientIp, ipHash, json } from "@/lib/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const iph = ipHash(clientIp(req));
  const { data, error } = await supabase.rpc("chat_status", {
    p_ip_hash: iph,
    p_ip_per_day: IP_PER_DAY,
  });
  if (error) return json({ error: "status_failed" }, 500);
  return json({ ...data, enabled: process.env.AI_CHAT_ENABLED === "true", ip_per_day: IP_PER_DAY });
}


// Server-side helpers shared by the API routes: Supabase service client,
// IP hashing (privacy), Turnstile verify.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const IP_PER_DAY = Number(process.env.RL_IP_PER_DAY ?? "40");

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0].trim() || "unknown";
}

// Never store raw IPs. Hash with a server-side salt for per-day counting + logs.
export function ipHash(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "invisible-ships";
  return crypto.createHash("sha256").update(salt + ip).digest("hex");
}

export function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}
export function questionHash(q: string): string {
  return crypto.createHash("sha256").update(normalize(q)).digest("hex");
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured (dev) → allow
  const form = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return !!data.success;
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}


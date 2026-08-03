// POST /api/ask — RAG pipeline with multi-provider generation, per-visitor +
// per-provider metering, random ("auto") provider selection, and failover.
//
// Response is either JSON (cache hit / limit / no-result) or an ndjson stream:
//   {type:"meta", provider, mode, ip_remaining, provider_remaining}
//   {type:"citations", citations:[...]}
//   {type:"text", text:"..."}   (many)
//   {type:"error"}              (on mid-stream failure)
//
// Cache + library answers are served EVEN WHEN all providers are capped, so the
// chat still answers known questions when it's otherwise "closed".

import { PROVIDERS, ProviderId, embedText, generateStream, providerLabel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT, buildUserMessage, toCitations } from "@/lib/ai/prompt";
import {
  supabase, IP_PER_DAY, clientIp, ipHash, questionHash, verifyTurnstile, json,
} from "@/lib/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: ProviderId[] = Object.keys(PROVIDERS) as ProviderId[];

async function logQuestion(fields: {
  question: string; outcome: string; provider?: string | null;
  answer?: string | null; citations?: unknown; ip_hash: string;
}) {
  try {
    await supabase.from("question_log").insert({
      question: fields.question,
      outcome: fields.outcome,
      provider: fields.provider ?? null,
      answer: fields.answer ?? null,
      citations: fields.citations ?? [],
      ip_hash: fields.ip_hash,
    });
  } catch { /* logging is best-effort */ }
}

export async function POST(req: Request) {
  if (process.env.AI_CHAT_ENABLED !== "true")
    return json({ error: "disabled", message: "The assistant is resting." }, 503);

  let body: { question?: string; provider?: string; turnstileToken?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  const question = (body.question ?? "").trim();
  if (question.length < 3 || question.length > 500)
    return json({ error: "bad_question" }, 400);

  const ip = clientIp(req);
  const iph = ipHash(ip);

  if (!(await verifyTurnstile(body.turnstileToken ?? "", ip)))
    return json({ error: "turnstile_failed" }, 403);

  // 1) exact cache — served even when providers are capped
  const qHash = questionHash(question);
  const { data: exact } = await supabase
    .from("qa_cache").select("answer, citations, provider")
    .eq("question_hash", qHash).maybeSingle();
  if (exact) {
    await logQuestion({ question, outcome: "cached", provider: exact.provider, ip_hash: iph });
    return json({ answer: exact.answer, citations: exact.citations, provider: exact.provider, cached: true });
  }

  // 2) embed (fixed Gemini) — needed for semantic cache + retrieval
  let qVec: number[];
  try { qVec = await embedText(question); }
  catch { await logQuestion({ question, outcome: "error", ip_hash: iph }); return json({ error: "embed_failed" }, 502); }

  // 3) semantic cache
  const { data: sem } = await supabase.rpc("match_cached_answer", { query_embedding: qVec, threshold: 0.97 });
  if (sem && sem[0]) {
    await logQuestion({ question, outcome: "cached", ip_hash: iph });
    return json({ answer: sem[0].answer, citations: sem[0].citations, cached: true });
  }

  // 4) availability snapshot (read-only) — gate before consuming anything
  const { data: status } = await supabase.rpc("chat_status", { p_ip_hash: iph, p_ip_per_day: IP_PER_DAY });
  if (status?.ip_remaining === 0) {
    await logQuestion({ question, outcome: "rate_limited", ip_hash: iph });
    return json({ error: "rate_limited", message: "You've used today's questions. Browse past answers below, or download the full corpus to keep exploring." }, 429);
  }
  if (!status?.open) {
    await logQuestion({ question, outcome: "budget", ip_hash: iph });
    return json({ error: "budget_reached", message: "The assistant has reached today's limit. Browse past answers below, or download the full corpus." }, 429);
  }

  // 5) retrieval (provider-independent) — no budget consumed yet
  const { data: docs, error: rErr } = await supabase.rpc("match_documents", {
    query_embedding: qVec, query_text: question, match_count: 8, exclude_day_entries: true,
  });
  if (rErr) return json({ error: "retrieval_failed" }, 500);
  if (!docs || docs.length === 0) {
    await logQuestion({ question, outcome: "no_result", ip_hash: iph });
    return json({ answer: "The archive doesn't cover that.", citations: [] });
  }
  const citations = toCitations(docs);
  const userMsg = buildUserMessage(question, docs);

  // 6) provider selection: manual id, or "auto" random among available
  const requested = (body.provider ?? "auto").toLowerCase();
  const mode: "manual" | "auto" = VALID.includes(requested as ProviderId) ? "manual" : "auto";
  const available: string[] = (status.providers ?? [])
    .filter((p: any) => p.available).map((p: any) => p.id);
  let preferred: string | null;
  if (mode === "manual") preferred = requested;
  else preferred = available.length ? available[Math.floor(Math.random() * available.length)] : null;

  // 7) reserve + start generation, with failover across providers
  const exclude: string[] = [];
  let chosen: string | null = null;
  let providerRemaining = 0, ipRemaining = status.ip_remaining;
  let gen: AsyncGenerator<string> | null = null;
  let firstChunk = "";
  for (let attempt = 0; attempt < VALID.length; attempt++) {
    const { data: res } = await supabase.rpc("reserve_ask", {
      p_ip_hash: iph, p_preferred: preferred, p_ip_per_day: IP_PER_DAY, p_exclude: exclude,
    });
    if (!res || res.status === "ip_limited") {
      await logQuestion({ question, outcome: "rate_limited", ip_hash: iph });
      return json({ error: "rate_limited", message: "You've used today's questions. Browse past answers below, or download the full corpus." }, 429);
    }
    if (res.status === "all_limited") {
      await logQuestion({ question, outcome: "budget", ip_hash: iph });
      return json({ error: "budget_reached", message: "The assistant has reached today's limit. Browse past answers below, or download the full corpus." }, 429);
    }
    // status ok — try to start this provider's stream
    const p = res.provider as string;
    try {
      const g = generateStream(p as ProviderId, SYSTEM_PROMPT, userMsg);
      const first = await g.next(); // throws here if the provider request failed
      chosen = p; gen = g; firstChunk = first.done ? "" : first.value;
      providerRemaining = res.provider_remaining; ipRemaining = res.ip_remaining;
      break;
    } catch {
      exclude.push(p); preferred = null; // let reserve pick another next loop
    }
  }

  if (!chosen || !gen) {
    await logQuestion({ question, outcome: "error", ip_hash: iph });
    return json({ error: "generation_failed", message: "Couldn't reach a model right now. Try again, or download the corpus below." }, 502);
  }

  // 8) stream meta → citations → text, then persist cache + log
  const encoder = new TextEncoder();
  const chosenProvider = chosen;
  const g = gen;
  const head = firstChunk;
  let full = head;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      send({ type: "meta", provider: chosenProvider, providerLabel: providerLabel(chosenProvider), mode, ip_remaining: ipRemaining, provider_remaining: providerRemaining });
      send({ type: "citations", citations });
      if (head) send({ type: "text", text: head });
      try {
        for await (const chunk of g) { full += chunk; send({ type: "text", text: chunk }); }
      } catch { send({ type: "error" }); }
      controller.close();

      if (full.trim()) {
        await supabase.from("qa_cache").upsert({
          question_hash: qHash, question, answer: full, citations, embedding: qVec,
          provider: chosenProvider, updated_at: new Date().toISOString(),
        });
        await logQuestion({ question, outcome: "answered", provider: chosenProvider, answer: full, citations, ip_hash: iph });
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8" } });
}


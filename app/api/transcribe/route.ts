// POST /api/transcribe — universal voice-input fallback.
// Used only when the browser lacks Web Speech API (e.g. Firefox). Transcribes a
// short recorded clip via Groq's FREE Whisper endpoint (already your Groq key).
// Free, no new provider. Consumes Groq's free quota, so it's size/duration
// capped; the fast path (browser speech recognition) never hits this.

import { clientIp, ipHash, verifyTurnstile, json } from "@/lib/ai/server";

export const runtime = "nodejs";

const MAX_BYTES = 1_500_000; // ~15–20s of compressed audio
const MODEL = process.env.AI_WHISPER_MODEL ?? "whisper-large-v3-turbo";

export async function POST(req: Request) {
  if (process.env.AI_CHAT_ENABLED !== "true")
    return json({ error: "disabled" }, 503);

  const key = process.env.AI_GROQ_API_KEY;
  if (!key) return json({ error: "transcribe_unconfigured" }, 501);

  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  const token = (form?.get("turnstileToken") as string) ?? "";
  if (!(file instanceof Blob)) return json({ error: "no_audio" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "audio_too_large" }, 413);

  const ip = clientIp(req);
  if (!(await verifyTurnstile(token, ip))) return json({ error: "turnstile_failed" }, 403);
  void ipHash(ip); // (hook point if you later meter transcription per-IP)

  const upstream = new FormData();
  upstream.append("file", file, "clip.webm");
  upstream.append("model", MODEL);
  upstream.append("response_format", "json");
  upstream.append("language", "en");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: upstream,
  });
  if (!res.ok) return json({ error: "transcribe_failed" }, 502);
  const data = await res.json();
  return json({ text: (data.text ?? "").trim() });
}


// Multi-provider AI layer.
// GENERATION is user-selectable across free platforms (Gemini, Groq, Cerebras).
// EMBEDDINGS are FIXED on Gemini — retrieval needs one consistent vector space,
// so the dropdown never touches embeddings.
//
// Adding a 4th provider = one entry in PROVIDERS below (if it's OpenAI-compatible,
// reuse openaiCompatStream; otherwise add a native path like Gemini's).
//
// Env (see .env.example):
//   AI_GEMINI_API_KEY, AI_GEMINI_GEN_MODEL, AI_EMBEDDING_MODEL
//   AI_GROQ_API_KEY, AI_GROQ_MODEL
//   AI_CEREBRAS_API_KEY, AI_CEREBRAS_MODEL
//   AI_MAX_OUTPUT_TOKENS (512), AI_TEMPERATURE (0.2)

const MAX_OUTPUT = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? "512");
const TEMPERATURE = Number(process.env.AI_TEMPERATURE ?? "0.2");

export type ProviderId = "gemini" | "groq" | "cerebras";

interface ProviderDef {
  id: ProviderId;
  label: string;
  kind: "gemini" | "openai";
  apiKey: () => string | undefined;
  model: () => string;
  baseUrl?: string; // for openai-compatible
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  gemini: {
    id: "gemini",
    label: "Gemini",
    kind: "gemini",
    apiKey: () => process.env.AI_GEMINI_API_KEY,
    model: () => process.env.AI_GEMINI_GEN_MODEL ?? "gemini-2.5-flash",
  },
  groq: {
    id: "groq",
    label: "Groq",
    kind: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: () => process.env.AI_GROQ_API_KEY,
    model: () => process.env.AI_GROQ_MODEL ?? "llama-3.3-70b-versatile",
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    kind: "openai",
    baseUrl: "https://api.cerebras.ai/v1",
    apiKey: () => process.env.AI_CEREBRAS_API_KEY,
    model: () => process.env.AI_CEREBRAS_MODEL ?? "llama-3.3-70b",
  },
};

export function providerLabel(id: string): string {
  return (PROVIDERS as Record<string, ProviderDef>)[id]?.label ?? id;
}

// ---- EMBEDDINGS (fixed: Gemini) --------------------------------------------
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMB_MODEL = process.env.AI_EMBEDDING_MODEL ?? "text-embedding-004";

export async function embedText(text: string): Promise<number[]> {
  const key = process.env.AI_GEMINI_API_KEY;
  const res = await fetch(`${GEMINI_BASE}/models/${EMB_MODEL}:embedContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: `models/${EMB_MODEL}`, content: { parts: [{ text }] } }),
  });
  if (!res.ok) throw new Error(`embed failed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.embedding.values as number[];
}

// ---- GENERATION (per selected provider), streamed --------------------------
export async function* generateStream(
  providerId: ProviderId,
  system: string,
  user: string
): AsyncGenerator<string> {
  const p = PROVIDERS[providerId];
  if (!p) throw new Error(`unknown provider ${providerId}`);
  if (!p.apiKey()) throw new Error(`missing API key for ${providerId}`);
  if (p.kind === "gemini") yield* geminiStream(p, system, user);
  else yield* openaiCompatStream(p, system, user);
}

async function* geminiStream(p: ProviderDef, system: string, user: string) {
  const res = await fetch(
    `${GEMINI_BASE}/models/${p.model()}:streamGenerateContent?alt=sse&key=${p.apiKey()}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: TEMPERATURE, maxOutputTokens: MAX_OUTPUT },
      }),
    }
  );
  if (!res.ok || !res.body) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  for await (const data of sse(res.body)) {
    try {
      const j = JSON.parse(data);
      const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) yield t;
    } catch { /* partial frame */ }
  }
}

async function* openaiCompatStream(p: ProviderDef, system: string, user: string) {
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${p.apiKey()}`,
    },
    body: JSON.stringify({
      model: p.model(),
      temperature: TEMPERATURE,
      max_tokens: MAX_OUTPUT,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`${p.id} ${res.status}: ${await res.text()}`);
  for await (const data of sse(res.body)) {
    if (data === "[DONE]") return;
    try {
      const j = JSON.parse(data);
      const t = j?.choices?.[0]?.delta?.content;
      if (t) yield t;
    } catch { /* partial frame */ }
  }
}

// Shared SSE line parser: yields the payload after each "data:".
async function* sse(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith("data:")) {
        const payload = t.slice(5).trim();
        if (payload) yield payload;
      }
    }
  }
}


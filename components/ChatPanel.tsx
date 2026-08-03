"use client";

// The "Chat" tab. Random/auto provider selection (dropdown anchor, default
// "Random LLM"), narrated pick + attribution, per-visitor meter, corpus-download
// funnel, UNIVERSAL free voice input (browser Web Speech API, with a Groq-Whisper
// fallback for browsers that lack it), read-aloud, curated library, and graceful
// disabled states that point to the library + corpus.

import { useEffect, useRef, useState } from "react";

const CORPUS_HREF = "/invisible-ships-corpus.zip"; // adjust to your export path

interface Citation { n: number; id: string; title: string | null; entry_date: string | null; part: number | null; href: string; }
interface LibItem { question_hash: string; question: string; answer: string; citations: Citation[]; is_pinned: boolean; }
interface ProviderState { id: string; label: string; remaining: number; available: boolean; }

export default function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [provider, setProvider] = useState("auto");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [ipRemaining, setIpRemaining] = useState<number | null>(null);
  const [ipPerDay, setIpPerDay] = useState(40);
  const [providers, setProviders] = useState<ProviderState[]>([]);
  const [open, setOpen] = useState(true);
  const [library, setLibrary] = useState<LibItem[]>([]);

  // voice
  const [voice, setVoice] = useState({ sr: false, media: false });
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    refreshStatus();
    fetch("/api/library").then((r) => r.json()).then((d) => setLibrary(d.items ?? [])).catch(() => {});

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const hasMedia = !!(navigator.mediaDevices?.getUserMedia && w.MediaRecorder);
    if (SR) {
      const rec = new SR();
      rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
      rec.onresult = (e: any) => setQuestion(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
    }
    setVoice({ sr: !!SR, media: hasMedia });
  }, []);

  function refreshStatus() {
    fetch("/api/chat-status").then((r) => r.json()).then((d) => {
      if (typeof d.ip_remaining === "number") setIpRemaining(d.ip_remaining);
      if (typeof d.ip_per_day === "number") setIpPerDay(d.ip_per_day);
      if (Array.isArray(d.providers)) setProviders(d.providers);
      setOpen(!!d.open && d.enabled !== false);
    }).catch(() => {});
  }

  // ---- voice input: browser recognition (fast path) or record→Whisper -------
  async function toggleMic() {
    if (voice.sr && recognitionRef.current) {
      const rec = recognitionRef.current;
      if (listening) { rec.stop(); setListening(false); }
      else { setQuestion(""); try { rec.start(); setListening(true); } catch {} }
      return;
    }
    if (voice.media) {
      if (listening) { stopRecording(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new (window as any).MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = (e: any) => { if (e.data.size) chunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setListening(false);
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (!blob.size) return;
          setTranscribing(true);
          try {
            const fd = new FormData();
            fd.append("audio", blob, "clip.webm");
            fd.append("turnstileToken", (window as any).turnstile?.getResponse?.() ?? "");
            const r = await fetch("/api/transcribe", { method: "POST", body: fd });
            const d = await r.json();
            if (d.text) setQuestion(d.text);
            else setNotice("Couldn't transcribe that — try typing, or speak again.");
          } catch { setNotice("Voice transcription failed. Try typing your question."); }
          finally { setTranscribing(false); }
        };
        mediaRecRef.current = mr;
        mr.start();
        setListening(true);
      } catch { setNotice("Microphone access was blocked."); }
    }
  }
  function stopRecording() { try { mediaRecRef.current?.stop(); } catch {} }

  function readAloud(text = answer) {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function showLibraryAnswer(item: LibItem) {
    setQuestion(item.question); setAnswer(item.answer); setCitations(item.citations ?? []);
    setStatusLine(null); setAttribution(null); setNotice("From a previously answered question.");
    if (autoRead) readAloud(item.answer);
  }

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer(""); setCitations([]); setNotice(null); setAttribution(null);
    setStatusLine("Searching the archive…"); setQuestion(q);
    try {
      const token = (window as any).turnstile?.getResponse?.() ?? "";
      const res = await fetch("/api/ask", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, provider, turnstileToken: token }),
      });
      const ctype = res.headers.get("content-type") ?? "";
      if (ctype.includes("application/json")) {
        const data = await res.json();
        setStatusLine(null);
        if (data.message) setNotice(data.message);
        if (data.answer) { setAnswer(data.answer); if (autoRead) readAloud(data.answer); }
        if (data.citations) setCitations(data.citations);
        if (data.error === "rate_limited" || data.error === "budget_reached") refreshStatus();
        setLoading(false); return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === "meta") {
            const label = msg.providerLabel ?? msg.provider;
            setStatusLine(msg.mode === "auto"
              ? `Randomly selected ${label} to answer your question…`
              : `Answering with ${label}…`);
            setAttribution(`Information provided by ${label} free plan`);
            if (typeof msg.ip_remaining === "number") setIpRemaining(msg.ip_remaining);
          } else if (msg.type === "citations") setCitations(msg.citations);
          else if (msg.type === "text") { full += msg.text; setAnswer((a) => a + msg.text); }
          else if (msg.type === "error") setNotice("Something went wrong generating the answer.");
        }
      }
      setStatusLine(null);
      if (autoRead && full) readAloud(full);
      refreshStatus();
    } catch {
      setStatusLine(null);
      setNotice("Couldn't reach the assistant. Try again, or download the corpus below.");
    } finally { setLoading(false); }
  }

  const disabled = !open || ipRemaining === 0;
  const voiceAvailable = voice.sr || voice.media;
  const micLabel = transcribing ? "Transcribing…" : listening ? "● Listening" : "🎤 Speak";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-neutral-400">
        Answers are drawn only from the Invisible Ships entries, with citations. The
        transcripts are external communications preserved as evidence, not the author&rsquo;s views.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>{ipRemaining === null ? "" : `${ipRemaining} of ${ipPerDay} questions left today`}</span>
        <a href={CORPUS_HREF} className="rounded-md border border-neutral-700 px-2.5 py-1 text-neutral-300 hover:border-amber-500">
          Download the full corpus
        </a>
      </div>

      {disabled ? (
        <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-300">
          {ipRemaining === 0 ? "You've used today's questions." : "The assistant has reached today's limit."}{" "}
          Browse previously answered questions below, or{" "}
          <a href={CORPUS_HREF} className="text-amber-500 underline">download the full corpus</a> to keep exploring on your own.
        </div>
      ) : (
        <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
          <div className="flex flex-wrap items-center gap-2">
            <select value={provider} onChange={(e) => setProvider(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-300" aria-label="Model">
              <option value="auto">🎲 Random LLM (recommended)</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.available}>
                  {p.label}{p.available ? "" : " — resting"}
                </option>
              ))}
            </select>

            {voiceAvailable && (
              <button type="button" onClick={toggleMic} disabled={transcribing}
                aria-label={listening ? "Stop" : "Speak your question"}
                className={`rounded-lg border px-3 py-2 text-sm ${listening ? "border-amber-500 text-amber-400 animate-pulse" : "border-neutral-700 text-neutral-300 hover:border-amber-500"} disabled:opacity-50`}>
                {micLabel}
              </button>
            )}

            <input value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the archive…" maxLength={500}
              className="min-w-[12rem] flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500" />

            <button type="submit" disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-50">
              {loading ? "…" : "Ask"}
            </button>
          </div>

          {/* Turnstile widget mounts here:
              <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} /> */}

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-neutral-600">
              Questions may be recorded and published to help others — please don&rsquo;t include
              personal information. Voice input uses your browser&rsquo;s speech recognition (or a
              free transcription service where unavailable).
            </p>
            {typeof window !== "undefined" && "speechSynthesis" in window && (
              <label className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-500">
                <input type="checkbox" checked={autoRead} onChange={(e) => setAutoRead(e.target.checked)} />
                Read answers aloud
              </label>
            )}
          </div>
        </form>
      )}

      {statusLine && <div className="mt-4 text-sm text-amber-400/90">{statusLine}</div>}
      {notice && <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-300">{notice}</div>}

      {answer && (
        <article className="mt-5">
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-100">{answer}</div>
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
            {attribution && <span>{attribution}</span>}
            {typeof window !== "undefined" && "speechSynthesis" in window && (
              <button onClick={() => readAloud()} className="underline hover:text-neutral-300">Read aloud</button>
            )}
          </div>
        </article>
      )}

      {citations.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs uppercase tracking-wide text-neutral-500">From these entries</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {citations.map((c) => (
              <a key={c.id} href={c.href} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm hover:border-amber-500">
                <span className="text-amber-500">[{c.n}]</span> {c.title ?? c.id}
                <div className="mt-0.5 text-xs text-neutral-500">
                  {[c.entry_date, c.part ? `Part ${c.part}` : null].filter(Boolean).join(" · ")}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {library.length > 0 && (
        <section className="mt-8">
          <h3 className="text-xs uppercase tracking-wide text-neutral-500">Questions people have asked</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {library.map((it) => (
              <button key={it.question_hash} onClick={() => showLibraryAnswer(it)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300 hover:border-amber-500">
                {it.question}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


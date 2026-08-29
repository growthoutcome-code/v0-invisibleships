"use client";
/**
 * Capture — record what is being said, as it is being said.
 *
 * The whole design serves one sequence: harassment starts, you hit one button,
 * you speak what you can hear, you hit it again. Everything else — sign-in,
 * transcription, upload, metadata — happens around that without ever standing
 * in front of it.
 *
 * Consequences of that, which are deliberate:
 *
 *   * The record button is the largest thing on the page and is reachable in
 *     one tap from a signed-in session. No dialog, no "new entry" step.
 *   * Recording never waits on the network. Audio is written to IndexedDB the
 *     moment it stops; upload and transcription happen afterwards and can fail
 *     without losing anything.
 *   * Transcription is on-device (public/whisper-worker.js). The audio does not
 *     leave the machine to be read.
 *   * Nothing here publishes. There is no publish button, deliberately: this
 *     stream is private, and the path into the public journal is a separate,
 *     explicit act that does not exist yet.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CaptureEntry, audioUrl, currentUser, deleteEntry, listEntries, queue,
  requestPasswordReset, saveEdits, signIn, signInWithGoogle, signOut, signUpDetailed,
  syncAll, transcriptOf,
} from "@/lib/capture";
import { getSupabase } from "@/lib/supabase";
import AfterCapture from "@/components/AfterCapture";
import { track } from "@/lib/analytics";

type Phase = "idle" | "recording" | "working";

/** Decode any recorded blob to the mono 16kHz float samples Whisper expects. */
async function toWhisperAudio(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const decoded = await ctx.decodeAudioData(buf);
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const out = await offline.startRendering();
  void ctx.close();
  return out.getChannelData(0);
}

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function CaptureView() {
  const configured = !!getSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [entries, setEntries] = useState<CaptureEntry[]>([]);
  const [status, setStatus] = useState("");
  const [modelPct, setModelPct] = useState<number | null>(null);
  const [pending, setPending] = useState(0);
  // The entry just recorded, if the guided questions have not been dismissed.
  // Metadata is worth more in the twenty seconds after a recording than it will
  // ever be again, and a list row is not going to prompt anyone for it.
  const [justMade, setJustMade] = useState<CaptureEntry | null>(null);

  const worker = useRef<Worker | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setEntries(await listEntries());
      setPending((await queue.all()).length);
    } catch { /* offline: the local queue is still intact */ }
  }, []);

  useEffect(() => {
    (async () => {
      const u = await currentUser();
      setEmail(u?.email ?? null);
      setChecking(false);
      if (u) { await syncAll(); await refresh(); }
    })();
  }, [refresh]);

  // The worker is started as soon as somebody is signed in, not when they press
  // record. The model download is ~40MB and must never sit between a person and
  // a recording that is happening right now.
  useEffect(() => {
    if (!email || worker.current) return;
    const w = new Worker("/whisper-worker.js", { type: "module" });
    w.onmessage = async (e) => {
      const m = e.data || {};
      if (m.type === "progress" && m.total) setModelPct(Math.round((m.loaded / m.total) * 100));
      if (m.type === "ready") { setModelPct(null); setStatus(""); }
      if (m.type === "result") {
        const all = await queue.all();
        const rec = all.find((r) => r.id === m.id);
        if (rec) await queue.put({ ...rec, transcript: m.text });
        setStatus("Saving…");
        await syncAll();
        const fresh = await listEntries();
        setEntries(fresh);
        setPending((await queue.all()).length);
        setJustMade(fresh.find((x) => x.id === m.id) ?? null);
        setStatus("");
        setPhase("idle");
      }
      if (m.type === "error") {
        // The audio is already in IndexedDB. Say so plainly — a transcription
        // failure must never read as a lost recording.
        setStatus(`Transcription failed (${m.message}). The recording is saved and will upload without a transcript.`);
        await syncAll();
        await refresh();
        setPhase("idle");
      }
    };
    worker.current = w;
    w.postMessage({ type: "load" });
    setStatus("Preparing the transcriber (one time)…");
    return () => { w.terminate(); worker.current = null; };
  }, [email, refresh]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: mime });
        const durationS = (Date.now() - startedAt.current) / 1000;
        const id = crypto.randomUUID();
        // occurred_at is the moment recording STARTED. Not now, not upload time.
        const occurredAt = new Date(startedAt.current).toISOString();
        await queue.put({ id, occurredAt, blob, durationS, mime });
        setPending((await queue.all()).length);
        setPhase("working");
        setStatus("Transcribing on this device…");
        try {
          const audio = await toWhisperAudio(blob);
          worker.current?.postMessage({ type: "transcribe", id, audio }, [audio.buffer]);
        } catch (err) {
          setStatus(`Could not read the audio (${String(err)}). The recording is saved.`);
          await syncAll(); await refresh(); setPhase("idle");
        }
      };
      startedAt.current = Date.now();
      rec.start();
      recorder.current = rec;
      setPhase("recording");
      setElapsed(0);
      timer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      track("capture_started");
    } catch {
      setStatus("Microphone access was refused. Allow it in your browser's site settings and try again.");
    }
  }

  function stop() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    recorder.current?.stop();
    recorder.current = null;
  }

  if (!configured) {
    return (
      <Shell>
        <p className="body-copy text-foreground/85">
          Capture is unavailable on this deployment: no database is configured. Set{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in Vercel for <strong>this</strong> environment — Preview and Production are
          separate, and a variable set for one is absent in the other — then redeploy.
        </p>
      </Shell>
    );
  }
  if (checking) return <Shell><p className="text-muted">…</p></Shell>;
  if (!email) return <Shell><SignIn onDone={async (e) => { setEmail(e); await refresh(); }} /></Shell>;

  return (
    <Shell>
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <p className="text-[15px] text-muted m-0">Signed in as {email}</p>
        <button type="button" onClick={async () => { await signOut(); setEmail(null); }}
          className="text-[14px] underline underline-offset-4 text-muted hover:text-foreground">
          Sign out
        </button>
      </div>

      {/* One button. Everything else is arranged around not being in its way. */}
      <div className="flex flex-col items-center py-8 border border-edge rounded-lg mb-6">
        <button
          type="button"
          onClick={phase === "recording" ? stop : start}
          disabled={phase === "working"}
          aria-label={phase === "recording" ? "Stop recording" : "Start recording"}
          className={`w-32 h-32 rounded-full grid place-items-center transition-colors disabled:opacity-40 ${
            phase === "recording"
              ? "bg-foreground text-background animate-pulse"
              : "border-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
          }`}>
          <span className="text-[15px] font-semibold tracking-wide">
            {phase === "recording" ? "STOP" : phase === "working" ? "…" : "RECORD"}
          </span>
        </button>
        <p className="mt-4 text-[28px] font-display tabular-nums">
          {phase === "recording" ? clock(elapsed) : "0:00"}
        </p>
        <p className="mt-1 text-[14px] text-muted text-center max-w-sm">
          {phase === "recording"
            ? "Say what you are hearing. Stop when it stops."
            : "Press record and repeat what is being said. It is timestamped from the moment you press it."}
        </p>
        {modelPct !== null && (
          <p className="mt-3 text-[13px] text-muted">Downloading the transcriber — {modelPct}%. One time only.</p>
        )}
        {status && <p className="mt-3 text-[14px] text-foreground/85 text-center max-w-md">{status}</p>}
        {pending > 0 && (
          <button type="button" onClick={async () => { setStatus("Uploading…"); await syncAll(); await refresh(); setStatus(""); }}
            className="mt-3 text-[13px] underline underline-offset-4">
            {pending} recording{pending === 1 ? "" : "s"} waiting to upload — retry now
          </button>
        )}
      </div>

      <p className="text-[13px] text-muted mb-6">
        Transcription runs on this device. The audio is not sent to any transcription
        service. Recordings are private to this account and nothing here is published.
      </p>

      {justMade && (
        <AfterCapture entry={justMade} onClose={() => { setJustMade(null); void refresh(); }} />
      )}

      <h3 className="font-display text-xl font-semibold mb-3">Entries</h3>
      {entries.length === 0 && <p className="text-muted text-[15px]">Nothing recorded yet.</p>}
      <ul className="list-none p-0 m-0 space-y-4">
        {entries.map((e) => <EntryRow key={e.id} entry={e} onChanged={refresh} />)}
      </ul>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:w-[65%] lg:mx-auto">
      <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Capture</h2>
      <p className="body-copy text-foreground/85 mb-6">
        A private, dated record. Press record while something is happening and say what
        you are hearing — a contemporaneous account, not a recollection written afterwards.
      </p>
      {children}
    </div>
  );
}

/**
 * The account screen.
 *
 * Conventional on purpose. Someone arriving here is being asked to trust a site
 * about surveillance with an account; an unfamiliar-looking sign-up form is a
 * reason to hesitate, and hesitation is the thing this page can least afford.
 * So: a centred card, the provider button first with its real mark, a labelled
 * divider, real form labels, a visible password toggle, one primary action.
 *
 * SIGN UP IS THE DEFAULT MODE. Almost everyone who reaches this page does not
 * have an account — there is one user today. Defaulting to sign-in shows the
 * majority a form that will reject them.
 */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function SignIn({ onDone }: { onDone: (email: string) => void }) {
  // Sign up first: there is one account today, so nearly everyone arriving here
  // needs to create one.
  const [mode, setMode] = useState<"up" | "in">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  // Set once Supabase tells us Google is not switched on for this project. A
  // button that errors every time it is pressed is worse than no button: it
  // reads as the site being broken rather than as a provider being unconfigured.
  const [googleOff, setGoogleOff] = useState(false);
  const creating = mode === "up";

  return (
    <div className="mx-auto w-full max-w-[400px] border border-edge rounded-lg p-7">
      <h3 className="font-display text-2xl font-semibold text-foreground m-0">
        {creating ? "Create an account" : "Sign in"}
      </h3>
      <p className="text-[15px] text-foreground/75 mt-2 mb-6">
        {creating
          ? "An account gives you a private, dated record that only you can read. Nothing you record is published."
          : "Welcome back."}
      </p>

      {!googleOff && (
        <>
          <button type="button" disabled={busy}
            onClick={async () => {
              setBusy(true); setErr(""); setNote("");
              try { await signInWithGoogle(); }
              catch (e) {
                const raw = e instanceof Error ? e.message : String(e);
                if (/provider is not enabled|Unsupported provider/i.test(raw)) {
                  setGoogleOff(true);
                  setNote("Google sign-in is not switched on for this project yet. Use email and password below — it works now.");
                } else {
                  setErr(raw);
                }
                setBusy(false);
              }
            }}
            className="w-full h-11 px-4 border border-edge hover:border-foreground rounded-md
                       inline-flex items-center justify-center gap-3 text-[15px] font-medium
                       disabled:opacity-40 transition-colors">
            <GoogleMark />
            {creating ? "Sign up with Google" : "Continue with Google"}
          </button>
          {/* The one thing a conventional form would not tell you, on a site read
              by people who assume they are watched. */}
          <p className="text-[12.5px] text-muted mt-2 mb-5 leading-snug">
            Google will know you visited this site. Email and password below will not.
          </p>

          <div className="flex items-center gap-3 mb-5" aria-hidden>
            <span className="h-px flex-1 bg-edge" />
            <span className="text-[12px] text-muted uppercase tracking-wider">or</span>
            <span className="h-px flex-1 bg-edge" />
          </div>
        </>
      )}

      <form
        onSubmit={async (ev) => {
          ev.preventDefault();
          setBusy(true); setErr(""); setNote("");
          try {
            if (!creating) {
              await signIn(email, password);
            } else if ((await signUpDetailed(email, password)) === "confirm-email") {
              setNote(
                "Account created. Check your email for a confirmation link, then sign in. " +
                "If it does not arrive, turn off Authentication → Providers → Email → " +
                "Confirm email in the Supabase dashboard."
              );
              setBusy(false);
              return;
            }
            const u = await currentUser();
            if (u?.email) onDone(u.email);
            else setErr("Signed up, but no session was returned. Try signing in.");
          } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
          } finally { setBusy(false); }
        }}>
        <label className="block text-[13.5px] font-medium mb-1.5" htmlFor="cap-email">Email</label>
        <input id="cap-email" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full h-11 border border-edge rounded-md bg-transparent px-3 mb-4
                     focus:outline-none focus:border-foreground" />

        <label className="block text-[13.5px] font-medium mb-1.5" htmlFor="cap-pw">Password</label>
        <div className="relative mb-2">
          <input id="cap-pw" type={showPw ? "text" : "password"} required minLength={8}
            autoComplete={creating ? "new-password" : "current-password"} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 border border-edge rounded-md bg-transparent px-3 pr-16
                       focus:outline-none focus:border-foreground" />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted hover:text-foreground"
            aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-[12.5px] text-muted mb-5">
          {creating ? "At least 8 characters." : " "}
        </p>

        <button type="submit" disabled={busy}
          className="w-full h-11 rounded-md bg-foreground text-background text-[15px] font-medium
                     hover:opacity-90 disabled:opacity-40 transition-opacity">
          {busy ? "…" : creating ? "Create account" : "Sign in"}
        </button>
      </form>

      {!creating && (
        <p className="mt-4 text-center">
          <button type="button"
            onClick={async () => {
              if (!email) { setErr("Enter your email address first."); return; }
              setErr(""); setNote("");
              try { await requestPasswordReset(email); setNote("If that address has an account, a reset link is on its way."); }
              catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
            }}
            className="text-[14px] underline underline-offset-4 text-muted hover:text-foreground">
            Forgot your password?
          </button>
        </p>
      )}

      {(err || note) && (
        <p className="mt-4 text-[14px] text-foreground/85 border border-edge rounded-md p-3">
          {err || note}
        </p>
      )}

      <p className="mt-6 pt-5 border-t border-edge text-[14px] text-muted text-center">
        {creating ? "Already have an account?" : "No account yet?"}{" "}
        <button type="button"
          onClick={() => { setMode(creating ? "in" : "up"); setErr(""); setNote(""); }}
          className="underline underline-offset-4 text-foreground">
          {creating ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}

/**
 * One entry, editable and deletable in place.
 *
 * Sean, 28 August: "once they sign up they may have thoughts, and those
 * thoughts they share may or may not be acceptable to the person. They may want
 * to delete the thoughts."
 *
 * That is the principle the whole row is built on. A person owns their account
 * of their own experience, including the right to change their mind about it an
 * hour later. If revising or removing something takes more than a moment, they
 * stop recording honestly — and a record somebody is afraid to be honest in is
 * worth nothing.
 *
 * So the transcript is a text field, always, not a read-only block with an edit
 * button behind a disclosure. It saves when you click away. Delete is visible
 * on every row without opening anything. Neither asks permission.
 *
 * What is NOT editable: transcript_raw. Whisper's original stays untouched in
 * the database, which is what makes a correction a correction rather than a
 * rewrite. Nothing in this UI can reach it.
 */
function EntryRow({ entry, onChanged }: { entry: CaptureEntry; onChanged: () => void }) {
  const [text, setText] = useState(transcriptOf(entry));
  const [url, setUrl] = useState<string | null>(null);
  const [detail, setDetail] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const when = new Date(entry.occurred_at);

  useEffect(() => {
    if (detail && entry.audio_path && !url) audioUrl(entry.audio_path).then(setUrl);
  }, [detail, entry.audio_path, url]);

  async function commit() {
    if (text === transcriptOf(entry)) return;
    setSaving("saving");
    try {
      await saveEdits(entry.id, { transcript_edited: text, needs_review: false });
      setSaving("saved");
      setTimeout(() => setSaving("idle"), 1500);
      onChanged();
    } catch { setSaving("idle"); }
  }

  async function field(key: "location" | "context" | "witnesses", v: string) {
    try { await saveEdits(entry.id, { [key]: v.trim() || null } as never); onChanged(); } catch { /* noop */ }
  }

  return (
    <li className="border border-edge rounded-lg p-4">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[13px] text-muted">
          {when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          {entry.audio_duration_s ? ` · ${clock(entry.audio_duration_s)}` : ""}
          {entry.status !== "transcribed" ? ` · ${entry.status}` : ""}
          {entry.wants_publish ? " · marked to publish" : ""}
        </span>
        <span className="ml-auto text-[12px] text-muted">
          {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}
        </span>
      </div>

      {/* Editable in place. No edit button, no mode, no confirmation. */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        rows={Math.min(12, Math.max(2, Math.ceil((text.length || 1) / 78)))}
        placeholder="No transcript — the audio is saved. You can type what was said."
        aria-label="Transcript"
        className="w-full bg-transparent border border-transparent hover:border-edge focus:border-foreground
                   rounded-md p-2 -m-2 text-[15px] leading-relaxed resize-y focus:outline-none transition-colors"
      />

      <div className="flex items-center gap-4 mt-3">
        <button type="button" onClick={() => setDetail(!detail)}
          className="text-[13px] text-muted hover:text-foreground underline underline-offset-4">
          {detail ? "Hide details" : "Details, audio and metadata"}
        </button>
        <button type="button"
          onClick={async () => {
            if (!confirm("Delete this entry and its audio? This cannot be undone.")) return;
            await deleteEntry(entry); onChanged();
          }}
          className="ml-auto text-[13px] text-muted hover:text-foreground underline underline-offset-4">
          Delete
        </button>
      </div>

      {detail && (
        <div className="mt-4 border-t border-edge pt-4 space-y-3">
          {url && <audio controls src={url} className="w-full" />}

          {(["location", "context", "witnesses"] as const).map((k) => (
            <div key={k}>
              <label className="block text-[12px] uppercase tracking-wider text-muted mb-1" htmlFor={`${entry.id}-${k}`}>
                {k === "location" ? "Where" : k === "context" ? "What was happening just before" : "Who else could hear it"}
              </label>
              <input id={`${entry.id}-${k}`} defaultValue={entry[k] ?? ""}
                onBlur={(e) => field(k, e.target.value)}
                className="w-full h-10 border border-edge rounded-md bg-transparent px-3 text-[15px]
                           focus:outline-none focus:border-foreground" />
            </div>
          ))}

          {entry.transcript_edited && entry.transcript_raw && entry.transcript_edited !== entry.transcript_raw && (
            <details className="text-[14px]">
              <summary className="cursor-pointer text-muted hover:text-foreground">
                What the transcription originally said
              </summary>
              <p className="mt-2 text-foreground/70 whitespace-pre-wrap">{entry.transcript_raw}</p>
              <p className="mt-2 text-[13px] text-muted">
                Kept unchanged. A correction beside its original is evidence; a correction
                on its own is a claim.
              </p>
            </details>
          )}
        </div>
      )}
    </li>
  );
}

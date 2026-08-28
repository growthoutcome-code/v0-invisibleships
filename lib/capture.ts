/**
 * Capture — the live recording stream.
 *
 * Someone is being harassed. They hit record, speak what is being said to them,
 * and stop. Everything in this file exists to make that sequence fast and
 * survivable under bad conditions, because those are the only conditions it
 * will ever be used in.
 *
 * Three decisions are load-bearing and should not be undone casually:
 *
 * 1. THE AUDIO NEVER LEAVES THE DEVICE TO BE TRANSCRIBED. Whisper runs in the
 *    browser (see public/whisper-worker.js). No OpenAI, no Google, no vendor of
 *    any kind sees the recording. An archive about being surveilled cannot send
 *    its recordings to a third party, and "your audio never leaves your device"
 *    is a sentence you can only write if it is true.
 *
 * 2. occurred_at IS WHEN IT WAS SPOKEN, never when it uploaded. A recording made
 *    with no signal and synced twenty minutes later must carry the moment it
 *    happened, or it is a note rather than a record.
 *
 * 3. THE QUEUE IS LOCAL FIRST. The recording is written to IndexedDB before
 *    anything touches the network. Losing a recording because a tab closed or a
 *    connection dropped is not an acceptable failure for this material.
 */
import { getSupabase } from "@/lib/supabase";

export type CaptureStatus = "queued" | "uploaded" | "transcribed" | "failed";

export type CaptureEntry = {
  id: string;
  user_id: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  transcript_raw: string | null;
  transcript_edited: string | null;
  audio_path: string | null;
  audio_duration_s: number | null;
  audio_mime: string | null;
  location: string | null;
  categories: string[];
  source_type: string | null;
  notes: string | null;
  agent_questions: unknown | null;
  needs_review: boolean;
  status: CaptureStatus;
  error: string | null;
  promoted_at: string | null;
  promoted_doc_id: string | null;
};

/** What the transcript field should show: the correction if there is one. */
export function transcriptOf(e: Pick<CaptureEntry, "transcript_raw" | "transcript_edited">) {
  return e.transcript_edited ?? e.transcript_raw ?? "";
}

/* ------------------------------------------------------------------ local queue
 *
 * IndexedDB rather than localStorage: audio blobs are megabytes, and
 * localStorage is a synchronous string store with a 5MB ceiling shared with
 * everything else on the origin. A dropped recording is the one failure this
 * feature cannot have.
 */
const DB = "invisible-ships-capture";
const STORE = "pending";

export type PendingRecording = {
  id: string;
  occurredAt: string;
  blob: Blob;
  durationS: number;
  mime: string;
  transcript?: string;
};

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const queue = {
  put: (r: PendingRecording) => tx("readwrite", (s) => s.put(r)),
  all: () => tx<PendingRecording[]>("readonly", (s) => s.getAll()),
  remove: (id: string) => tx("readwrite", (s) => s.delete(id)),
};

/* ------------------------------------------------------------------ auth */

export async function currentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export async function signIn(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Sign-in is unavailable: this deployment has no Supabase configuration.");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Sign-up is unavailable: this deployment has no Supabase configuration.");
  const { error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
}

/**
 * Sign up, and say which of the two things happened.
 *
 * Supabase returns a user with NO session when the project requires email
 * confirmation. Treating that as success leaves someone staring at a sign-in
 * form that rejects the account they just made, with nothing explaining why.
 */
export async function signUpDetailed(email: string, password: string): Promise<"signed-in" | "confirm-email"> {
  const sb = getSupabase();
  if (!sb) throw new Error("Sign-up is unavailable: this deployment has no Supabase configuration.");
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data.session ? "signed-in" : "confirm-email";
}

/**
 * Password reset. Not a nicety: this is a tool someone reaches for while
 * something is happening to them, and being locked out at that moment is the
 * worst failure it can have.
 */
export async function requestPasswordReset(email: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("This deployment has no Supabase configuration.");
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/capture` : undefined,
  });
  if (error) throw error;
}

/** Set a new password once a reset link has established a session. */
export async function setPassword(password: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("This deployment has no Supabase configuration.");
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Google sign-in.
 *
 * No callback route is needed: supabase-js defaults to the implicit flow in the
 * browser and picks the session out of the URL fragment on load, which is why
 * redirectTo points straight back at /capture.
 *
 * Worth knowing before this is offered to contributors: signing in with Google
 * tells Google that this person visited this site. For an archive read by people
 * who believe they are being watched, that is a real disclosure — which is why
 * email and password stays as the first option on the form rather than the
 * fallback, and why neither is removed in favour of the other.
 */
export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) throw new Error("Sign-in is unavailable: this deployment has no Supabase configuration.");
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/capture` : undefined,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  await getSupabase()?.auth.signOut();
}

/* ------------------------------------------------------------------ entries */

export async function listEntries(limit = 100): Promise<CaptureEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("capture_entries")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as CaptureEntry[];
}

/**
 * Push one queued recording to the server: audio into private storage, then the
 * row. Storage first — a row pointing at audio that failed to upload is worse
 * than audio with no row, because the row looks complete.
 *
 * Objects are stored at <user_id>/<entry_id>.<ext>; the storage policies read
 * the first path segment as the owner, so the path is not cosmetic.
 */
export async function syncRecording(r: PendingRecording): Promise<CaptureEntry> {
  const sb = getSupabase();
  if (!sb) throw new Error("No Supabase configuration.");
  const user = await currentUser();
  if (!user) throw new Error("Not signed in.");

  const ext = r.mime.includes("mp4") ? "mp4" : r.mime.includes("ogg") ? "ogg" : "webm";
  const path = `${user.id}/${r.id}.${ext}`;

  const up = await sb.storage.from("capture-audio").upload(path, r.blob, {
    contentType: r.mime,
    upsert: true,
  });
  if (up.error) throw up.error;

  const { data, error } = await sb
    .from("capture_entries")
    .insert({
      id: r.id,
      user_id: user.id,
      occurred_at: r.occurredAt,
      transcript_raw: r.transcript ?? null,
      audio_path: path,
      audio_duration_s: r.durationS,
      audio_mime: r.mime,
      status: r.transcript ? "transcribed" : "uploaded",
    })
    .select()
    .single();
  if (error) throw error;
  return data as CaptureEntry;
}

/** Flush everything waiting locally. Safe to call often; it is idempotent. */
export async function syncAll(): Promise<{ synced: number; failed: number }> {
  let synced = 0, failed = 0;
  for (const r of await queue.all()) {
    try {
      await syncRecording(r);
      await queue.remove(r.id);
      synced++;
    } catch {
      failed++; // stays in the queue; nothing is lost by a failed attempt
    }
  }
  return { synced, failed };
}

/**
 * Save a correction. transcript_raw is never touched — a corrected transcript
 * beside its original is evidence, a corrected transcript alone is a claim.
 */
export async function saveEdits(
  id: string,
  patch: Partial<Pick<CaptureEntry, "transcript_edited" | "location" | "categories" | "source_type" | "notes" | "needs_review">>
) {
  const sb = getSupabase();
  if (!sb) throw new Error("No Supabase configuration.");
  const { error } = await sb.from("capture_entries").update(patch).eq("id", id);
  if (error) throw error;
}

/** Remove an entry and its audio. Deletion is a feature, not an oversight. */
export async function deleteEntry(e: CaptureEntry) {
  const sb = getSupabase();
  if (!sb) throw new Error("No Supabase configuration.");
  if (e.audio_path) await sb.storage.from("capture-audio").remove([e.audio_path]);
  const { error } = await sb.from("capture_entries").delete().eq("id", e.id);
  if (error) throw error;
}

/** A short-lived URL for playback. The bucket is private; nothing is public. */
export async function audioUrl(path: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.storage.from("capture-audio").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/**
 * Whisper, in the browser, on this device.
 *
 * WHY THIS RUNS HERE AND NOT ON A SERVER
 * --------------------------------------
 * This transcribes recordings of people being harassed. Sending that audio to
 * OpenAI, Google or anyone else would mean an archive about surveillance
 * handing its recordings to a third party. The model weights are open, so it
 * does not have to. Nothing in this file talks to an API: the model is fetched
 * once from a CDN as static files, cached by the browser, and every sample of
 * audio is processed locally. No key, no account, no per-use cost.
 *
 * It runs in a Worker because transcription is seconds of solid computation and
 * the main thread is holding a recording UI that must stay responsive.
 *
 * MODEL CHOICE
 * ------------
 * whisper-base.en, quantised — about 40MB, downloaded once. Larger models are
 * more accurate on hard audio, but this is one speaker, close to the mic,
 * repeating what they can hear, and base handles that. The transcript is
 * editable by design precisely because Whisper mishears shouted and distant
 * speech at any size.
 *
 * Messages in:  { type: "load" }
 *               { type: "transcribe", id, audio: Float32Array (16kHz mono) }
 * Messages out: { type: "ready" | "progress" | "result" | "error", ... }
 */

const MODEL = "Xenova/whisper-base.en";
const CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

let transcriber = null;
let loading = null;

async function load() {
  if (transcriber) return transcriber;
  if (loading) return loading;
  loading = (async () => {
    const { pipeline, env } = await import(`${CDN}/dist/transformers.min.js`);
    // No local model server: fetch weights from the CDN and let the browser
    // cache them. Second run onwards is instant and works offline.
    env.allowLocalModels = false;
    transcriber = await pipeline("automatic-speech-recognition", MODEL, {
      dtype: "q8",
      progress_callback: (p) => {
        if (p?.status === "progress" && p.file) {
          self.postMessage({
            type: "progress",
            file: p.file,
            loaded: p.loaded ?? 0,
            total: p.total ?? 0,
          });
        }
      },
    });
    self.postMessage({ type: "ready" });
    return transcriber;
  })();
  return loading;
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === "load") {
      await load();
      return;
    }
    if (msg.type === "transcribe") {
      const t = await load();
      const out = await t(msg.audio, {
        // Long recordings are chunked; without this, anything past 30 seconds
        // is silently dropped, which would lose exactly the incidents worth
        // keeping.
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });
      const text = (Array.isArray(out) ? out[0]?.text : out?.text) || "";
      self.postMessage({ type: "result", id: msg.id, text: text.trim() });
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      id: msg.id,
      // The recording is already safe in IndexedDB when this fires. Say so, so
      // the failure does not read as data loss.
      message: String(err && err.message ? err.message : err),
    });
  }
};

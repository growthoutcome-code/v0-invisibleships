// Shareable deep-link route for the assistant (renders the same Chat panel that
// lives in the Journal view's "Chat" tab). Optional — the primary surface is the
// Journal | Chat tabs. Keep this if you want /ask to be linkable/SEO-able.

import ChatPanel from "@/components/ChatPanel";

export default function AskPage() {
  return (
    <main className="px-6 py-10">
      <h1 className="mx-auto max-w-3xl text-2xl font-semibold">Ask the archive</h1>
      <div className="mt-4">
        <ChatPanel />
      </div>
    </main>
  );
}


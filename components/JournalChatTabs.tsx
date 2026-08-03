"use client";

// Journal | Chat tabs for the Journal view. Default tab = Journal (your existing
// paginated feed, passed in as `journal`). Second tab = Chat (the assistant).
//
// Usage in your journal page:
//   <JournalChatTabs journal={<JournalFeed ... />} />

import { useState } from "react";
import ChatPanel from "./ChatPanel";

export default function JournalChatTabs({ journal }: { journal: React.ReactNode }) {
  const [tab, setTab] = useState<"journal" | "chat">("journal");

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-neutral-800">
        {(["journal", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 ${
              tab === t
                ? "border-amber-500 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t === "chat" ? "Chat" : "Journal"}
          </button>
        ))}
      </div>

      {tab === "journal" ? <div>{journal}</div> : <ChatPanel />}
    </div>
  );
}


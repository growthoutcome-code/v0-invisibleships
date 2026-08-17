"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

type Source = {
  id: string;
  url: string;
  title?: string;
  publisher?: string;
  published_on?: string;
  evidence_tier?: "A" | "B" | "C" | string;
  archived_url?: string;
};

/**
 * Full source list for the Data section.
 *
 * Rendered as a list, not a table — the report already has three tables and the
 * brief was to avoid stacking more. Fetched from the published dataset rather than
 * inlined, so it stays in step with what the click-through modals resolve against.
 */
export default function GovCloudSources() {
  const [rows, setRows] = useState<Source[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/data/tables/sources.json")
      .then((r) => r.json())
      .then((d: Source[]) => { if (alive) setRows(d); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, []);

  const { list, distinct } = useMemo(() => {
    const all = rows || [];
    const s = q.trim().toLowerCase();
    const filtered = s
      ? all.filter((r) =>
          (r.title || "").toLowerCase().includes(s) ||
          (r.publisher || "").toLowerCase().includes(s) ||
          (r.url || "").toLowerCase().includes(s))
      : all;
    const sorted = [...filtered].sort((a, b) =>
      (a.publisher || "").localeCompare(b.publisher || "") ||
      (a.title || "").localeCompare(b.title || ""));
    return { list: sorted, distinct: new Set(all.map((r) => r.url)).size };
  }, [rows, q]);

  if (!rows) return null;

  return (
    <section className="w-full mt-24">
      <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Sources</h2>
      <p className="body-copy text-foreground/75 mb-8 max-w-[70ch]">
        {rows.length} citations across {distinct} distinct URLs. Tier A is primary or
        official, B corroborated secondary, C claimed or theoretical. Links open in a
        new tab.
      </p>

      <Input
        value={q}
        onChange={(e: any) => setQ(e.target.value)}
        placeholder="Filter by publisher, title or URL"
        aria-label="Filter sources"
        className="mb-8 max-w-[420px]"
      />

      <ol className="list-none p-0 m-0">
        {list.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline gap-x-5 gap-y-1 py-4">
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => track("source_opened", { id: r.id })}
              className="text-foreground underline underline-offset-4 hover:text-accent text-[17px]"
            >
              {r.title || r.url}
            </a>
            <span className="text-muted text-[14px]">{r.publisher}</span>
            {r.published_on && <span className="text-muted text-[14px]">{r.published_on}</span>}
            <span className="text-muted text-[13px] uppercase tracking-wide ml-auto">
              Tier {r.evidence_tier}
            </span>
          </li>
        ))}
      </ol>

      {!list.length && <p className="body-copy text-muted">No sources match that filter.</p>}
    </section>
  );
}

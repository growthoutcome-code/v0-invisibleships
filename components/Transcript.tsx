// Shared transcript/markdown renderer for journal entries — used by both the
// in-app reader and the standalone /journal/[id] route.
import React from "react";

export function renderInline(text: string, key: number) {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) nodes.push(<a key={`${key}-${i}`} href={m[2]} target="_blank" rel="noreferrer" className="text-accent underline">{m[1]}</a>);
    else nodes.push(<strong key={`${key}-${i}`}>{m[3]}</strong>);
    last = re.lastIndex; i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Transcript({ md }: { md: string }) {
  return (
    <div className="font-serif text-[23px] text-foreground/90">
      {md.split("\n").map((ln, i) => {
        const t = ln.trim();
        if (!t) return null;
        if (t.startsWith("## ")) return <h3 key={i} className="font-display text-2xl font-semibold mt-8 mb-3 text-foreground">{t.slice(3)}</h3>;
        if (t.startsWith("# ")) return <h2 key={i} className="font-display text-3xl font-semibold mt-6 mb-4 text-foreground">{t.slice(2)}</h2>;
        return <p key={i} className="my-4 leading-[1.6]">{renderInline(t, i)}</p>;
      })}
    </div>
  );
}

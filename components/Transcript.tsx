// Shared transcript/markdown renderer for journal entries — used by both the
// in-app reader and the standalone /journal/[id] route.
import React from "react";
import DisclaimerLink from "@/components/DisclaimerLink";

// A link to the site's own disclaimer, written relative or as the full address
// (the Discovery Notes entries use https://www.invisibleships.com/disclaimer).
// In content it opens the modal, like every other in-page disclaimer link
// (Sean, 30 Sep 2026); only the footer goes to the page.
export const isDisclaimerHref = (h: string) =>
  /^(https?:\/\/(www\.)?invisibleships\.com)?\/disclaimer\/?$/i.test(h.trim());

export function renderInline(text: string, key: number) {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] && isDisclaimerHref(m[2])) nodes.push(
      <DisclaimerLink key={`${key}-${i}`} from="journal_entry" className="text-accent underline">{m[1]}</DisclaimerLink>);
    else if (m[1]) nodes.push(m[2].startsWith("/")
      ? <a key={`${key}-${i}`} href={m[2]} className="text-accent underline">{m[1]}</a>
      : <a key={`${key}-${i}`} href={m[2]} target="_blank" rel="noreferrer" className="text-accent underline">{m[1]}</a>);
    else nodes.push(<strong key={`${key}-${i}`}>{m[3]}</strong>);
    last = re.lastIndex; i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Transcript({ md }: { md: string }) {
  return (
    <div className="body-copy text-foreground/90">
      {md.split("\n").map((ln, i) => {
        const t = ln.trim();
        if (!t) return null;
        if (t.startsWith("## ")) return <h3 key={i} className="font-display text-2xl font-semibold mt-8 mb-3 text-foreground">{t.slice(3)}</h3>;
        // "> " lines are a quoted note (the Discovery Notes heading summary);
        // a bare ">" is the blank line inside one. Shown as a quote, not with
        // the marker printed (Sean, 30 Sep 2026).
        if (t === ">") return null;
        if (t.startsWith("> ")) return <blockquote key={i} className="my-4 border-l-2 border-edge pl-4 leading-[1.6] text-foreground/80">{renderInline(t.slice(2), i)}</blockquote>;
        if (t.startsWith("# ")) return <h2 key={i} className="font-display text-3xl font-semibold mt-6 mb-4 text-foreground">{t.slice(2)}</h2>;
        return <p key={i} className="my-4 leading-[1.6]">{renderInline(t, i)}</p>;
      })}
    </div>
  );
}

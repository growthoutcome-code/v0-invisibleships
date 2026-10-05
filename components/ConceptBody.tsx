"use client";
// Renders a concept body written in a small subset of markdown (Sean, 4 Oct 2026).
//
// Every concept before "The Open Channel" is plain prose, and plain prose
// renders here exactly as it did: one paragraph per blank line. The subset:
//   ### / #### headings, "> " quoted callouts, "- " bullet lists,
//   **bold**, *italic*, [links](href)
//
// Links follow the site rule (Sean, 4 Oct 2026):
//   /disclaimer          opens the disclaimer modal, like every in-page reference
//   /internal/path       same window
//   http(s)://...        new window
import Link from "next/link";
import React from "react";
import DisclaimerLink from "@/components/DisclaimerLink";
import { isDisclaimerHref } from "@/components/Transcript";

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;

export function renderConceptInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = new RegExp(INLINE.source, "g");
  let last = 0, i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1] !== undefined) {
      const label = m[1], href = m[2].trim();
      if (isDisclaimerHref(href)) {
        out.push(<DisclaimerLink key={k} from="concept_body" className="text-accent underline underline-offset-2">{label}</DisclaimerLink>);
      } else if (/^https?:\/\//i.test(href)) {
        out.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:opacity-80">{label}</a>);
      } else {
        out.push(<Link key={k} href={href} className="text-accent underline underline-offset-2 hover:opacity-80">{label}</Link>);
      }
    } else if (m[3] !== undefined) {
      out.push(<strong key={k} className="font-semibold text-foreground">{renderConceptInline(m[3], k)}</strong>);
    } else {
      out.push(<em key={k}>{renderConceptInline(m[4], k)}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function ConceptBody({ md }: { md: string }) {
  return (
    <>
      {groupQuotes(md).map((b, i) => {
        const k = `b${i}`;
        if (b.kind === "quote") {
          return (
            <blockquote key={k} className="measure mb-6 border-l-2 border-foreground pl-5 py-1">
              {b.paras.map((p, j) => (
                <p key={j} className="body-copy text-foreground/85 m-0 mb-3 last:mb-0">{renderConceptInline(p, `${k}-${j}`)}</p>
              ))}
            </blockquote>
          );
        }
        if (b.kind === "list") {
          return (
            <ul key={k} className="measure mb-6 list-none p-0">
              {b.items.map((it, j) => (
                <li key={j} className="body-copy text-foreground/85 py-1 pl-5 relative">
                  <span aria-hidden className="absolute left-0 top-1 text-foreground">—</span>
                  {renderConceptInline(it, `${k}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }
        const t = b.text;
        if (t.startsWith("#### ")) return <h4 key={k} className="font-display text-xl font-semibold text-foreground mt-8 mb-3 measure">{renderConceptInline(t.slice(5), k)}</h4>;
        if (t.startsWith("### ")) return <h3 key={k} className="font-display text-2xl font-semibold text-foreground mt-10 mb-4 measure">{renderConceptInline(t.slice(4), k)}</h3>;
        if (t.startsWith("## ")) return <h2 key={k} className="font-display text-[26px] font-semibold text-foreground mt-12 mb-4 measure">{renderConceptInline(t.slice(3), k)}</h2>;
        if (t === "---") return <hr key={k} className="measure border-edge my-10" />;
        return <p key={k} className="body-copy text-foreground/85 measure mb-6">{renderConceptInline(t, k)}</p>;
      })}
    </>
  );
}

type Block = { kind: "text"; text: string } | { kind: "quote"; paras: string[] } | { kind: "list"; items: string[] };

/** Splits on blank lines, then folds consecutive "> " lines into one callout. */
function groupQuotes(md: string): Block[] {
  const out: Block[] = [];
  const lines = md.split("\n");
  let buf: string[] = [];
  const flush = () => { const t = buf.join(" ").trim(); if (t) out.push({ kind: "text", text: t }); buf = []; };
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith(">")) {
      flush();
      const paras: string[] = []; let cur: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        const body = lines[i].replace(/^>\s?/, "");
        if (body.trim() === "") { if (cur.length) paras.push(cur.join(" ")); cur = []; }
        else cur.push(body);
        i++;
      }
      if (cur.length) paras.push(cur.join(" "));
      out.push({ kind: "quote", paras });
      i--;
    } else if (/^- /.test(ln.trim())) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      out.push({ kind: "list", items });
      i--;
    } else if (ln.trim() === "") {
      flush();
    } else if (/^#{2,4} /.test(ln) || ln.trim() === "---") {
      flush(); out.push({ kind: "text", text: ln.trim() });
    } else {
      buf.push(ln.trim());
    }
  }
  flush();
  return out;
}

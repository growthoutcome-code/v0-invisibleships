"use client";
// Renders a glossary definition body with markdown links preserved.
// External links (http/https) open in a new tab (rel=noopener); internal
// links (/glossary/...) use client-side navigation. Used by the standalone
// term route and the in-app glossary reader.
import Link from "next/link";
import React from "react";
import { stripHeadings } from "@/lib/glossary-format";

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = new RegExp(LINK.source, "g");
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2];
    if (/^https?:\/\//i.test(href)) {
      out.push(
        <a
          key={`${keyBase}-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:opacity-80"
        >
          {label}
        </a>
      );
    } else {
      out.push(
        <Link
          key={`${keyBase}-${i}`}
          href={href}
          className="text-accent underline underline-offset-2 hover:opacity-80"
        >
          {label}
        </Link>
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function GlossaryBody({ text }: { text: string }) {
  const body = stripHeadings(text || "")
    .replace(/\*+/g, "")
    .trim();
  const paras = body.split(/\n{2,}/);
  return (
    <div className="font-serif text-[27px] text-foreground/90 leading-[1.6] space-y-5">
      {paras.map((p, idx) => (
        <p key={idx} className="whitespace-pre-wrap">
          {renderInline(p, `p${idx}`)}
        </p>
      ))}
    </div>
  );
}

/**
 * Renders one journal entry's markdown as prose.
 *
 * A deliberately small subset, matching what the entries actually contain:
 * paragraphs, **bold**, *italic*, [label](url), and <someone@example.com>.
 * Heading lines and horizontal rules are dropped — an entry's own "###" is a
 * separator inside a document, not something a page section needs.
 *
 * WHY NOT A MARKDOWN LIBRARY. This renders the archive's primary source on an
 * ungated page. A general renderer would also render whatever else turned up in
 * an entry — raw HTML, images, scripts pasted out of a transcript — and the one
 * thing that must never happen here is the record being able to inject markup
 * into the site that quotes it. This handles four constructs and passes
 * everything else through as text.
 */
import type { ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\)|<[^\s@<>]+@[^\s@<>]+>)/g;

function inline(text: string, key: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      const k = `${key}-${i}`;
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*")) return <em key={k}>{part.slice(1, -1)}</em>;
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) {
        return (
          <a key={k} href={link[2]} target="_blank" rel="noreferrer noopener"
             className="underline underline-offset-4">
            {link[1]}
          </a>
        );
      }
      const mail = /^<([^\s@<>]+@[^\s@<>]+)>$/.exec(part);
      if (mail) return <a key={k} href={`mailto:${mail[1]}`} className="underline underline-offset-4">{mail[1]}</a>;
      return <span key={k}>{part}</span>;
    });
}

export default function EntryProse({ body, className = "" }: { body: string; className?: string }) {
  const paras = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    // Drop bare heading and rule lines; keep headings that carry text, as text.
    .filter((b) => !/^#{1,6}\s*$/.test(b) && !/^([-*_]\s*){3,}$/.test(b))
    .map((b) => b.replace(/^#{1,6}\s*/, ""));

  return (
    <div className={className}>
      {paras.map((b, i) => (
        <p key={i} className={i === 0 ? "m-0" : "mt-5"}>
          {inline(b, `p${i}`)}
        </p>
      ))}
    </div>
  );
}

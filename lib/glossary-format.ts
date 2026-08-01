// Shared glossary/definition formatting — used by the in-app browser, the
// standalone term routes, and server-side metadata. Pure string helpers only
// (no JSX) so they're safe to import from server components.

// Strip markdown headings anywhere in a definition (some entries lead with "## term").
export function stripHeadings(str: string) {
  return (str || "").replace(/^\s*#{1,6}\s+.*(?:\n|$)/gm, "");
}
// Some term names carry raw markdown (links, bold). Render/​share them clean.
export function cleanTerm(str: string) {
  return (str || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*+/g, "").trim();
}
export function cleanDef(str: string) {
  return stripHeadings(str)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/\*+/g, "")                      // bold/italic markers
    .replace(/\n{3,}/g, "\n\n")               // collapse extra blank lines
    .trim();
}
// A definition may lead with a short pronunciation line, separated by a blank line.
export function splitDef(def?: string) {
  const cleaned = stripHeadings(def || "").trim();
  const parts: string[] = cleaned.split("\n\n");
  const pron = parts.length > 1 && parts[0].length < 80 ? parts[0].trim().replace(/\*+/g, "") : "";
  const body = pron ? parts.slice(1).join("\n\n") : cleaned;
  return { pron, body };
}
// One-line plain-text summary for meta descriptions / cards.
export function defSummary(def: string, n = 200) {
  const t = cleanDef(def).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
}

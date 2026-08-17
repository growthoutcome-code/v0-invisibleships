"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";
import ShareMenu from "@/components/ShareMenu";

const REPORT = "/reports/gov-cloud-dashboard.html";
const SITE = "Invisible Ships";

/**
 * Government Cloud research report.
 *
 * The report is a self-contained HTML document (no external scripts, no fetches,
 * data inlined) and is served verbatim from /public/reports. It renders inside an
 * iframe on purpose:
 *
 *  - Its stylesheet cannot leak into the site, and globals.css cannot leak into it.
 *    The site's monochrome chrome stays absolute; the report keeps its own palette
 *    and reads as a document being viewed, not as site chrome that turned colourful.
 *  - It stays byte-identical to what was produced, so the evidence isn't reshaped
 *    by a port.
 *
 * The frame auto-sizes to its content so the PAGE scrolls as one — no nested
 * scrollbar. Content height is read from the loaded document; if that's blocked
 * for any reason we fall back to a tall fixed frame that scrolls internally.
 */
export default function DataView() {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const measure = () => {
      try {
        const doc = el.contentDocument;
        if (!doc?.body) return;
        const h = Math.max(
          doc.body.scrollHeight,
          doc.documentElement?.scrollHeight || 0
        );
        if (h > 0) setHeight(h);
      } catch {
        setFailed(true); // cross-origin or blocked — fall back to a fixed frame
      }
    };

    const onLoad = () => {
      measure();
      // Re-measure after fonts/layout settle, and on viewport resize, since the
      // report reflows responsively.
      raf = window.setTimeout(measure, 400) as unknown as number;
      try {
        const win = el.contentWindow;
        if (win) win.addEventListener("resize", measure);
      } catch { /* ignore */ }
    };

    el.addEventListener("load", onLoad);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("load", onLoad);
      window.removeEventListener("resize", measure);
      window.clearTimeout(raf);
    };
  }, []);

  useEffect(() => { track("data_report_viewed"); }, []);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-6 mb-1">
        <p className="body-copy text-foreground/80 max-w-[70ch]">
          Government cloud adoption, procurement, regulation, investment, litigation and
          platform capabilities — compiled from public sources. Every fact carries an
          evidence tier and links to its source.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={REPORT}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("data_report_opened_standalone")}
            className="text-sm text-accent hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            Open full report <ExternalLink size={14} />
          </a>
          <ShareMenu title={`${SITE} — Data`} align="right" />
        </div>
      </div>

      <iframe
        ref={ref}
        src={REPORT}
        title="Government Cloud research report"
        loading="lazy"
        className="w-full block mt-6"
        style={{ height: height ? `${height}px` : failed ? "1800px" : "1200px" }}
        // The document is our own and fully self-contained; no scripts of ours
        // run inside it and it makes no network calls.
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  );
}

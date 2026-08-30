"use client";

/**
 * The corpus export dialog.
 *
 * Lifted out of JournalBrowser unchanged. It was a local function in a
 * 900-line component, which meant the one place in the product that explains
 * what the download IS could only be opened from inside the app — the home
 * page, where most readers now arrive, had a bare link to a zip with no
 * account of what was in it.
 *
 * Same words, same numbers, one owner, two call sites.
 */
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import { track } from "@/lib/analytics";

const approx = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1000).toLocaleString()},000` : String(n);

export default function ExportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const c = CORPUS_SUMMARY;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* xl: this is the one modal with tabular content, so it earns the widest
        * step. Height bounding and the pinned footer now come from the primitive. */}
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Export the corpus</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <p className="body-copy text-foreground/80">
            The complete research archive behind this site — <strong>{c.files} files</strong>,
            of which <strong>{c.markdown} are Markdown</strong>, about{" "}
            <strong>{approx(c.words)} words</strong>. Built to be handed to an AI
            assistant: every file opens with a metadata header and holds one
            coherent unit, so a single file still identifies itself when pasted
            into a chat on its own.
          </p>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-px rounded border border-border p-px text-sm">
            {c.folders.map((f) => (
              <div key={f.key} className="flex gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{f.label}</div>
                  <div className="text-xs text-muted">{f.blurb}</div>
                </div>
                <div className="shrink-0 text-right text-xs text-muted tabular-nums pt-0.5">
                  {f.markdown} md
                  {f.data > 0 && <div className="opacity-70">{f.data} data</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <p className="text-xs text-muted">
              Sized to be usable: the typical file is about {c.medianWords} words
              and the longest is around {approx(c.largestWords)}. <strong>Do not
              try to upload all {c.files} at once</strong> — open{" "}
              <code className="text-[11px]">START-HERE.md</code> in the zip and it
              names the folder that answers your question. The row data is also
              included as CSV for your own analysis.
            </p>
            <p className="text-xs text-muted">
              The files carry the author&rsquo;s copyright and Critical Disclaimer. Please use them in their complete, original form.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <a className="sm:ml-auto" href="/api/corpus?from=export_dialog" download onClick={() => track("export_downloaded")}>
            <Button className="w-full sm:w-auto">Download .zip ({(c.zipBytes / 1e6).toFixed(1)} MB)</Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

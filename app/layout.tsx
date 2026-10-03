import type { Metadata } from "next";
import "./globals.css";
import AnalyticsInit from "@/components/AnalyticsInit";
import EntryGate from "@/components/EntryGate";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.invisibleships.com"),
  title: "Invisible Ships — Journal Browser",
  description: "Discovery of Neuro-tech Terrorism — journal, transcripts, and glossary.",
  openGraph: {
    title: "Invisible Ships",
    description: "A firsthand documentary archive of neuro-tech terrorism — journal, transcripts, and glossary.",
    siteName: "Invisible Ships",
    url: "/",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invisible Ships",
    description: "A firsthand documentary archive of neuro-tech terrorism — journal, transcripts, and glossary.",
    images: ["/og-default.png"],
  },
};

// Runs before paint (no flash): use the visitor's saved choice if they have
// one; otherwise default by their local time of day — light 6am–6pm, dark
// 6pm–6am. The header toggle overrides and is remembered.
const themeScript = `
(function(){try{
  var t=localStorage.getItem('is_theme');
  if(t!=='light'&&t!=='dark'){var h=new Date().getHours();t=(h>=6&&h<18)?'light':'dark';}
  var e=document.documentElement;
  if(t==='dark'){e.classList.add('dark');}else{e.classList.remove('dark');}
  e.style.colorScheme=t;
}catch(_){document.documentElement.classList.add('dark');}})();
`;

// Keeps browser translation from crashing the site (3 Oct 2026).
//
// Chrome's built-in translator, and Edge's, rewrite the page's text in place,
// wrapping words in <font> elements that React does not know about. The next
// time React updates that part of the page it asks the browser to remove or
// insert next to a node that has moved, the browser throws, and the
// interactive part of the page (filters, dialogs, the News export) goes blank.
// Reported to Chromium as issue 41407169 and open for years; this is the
// widely used workaround.
//
// When the node React names is no longer where React thinks it is, the call is
// skipped instead of throwing. Nothing else changes: untranslated pages never
// reach the skipped branch. The cost, only under a translator, is that a piece
// of text React tried to update may keep its old translated wording until the
// reader reloads, which is better than a blank page.
//
// Readers in other languages are pointed to browser translation by the gate
// (lib/gate-languages.ts), so this protects the very route the site recommends.
const translationGuardScript = `
(function(){try{
  if(typeof Node!=='function'||!Node.prototype||Node.prototype.__isTranslationGuard)return;
  var rm=Node.prototype.removeChild, ins=Node.prototype.insertBefore;
  Node.prototype.removeChild=function(child){
    if(child&&child.parentNode!==this){return child;}
    return rm.apply(this,arguments);
  };
  Node.prototype.insertBefore=function(node,ref){
    if(ref&&ref.parentNode!==this){return node;}
    return ins.apply(this,arguments);
  };
  Node.prototype.__isTranslationGuard=true;
}catch(_){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: translationGuardScript }} />
      </head>
      <body>
        <AnalyticsInit />
        {children}
        {/* The entry gate: content warning, perceptual set, and the full
            disclaimer, in one wizard over the page. Mounted in the root layout
            so it covers every route including the item pages people are linked
            to directly, and remembered for the browser session. It replaced
            components/ContentWarning.tsx on 15 September. */}
        <EntryGate />
      </body>
    </html>
  );
}

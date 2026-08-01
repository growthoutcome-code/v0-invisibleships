import type { Metadata } from "next";
import "./globals.css";
import AnalyticsInit from "@/components/AnalyticsInit";

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
      </head>
      <body>
        <AnalyticsInit />
        {children}
      </body>
    </html>
  );
}

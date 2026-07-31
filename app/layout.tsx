import type { Metadata } from "next";
import "./globals.css";
import AnalyticsInit from "@/components/AnalyticsInit";

export const metadata: Metadata = {
  title: "Invisible Ships — Journal Browser",
  description: "Discovery of Neuro-tech Terrorism — journal, transcripts, and glossary.",
};

// Runs before paint: applies the saved theme, or the OS preference on first
// visit, so there is no light/dark flash on load.
const themeScript = `
(function(){try{
  var t=localStorage.getItem('is_theme');
  if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&family=Inter:wght@400;500;600&display=swap"
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

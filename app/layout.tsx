import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import AnalyticsInit from "@/components/AnalyticsInit";

const GA_ID = "G-VXMCM15XTH";

export const metadata: Metadata = {
  title: "Invisible Ships — Journal Browser",
  description: "Discovery of Neuro-tech Terrorism — journal, transcripts, and glossary.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <AnalyticsInit />
        {children}
      </body>
    </html>
  );
}

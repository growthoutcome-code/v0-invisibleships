import type { Metadata } from "next";
import "./globals.css";
import AnalyticsInit from "@/components/AnalyticsInit";

export const metadata: Metadata = {
  title: "Invisible Ships — Journal Browser",
  description: "Discovery of Neuro-tech Terrorism — journal, transcripts, and glossary.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AnalyticsInit />
        {children}
      </body>
    </html>
  );
}

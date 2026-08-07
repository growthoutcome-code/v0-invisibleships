import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Disclaimer — Invisible Ships",
  alternates: { canonical: "/disclaimer" },
};

// Clean section route: /disclaimer
export default function Page() {
  return <GatedApp initialTab="disclaimer" />;
}

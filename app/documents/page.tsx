import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Documents — Invisible Ships",
  alternates: { canonical: "/documents" },
};

// Clean section route: /documents
export default function Page() {
  return <GatedApp initialTab="documents" />;
}

import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Glossary — Invisible Ships",
  alternates: { canonical: "/glossary" },
};

// Clean section route: /glossary
export default function Page() {
  return <GatedApp initialTab="glossary" />;
}

import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Concepts — Invisible Ships",
  description: "Core concepts, each labelled with the basis it rests on: documented, structural, or pattern.",
  alternates: { canonical: "/concepts" },
};

// Clean section route: /concepts
export default function Page() {
  return <GatedApp initialTab="concepts" />;
}

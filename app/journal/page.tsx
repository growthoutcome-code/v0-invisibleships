import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Journal — Invisible Ships",
  alternates: { canonical: "/journal" },
};

// Clean section route: /journal (the feed). Item routes live at /journal/[id].
export default function Page() {
  return <GatedApp initialTab="journal" />;
}

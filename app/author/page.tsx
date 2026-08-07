import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Author — Invisible Ships",
  alternates: { canonical: "/author" },
};

// Clean section route: /author
export default function Page() {
  return <GatedApp initialTab="author" />;
}

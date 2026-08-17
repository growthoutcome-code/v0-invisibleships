import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Data — Invisible Ships",
  description: "Government Cloud research: adoption, procurement, timeline, investment, litigation and capabilities.",
  alternates: { canonical: "/data" },
};

// Clean section route: /data
export default function Page() {
  return <GatedApp initialTab="data" />;
}

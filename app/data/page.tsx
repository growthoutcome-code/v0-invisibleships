import type { Metadata } from "next";
import GatedApp from "@/components/GatedApp";

export const metadata: Metadata = {
  title: "Research — Invisible Ships",
  description: "Government Cloud procurement, public health, crime, the master timeline, and the concepts drawn from all of them.",
  alternates: { canonical: "/data" },
};

// Clean section route: /data
export default function Page() {
  return <GatedApp initialTab="data" />;
}

// Was the gate wrapper for the standalone item routes at /journal/[id] and
// /glossary/[slug]. The gate is gone (see components/GatedApp.tsx), so this
// passes its children straight through.
//
// This is not only a removal. The old version was a client component that
// rendered `null` until a sessionStorage check ran in an effect, which meant
// every journal entry and glossary term served EMPTY server HTML and only
// appeared after hydration. Those 438 URLs are in the sitemap. They now render
// on the server, with their text present in the response.
//
// Kept as a seam rather than deleted from both route files: if a subset of the
// archive ever needs an interstitial, this is the one place it goes.
import StandingDisclaimer from "@/components/StandingDisclaimer";

// The standing disclaimer rides on this seam rather than on each route file.
// These are the pages a stranger is most likely to land on directly — a
// forwarded link to one transcript — and the ones where a verbatim recording
// with names in it needs the archive's position attached to it.
export default function ItemGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StandingDisclaimer />
    </>
  );
}

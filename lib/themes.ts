// Theme tags shared by the journal and the concepts (Sean, 30 Sep 2026).
// Definitions and how they are assigned: project/theme-tags.md. Stored as
// categories of kind "theme" (journal) and as `topics` on each concept.
// A theme says what a document CONTAINS, never that it is true — every
// statement in the journal is an external communication (the disclaimer).
export const THEMES: Record<string, string> = {
  "proposed-solutions": "Proposed solutions",
  "harassment": "Harassment",
  "speculation": "Speculation",
  "technology": "Technology",
  "nanotechnology": "Nanotechnology",
  "death-threats": "Death threats",
  "euthanization": "Euthanization",
  "obedience-coercion": "Obedience & coercion",
  "violence": "Violence",
  "sexual-harassment": "Sexual harassment",
  "surveillance": "Surveillance & memory access",
  "terrorism": "Terrorism",
  "law-government": "Law enforcement & government",
  "family-network": "Family & personal network",
  "health-effects": "Health & physical effects",
  "rescue-announcements": "Rescue & public announcements",
};

export const isTheme = (slug: string) => slug in THEMES;
/** Organizations named in a document are categories with this prefix. */
export const ORG_PREFIX = "org-";
export const isOrg = (slug: string) => slug.startsWith(ORG_PREFIX);

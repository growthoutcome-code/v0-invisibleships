/**
 * The data for the bottom sections under every page except the home page
 * (components/BottomSections.tsx). Built at BUILD time from the same builders
 * the home page uses (lib/home-sections.ts) and served as a static file, so it
 * costs no function call and cannot drift from the home sections it copies.
 *
 * Fetched only when a reader scrolls near the bottom of a page, so the page
 * above loads no slower for it.
 */
import { bottomSectionsData } from "@/lib/home-sections";

export const dynamic = "force-static";

export function GET() {
  return Response.json(bottomSectionsData());
}

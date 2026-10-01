"use client";

import ShareMenu from "@/components/ShareMenu";

/**
 * A small share icon for a card, tile or list item (Sean, 30 Sep 2026: "include
 * little share icons on tiles or cards ... on the truncated posts and any
 * lists"). It shares that item's own link, not the page it sits on.
 *
 * Sits BESIDE the card's link, never inside it: a button inside an <a> is
 * invalid and a tap on it would open the card. Callers wrap the card in a
 * `relative` box and position this in a corner.
 */
const ORIGIN = "https://www.invisibleships.com";

export default function CardShare({
  title, path, url, className = "",
}: {
  title: string;
  /** site path, e.g. /concepts/can-you-record-it */
  path?: string;
  /** full URL, for things off the site (the original documents) */
  url?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ShareMenu title={`${title} — Invisible Ships`} url={url || ORIGIN + (path || "")} label="" align="right" />
    </div>
  );
}

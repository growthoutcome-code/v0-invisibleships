// Free, dependency-free social sharing: native Web Share API when available,
// otherwise per-platform intent URLs. Every share fires `share_clicked` so
// PostHog + GA can measure it. Links only — never copied excerpts (per the
// author's copyright: distribute the whole work, don't republish parts).
import { track } from "@/lib/analytics";

export type SharePlatform =
  | "native"
  | "copy"
  | "x"
  | "facebook"
  | "linkedin"
  | "reddit"
  | "whatsapp"
  | "email";

export type ShareTarget = {
  /** Canonical URL to share. Defaults to the current page at click time. */
  url?: string;
  /** Short title/headline for the share (no excerpt). */
  title: string;
};

function resolve(t: ShareTarget) {
  const url =
    t.url || (typeof window !== "undefined" ? window.location.href : "");
  return { url, title: t.title };
}

/** Build a platform intent URL (used for the fallback link buttons). */
export function intentUrl(platform: SharePlatform, t: ShareTarget): string {
  const { url, title } = resolve(t);
  const u = encodeURIComponent(url);
  const txt = encodeURIComponent(title);
  const txtUrl = encodeURIComponent(`${title} ${url}`);
  switch (platform) {
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${txt}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${u}&title=${txt}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${txtUrl}`;
    case "email":
      return `mailto:?subject=${txt}&body=${txtUrl}`;
    default:
      return url;
  }
}

/** True if the browser exposes the native Web Share sheet. */
export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Trigger the OS/browser native share sheet. Resolves false if unavailable/cancelled. */
export async function nativeShare(t: ShareTarget): Promise<boolean> {
  const { url, title } = resolve(t);
  if (!canNativeShare()) return false;
  try {
    await navigator.share({ title, text: title, url });
    track("share_clicked", { platform: "native", url });
    return true;
  } catch {
    // user cancelled or share failed — no tracking, no error surfaced
    return false;
  }
}

/** Copy the link to the clipboard. Resolves true on success. */
export async function copyLink(t: ShareTarget): Promise<boolean> {
  const { url } = resolve(t);
  try {
    await navigator.clipboard.writeText(url);
    track("share_clicked", { platform: "copy", url });
    return true;
  } catch {
    return false;
  }
}

/** Open a platform share window and record the click. */
export function shareTo(platform: SharePlatform, t: ShareTarget) {
  const { url } = resolve(t);
  track("share_clicked", { platform, url });
  if (platform === "email") {
    window.location.href = intentUrl(platform, t);
    return;
  }
  window.open(intentUrl(platform, t), "_blank", "noopener,noreferrer,width=620,height=560");
}

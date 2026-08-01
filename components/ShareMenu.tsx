"use client";
import { useEffect, useRef, useState } from "react";
import { Share2, Link2, Check, Mail } from "lucide-react";
import {
  type ShareTarget,
  type SharePlatform,
  canNativeShare,
  nativeShare,
  copyLink,
  shareTo,
} from "@/lib/share";

const PLATFORMS: { key: SharePlatform; label: string }[] = [
  { key: "x", label: "X / Twitter" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "reddit", label: "Reddit" },
  { key: "whatsapp", label: "WhatsApp" },
];

export default function ShareMenu({
  title,
  url,
  label = "Share",
  align = "left",
  className = "",
}: ShareTarget & {
  /** Button text; pass "" for an icon-only trigger. */
  label?: string;
  /** Popover alignment relative to the trigger. */
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNative, setHasNative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setHasNative(canNativeShare()), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const target: ShareTarget = { title, url };
  const iconOnly = label === "";

  const onNative = async () => {
    await nativeShare(target);
    setOpen(false);
  };
  const onCopy = async () => {
    const ok = await copyLink(target);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  const onPlatform = (p: SharePlatform) => {
    shareTo(p, target);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share"
        title="Share"
        className={
          iconOnly
            ? "inline-flex items-center justify-center h-9 w-9 text-muted hover:text-foreground hover:bg-accent/10 transition-colors"
            : "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
        }
      >
        <Share2 size={iconOnly ? 17 : 15} />
        {!iconOnly && label}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 w-52 bg-panel shadow-lg py-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {hasNative && (
            <button role="menuitem" onClick={onNative} className={itemCls}>
              <Share2 size={15} /> Share…
            </button>
          )}
          <button role="menuitem" onClick={onCopy} className={itemCls}>
            {copied ? <Check size={15} /> : <Link2 size={15} />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          <div className="my-1 h-px bg-edge" />
          {PLATFORMS.map((p) => (
            <button key={p.key} role="menuitem" onClick={() => onPlatform(p.key)} className={itemCls}>
              {p.label}
            </button>
          ))}
          <button role="menuitem" onClick={() => onPlatform("email")} className={itemCls}>
            <Mail size={15} /> Email
          </button>
        </div>
      )}
    </div>
  );
}

const itemCls =
  "w-full text-left px-3 py-2 text-[13px] text-foreground/85 hover:bg-accent/10 hover:text-foreground inline-flex items-center gap-2 transition-colors";

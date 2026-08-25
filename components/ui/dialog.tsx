"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/* One width scale for every modal on the site.
 *
 * Before this, each modal invented its own: the disclaimer was 820px, the health
 * provenance panel 720px, the four crime chart modals 720px, the export dialog
 * 512px (the shadcn default nobody had overridden), and the gate 672px. Nothing
 * was wrong individually; together they read as five different products.
 *
 * The scale is deliberately coarse — four steps — because a modal that needs a
 * width between two of these usually needs less content instead.
 */
export const DIALOG_SIZES = {
  sm: "max-w-md",    // 448px — confirm / single question
  md: "max-w-2xl",   // 672px — a chart's detail, a definition
  lg: "max-w-3xl",   // 768px — long prose, the disclaimer
  xl: "max-w-4xl",   // 896px — tabular or multi-column content
} as const;
export type DialogSize = keyof typeof DIALOG_SIZES;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: DialogSize }
>(({ className, children, size = "md", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid -translate-x-1/2 -translate-y-1/2 bg-panel shadow-lg duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        // Mobile: never touch the edges of the screen, and never assume the
        // viewport is tall. `w-[calc(100vw-2rem)]` gives a gutter on phones;
        // `w-full` alone let content set the width and overflow small screens.
        "w-[calc(100vw-2rem)] sm:w-full",
        // The height rule that matters. This element is centred with
        // -translate-y-1/2, so an unbounded body grows off the TOP and BOTTOM of
        // the window at once, carrying the primary action out of reach with it.
        // Sean hit exactly that on the export dialog: a tall list, and no way to
        // click Download. Bounded here so no call site can forget.
        "max-h-[calc(100dvh-2rem)] sm:max-h-[85vh]",
        // Rows: header / body / footer. The body is the only row that scrolls,
        // and `minmax(0,1fr)` is what permits it to shrink — with a plain `1fr`
        // the row refuses to go below its content and the overflow escapes again.
        "grid-rows-[auto_minmax(0,1fr)_auto]",
        DIALOG_SIZES[size],
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 text-muted transition-colors hover:text-foreground focus:outline-none disabled:pointer-events-none">
        <X size={20} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/* The scrolling middle. Everything that can grow goes in here, so the header
 * stays put and the footer stays clickable. */
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("overflow-y-auto px-6 py-5 space-y-5", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 px-6 pt-6 pb-4 border-b border-border pr-12", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

/* Pinned, not scrolled. The whole point is that the primary action is reachable
 * whatever the body is doing. */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:items-center gap-3 px-6 py-4 border-t border-border bg-panel",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("font-display text-lg font-semibold text-foreground", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose,
  DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription,
};

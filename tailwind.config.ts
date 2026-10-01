import type { Config } from "tailwindcss";

// Themeable tokens read from CSS variables (defined in globals.css as RGB
// channel triplets) so every color responds to the light/dark class and
// still supports Tailwind's /opacity modifiers.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // app palette (theme-aware)
        ink: v("background"), panel: v("panel"), edge: v("edge"),
        muted: v("muted"), accent: v("accent"),
        // fixed severity colors (read fine on both themes)
        crit: "#ef4444", high: "#f59e0b", med: "#eab308", low: "#22c55e",
        // shadcn tokens mapped to the same variables (so ui components match)
        background: v("background"), foreground: v("foreground"),
        primary: v("accent"), "primary-foreground": v("primary-foreground"),
        card: v("panel"), "card-foreground": v("foreground"),
        border: v("edge"), input: v("edge"), ring: v("accent"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
      // TEMPORARY: angular / sharp edges everywhere. Every rounded-* utility
      // resolves to 0. Remove this block to restore rounded corners.
      borderRadius: {
        none: "0", sm: "0", DEFAULT: "0", md: "0", lg: "0",
        xl: "0", "2xl": "0", "3xl": "0", full: "0",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      // `backwards`, not `both` (Sean, 30 Sep 2026: modals "vertically off position").
      // `both` kept transform: translateY(0) on the element after the animation
      // ended, and any transform makes the element the containing block for
      // position: fixed descendants — so every fixed pop-up inside the page (the
      // Government Cloud and Crime detail windows) was placed against the tall
      // content column instead of the screen. `backwards` holds the start frame
      // only until the animation begins and then lets go, leaving no transform.
      animation: { "fade-in": "fade-in .4s ease-out backwards" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

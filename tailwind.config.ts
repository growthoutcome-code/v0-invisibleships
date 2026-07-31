import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // existing app palette
        ink: "#0f1216", panel: "#161b22", edge: "#232a34",
        muted: "#8b97a7", accent: "#4a9eff",
        crit: "#ef4444", high: "#f59e0b", med: "#eab308", low: "#22c55e",
        // shadcn tokens mapped to the same palette (so ui components match)
        background: "#0f1216", foreground: "#e6eaf0",
        primary: "#4a9eff", "primary-foreground": "#0a0e14",
        card: "#161b22", "card-foreground": "#e6eaf0",
        border: "#232a34", input: "#232a34", ring: "#4a9eff",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { "fade-in": "fade-in .4s ease-out both" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

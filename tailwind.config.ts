import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1216", panel: "#161b22", edge: "#232a34",
        muted: "#8b97a7", accent: "#4a9eff",
        crit: "#ef4444", high: "#f59e0b", med: "#eab308", low: "#22c55e",
      },
    },
  },
  plugins: [],
};
export default config;

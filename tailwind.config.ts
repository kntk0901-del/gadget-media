import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        bg: { DEFAULT: "#0a0a0c", soft: "#101014", elev: "#16161c" },
        ink: { DEFAULT: "#ececf0", soft: "#b3b3bd", muted: "#7a7a85", line: "#23232b" },
        accent: { DEFAULT: "#7ce4d4", hover: "#8defde", deep: "#3aa897" },
        warn: "#f5a96b",
        live: "#ff5277",
      },
      letterSpacing: { tightish: "-0.012em" },
      boxShadow: {
        ring: "0 0 0 1px rgba(255,255,255,0.06)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -30px rgba(0,0,0,0.6)",
      },
      keyframes: {
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        in: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { pulse2: "pulse2 1.6s ease-in-out infinite", in: "in 0.35s ease-out both" },
    },
  },
  plugins: [],
};
export default config;

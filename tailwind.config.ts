import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1d29", // near-black ledger ink
        paper: "#f7f4ee", // warm paper, not AI cream
        line: "#d9d2c5", // hairline rules
        muted: "#6b6557", // secondary text
        pathA: "#c77b30", // Austin / option A - burnt amber
        pathAsoft: "#f0d9bd",
        pathB: "#2f7d77", // SF / option B - deep teal
        pathBsoft: "#c5e0dc",
        verdict: "#1a1d29",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { card: "2px" },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FAF8F5", subtle: "#F0EDE8" },
        text: {
          DEFAULT: "#1A1A1A",
          secondary: "#4A4A4A",
          muted: "#8A8A8A",
        },
        accent: { DEFAULT: "#1B4965", light: "#E8EFF4" },
        border: "#E0DCD6",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Source Serif 4", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      lineHeight: {
        reading: "1.75",
      },
    },
  },
  plugins: [],
};
export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Premium dark charcoal system — no green anywhere.
        paper: "#0D0F12",          // primary background (formerly cream)
        charcoal: {
          section: "#14171C",      // secondary section background
          card: "#1A1E24",         // card background
          elevated: "#20252C",     // elevated card / icon wells
          footer: "#08090B",       // footer background
        },
        ink: "#F5F3EE",            // primary text — warm ivory, not pure white
        muted: "#A5A9B0",          // secondary text
        faint: "#737780",          // muted / label text
        line: "#2B3038",           // borders, dividers
        signal: {
          DEFAULT: "#FF6B4A",      // coral — primary CTA / main action color
          dark: "#FF8063",         // coral hover (lighter, not darker, on dark bg)
          light: "#2A1B16",        // subtle coral-tinted well for badges/icons
        },
        teal: {
          DEFAULT: "#6C8CFF",      // secondary accent (blue) — replaces old brand-teal role
          dark: "#5A76E0",
          light: "#AFC0FF",        // soft blue
        },
        gold: {
          DEFAULT: "#FBBF24",      // ratings / review stars only
          light: "#3A2E12",
        },
        success: "#4ADE80",
        warning: "#FBBF24",
        danger: "#FF6B6B",
        footerlink: "#A5A9B0",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.02) inset, 0 10px 30px rgba(0,0,0,0.28)",
        "card-hover": "0 1px 0 rgba(255,255,255,0.03) inset, 0 16px 40px rgba(0,0,0,0.36)",
        btn: "0 6px 18px rgba(255, 107, 74, 0.28)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "80%": { transform: "scale(1.9)", opacity: "0" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        floatDot: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        floatDot: "floatDot 3.2s ease-in-out infinite",
        fadeUp: "fadeUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

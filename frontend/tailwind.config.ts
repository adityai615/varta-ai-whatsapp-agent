import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: "#25D366",
          bg: "#F0F2F5",
          bubble: "#DCF8C6",
          text: "#111B21",
          muted: "#667781",
          border: "#E9EDEF",
          dark: "#0B141A",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        card: "16px",
      },
      keyframes: {
        popIn: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        typing: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "50%": { transform: "translateY(-2px)", opacity: "1" },
        },
      },
      animation: {
        popIn: "popIn 160ms ease-out",
        fadeIn: "fadeIn 220ms ease-out",
        typing1: "typing 900ms ease-in-out infinite",
        typing2: "typing 900ms ease-in-out infinite 150ms",
        typing3: "typing 900ms ease-in-out infinite 300ms",
      },
    },
  },
  plugins: [],
} satisfies Config;


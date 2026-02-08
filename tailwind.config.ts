import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(240 5% 84%)",
        input: "hsl(240 5% 96%)",
        ring: "hsl(240 5% 65%)",
        background: "#f5f5f7",
        foreground: "#111827",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#111827"
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280"
        },
        accent: {
          DEFAULT: "#0f766e",
          foreground: "#ecfeff"
        }
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.25rem",
        full: "9999px"
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: [],
};

export default config;

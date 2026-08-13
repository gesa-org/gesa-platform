import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        primary: {
          DEFAULT: "var(--primary)",
          600: "var(--primary-600)",
          fg: "var(--primary-fg)",
        },
        secondary: "var(--secondary)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        clay: {
          DEFAULT: "var(--clay)",
          soft: "var(--clay-soft)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          fg: "var(--muted-fg)",
        },
        border: "var(--border)",
        destructive: "var(--destructive)",
        amber: {
          DEFAULT: "var(--amber)",
          soft: "var(--amber-soft)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      borderRadius: {
        lg: "var(--radius)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(74,64,44,.04),0 12px 30px -16px rgba(74,64,44,.18)",
        lg: "0 2px 8px rgba(74,64,44,.06),0 30px 60px -24px rgba(74,64,44,.26)",
      },
    },
  },
  plugins: [],
};
export default config;

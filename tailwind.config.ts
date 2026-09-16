import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Phase 199 (mobile responsiveness pass) — Tailwind ships sm(640)/
      // md(768)/lg(1024)/xl(1280)/2xl(1536) by default with nothing between
      // "no breakpoint" and 640px, but the header/nav cluster and several
      // card grids need a distinction inside that gap (the smallest common
      // phones — 320-390px — vs. larger phones/phablets — 400-639px).
      // Defined under `extend`, not `theme.screens` directly, so it adds
      // `xs` alongside the defaults instead of replacing them.
      screens: {
        xs: "400px",
      },
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
        // Phase 68 — a distinct, slightly more visibly green light-sage
        // token (see app/globals.css) for full-width section bands, kept
        // separate from accent.soft so retuning it never affects the many
        // existing bg-accent-soft chip/badge/glow usages site-wide.
        sage: {
          soft: "var(--sage-soft)",
        },
        clay: {
          DEFAULT: "var(--clay)",
          soft: "var(--clay-soft)",
        },
        // Roy's "warm ivory" request for the form-modal background (Join as
        // a Volunteer/Professional, booking, intake, AI Matching/Browse
        // Therapist, admin add/invite, etc.) — see app/globals.css's
        // --modal-ivory comment for why this is a dedicated token rather
        // than a retune of --card.
        modal: {
          ivory: "var(--modal-ivory)",
        },
        // Roy's "Sand Brown" (#CBA560) swap for the Founder spotlight, "Why
        // GESA exists," and Our Professionals' directory band section
        // backgrounds — see app/globals.css's --sand-brown comment for why
        // this is a new token rather than a retune of --clay-soft.
        sand: {
          brown: "var(--sand-brown)",
        },
        // Roy's "Green Sage" (#9BA689) swap for the Home Stats row band —
        // see app/globals.css's --green-sage comment for why this is a new
        // token rather than a retune of --sage-soft.
        green: {
          sage: "var(--green-sage)",
        },
        // Roy's "Help us grow"-matching deep navy (~#0B1F3A) swap for the
        // About page's movement band + Founder spotlight and Community's
        // "Choose your pathway" section — see app/globals.css's --navy-deep
        // comment for why this is a new token rather than reusing --primary/
        // --espresso.
        navy: {
          deep: "var(--navy-deep)",
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
        // Phase 36 — explicit names for two roles the existing tokens above
        // don't quite cover: a deep-contrast surface (footer, strong
        // sections) and a plain-English alias for the high-contrast --amber
        // accent. Additive only — nothing above changed shape, so no
        // existing bg-primary/bg-accent/etc. usage anywhere in the app
        // needed to change. --amber went bronze (36) → dark slate (37) →
        // dark bronze-gold again (38); renamed this alias back to "bronze"
        // to match what it currently is rather than leaving the stale
        // Phase 37 name "slate" in place.
        espresso: "var(--espresso)",
        bronze: "var(--amber)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        // Phase 87 — handwriting/cursive font for the About page's founder
        // signature line only (see globals.css's --font-signature).
        signature: ["var(--font-signature)"],
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

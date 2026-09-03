import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import Header, { HEADER_CONTENT_FALLBACK } from "@/components/Header";
import SiteFooterSlot from "@/components/SiteFooterSlot";
import CrisisButton, { CRISIS_BUTTON_CONTENT_FALLBACK } from "@/components/CrisisButton";
import TranslationProvider from "@/components/TranslationProvider";
import SmoothScroll from "@/components/motion/SmoothScroll";
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";
import { FOOTER_CONTENT_FALLBACK } from "@/components/Footer";
import { MAIN_CONTENT_ID } from "@/lib/accessibility/config";
import { getPageContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "GESA (Global Emotional Support Alliance)",
  description: "Global Emotional Support Alliance platform for therapists and patients.",
};

// Phase 35 — fetched here (a Server Component, on every request) rather
// than inside SiteFooterSlot itself, since SiteFooterSlot is a Client
// Component (it needs usePathname()) and can't import the server-only
// Supabase query used by getPageContent.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [footerContent, headerContent, crisisButtonContent] = await Promise.all([
    getPageContent("page_footer", FOOTER_CONTENT_FALLBACK),
    getPageContent("site_header", HEADER_CONTENT_FALLBACK),
    getPageContent("component_crisis_button", CRISIS_BUTTON_CONTENT_FALLBACK),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        {/* Phase 115 — without this, the document renders lang="en"/dir
            (implicitly ltr) for the first paint on every request, even for
            a returning visitor who already chose Hebrew, and only flips to
            rtl/he once TranslationProvider's client-side effect runs a
            moment after hydration — a visible flash of LTR English-shaped
            layout on every navigation for Hebrew users. next/script's
            `beforeInteractive` strategy is Next's own supported way to run
            a script before hydration in the App Router (valid only in this
            root layout, placed in `<body>` per Next's own docs — Next
            hoists it into `<head>` at build time regardless of where it's
            written here); this only reads localStorage and flips two
            attributes — no state, no React — so it can't drift from what
            TranslationProvider itself does on mount. Uses the component's
            `children` (a JSX-embedded string), not
            `dangerouslySetInnerHTML`, since a raw `<script
            dangerouslySetInnerHTML>` tag is what eslint-config-next's Core
            Web Vitals ruleset flags in the App Router — Next runs ESLint
            during `next build` by default and fails the build on lint
            errors, which is what broke a prior attempt at this exact fix. */}
        <Script id="gesa-sync-lang-dir" strategy="beforeInteractive">
          {`try {
            var l = localStorage.getItem("gesa-lang");
            if (l === "he") {
              document.documentElement.dir = "rtl";
              document.documentElement.lang = "he";
            }
          } catch (e) {}`}
        </Script>
        {/* Phase 45 — SmoothScroll only provides a spring-smoothed scroll-
            progress value via React context (see the long comment in
            components/motion/SmoothScroll.tsx for why it deliberately
            doesn't hijack real scrolling); it renders no wrapping element
            of its own, so it can't affect the sticky Header, the fixed
            footer-reveal layer, or any existing layout math below. */}
        <SmoothScroll>
          <TranslationProvider>
            {/* Phase 90 — AccessibilityProvider/Widget live inside
                TranslationProvider (the widget's Language section calls the
                real useTranslation().setLanguage) but wrap the *entire*
                rest of the shell, not just <main>, so the launcher/panel
                render globally regardless of route and the panel's
                document-level classes (see globals.css) apply to Header/
                Footer/CrisisButton too, not only page content. */}
            <AccessibilityProvider>
              <Header content={headerContent} />
              {/* id/tabIndex added for the widget's "Skip To Content →
                  Main Content" control (components/accessibility/sections/
                  SkipToContentSection.tsx) — this landmark didn't have a
                  stable, focusable id before. */}
              <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
                {children}
              </main>
              {/* Phase 117 — headerContent passed down here too (already
                  fetched above for <Header>) so Footer's Explore column can
                  read the exact same nav labels/hrefs Header renders from —
                  see lib/navigation.ts. */}
              <SiteFooterSlot footerContent={footerContent} headerContent={headerContent} />
              <CrisisButton content={crisisButtonContent} />
              <AccessibilityWidget />
            </AccessibilityProvider>
          </TranslationProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

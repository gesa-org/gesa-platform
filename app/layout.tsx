import type { Metadata } from "next";
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
    <html lang="en">
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
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
              <SiteFooterSlot footerContent={footerContent} />
              <CrisisButton content={crisisButtonContent} />
              <AccessibilityWidget />
            </AccessibilityProvider>
          </TranslationProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

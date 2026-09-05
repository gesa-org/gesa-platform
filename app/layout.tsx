import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { HEADER_CONTENT_FALLBACK } from "@/components/Header";
import { CRISIS_BUTTON_CONTENT_FALLBACK } from "@/components/CrisisButton";
import { FOOTER_CONTENT_FALLBACK } from "@/components/Footer";
import GlobalContentGate from "@/components/ui-builder/public/GlobalContentGate";
import TranslationProvider from "@/components/TranslationProvider";
import SmoothScroll from "@/components/motion/SmoothScroll";
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";
import { MAIN_CONTENT_ID } from "@/lib/accessibility/config";
import { getPageContent } from "@/lib/content";
import { DEFAULT_DESIGN_TOKENS, mergeDesignTokens, type DesignTokens } from "@/lib/ui-builder/types";
import { designTokensToCssText } from "@/lib/ui-builder/tokensToCss";

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
  const [footerContent, headerContent, crisisButtonContent, themeTokensRaw] = await Promise.all([
    getPageContent("page_footer", FOOTER_CONTENT_FALLBACK),
    getPageContent("site_header", HEADER_CONTENT_FALLBACK),
    getPageContent("component_crisis_button", CRISIS_BUTTON_CONTENT_FALLBACK),
    getPageContent<DesignTokens>("theme_tokens", DEFAULT_DESIGN_TOKENS),
  ]);
  // Phase 132 — the UI Builder's published design tokens. mergeDesignTokens
  // re-fills anything missing (a row saved before a new field existed,
  // etc.) rather than trusting the stored JSON shape blindly.
  const themeTokens = mergeDesignTokens(themeTokensRaw);
  const themeTokensCss = designTokensToCssText(themeTokens);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        {/* Phase 132 — server-rendered override of the design tokens the
            admin UI Builder controls (colors + typography). Rendered first,
            right after <body> opens, so it wins the cascade over
            globals.css's :root defaults for every visitor on every request
            — this is the "production tokens" half of Publish; no separate
            CDN sits in front of Vercel here, so app/api/admin/ui-builder/
            publish/route.ts's revalidatePath call is what actually flushes
            the cached render that would otherwise serve the old values for
            up to that route's ISR window. */}
        <style id="gesa-theme-tokens">{`:root { ${themeTokensCss} }`}</style>
        {/* Phase 132 — the admin UI Builder's live-preview iframe loads this
            same site and postMessages draft token edits into it as an admin
            adjusts a color/font control, so the preview reflects changes
            before Publish is ever clicked. Origin-checked and shape-checked
            before touching anything, and entirely inert for every normal
            visitor — no message ever arrives outside that one iframe. Only
            ever writes inline style properties on <html>, never innerHTML
            or any other DOM mutation. */}
        <Script id="gesa-ui-draft-preview-listener" strategy="afterInteractive">
          {`try {
            window.addEventListener("message", function (event) {
              if (event.origin !== window.location.origin) return;
              var data = event.data;
              if (!data || data.type !== "gesa-ui-draft-preview" || typeof data.css !== "string") return;
              var el = document.getElementById("gesa-theme-tokens");
              if (el) el.textContent = ":root { " + data.css + " }";
            });
          } catch (e) {}`}
        </Script>
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
              {/* Phase 140 — Header/Footer/CrisisButton are now registered
                  in the UI Builder's Page Content as the "global" page (see
                  lib/ui-builder/pageRegistry.ts), so an admin's
                  ?editorPreview=true draft can override their text the same
                  way every other page's own content already can. This
                  layout has no `searchParams` prop to gate that server-side
                  (a shared layout can't do that without breaking layout
                  caching for every route), so GlobalContentGate does it
                  client-side — see that file's own comment for the full
                  mechanism. Every prop below is exactly what was already
                  fetched/passed here before this phase; normal visitors see
                  no change at all. */}
              <GlobalContentGate headerContent={headerContent} footerContent={footerContent} crisisButtonContent={crisisButtonContent}>
                {/* id/tabIndex added for the widget's "Skip To Content →
                    Main Content" control (components/accessibility/sections/
                    SkipToContentSection.tsx) — this landmark didn't have a
                    stable, focusable id before. */}
                <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
                  {children}
                </main>
              </GlobalContentGate>
              <AccessibilityWidget />
            </AccessibilityProvider>
          </TranslationProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

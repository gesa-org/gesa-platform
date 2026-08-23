import type { Metadata } from "next";
import "./globals.css";

import Header, { HEADER_CONTENT_FALLBACK } from "@/components/Header";
import SiteFooterSlot from "@/components/SiteFooterSlot";
import CrisisButton from "@/components/CrisisButton";
import TranslationProvider from "@/components/TranslationProvider";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { FOOTER_CONTENT_FALLBACK } from "@/components/Footer";
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
  const [footerContent, headerContent] = await Promise.all([
    getPageContent("page_footer", FOOTER_CONTENT_FALLBACK),
    getPageContent("site_header", HEADER_CONTENT_FALLBACK),
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
            <Header content={headerContent} />
            <main className="flex-1">{children}</main>
            <SiteFooterSlot footerContent={footerContent} />
            <CrisisButton />
          </TranslationProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

import { Compass } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Button from "@/components/ui/Button";
import { getPageContent, NOT_FOUND_CONTENT_FALLBACK } from "@/lib/content";

export const metadata = {
  title: "Page not found — GESA",
};

// Phase 204 — Next.js renders this file automatically for any unmatched
// route (a mistyped URL, a stale bookmark, a dead link) in place of its own
// unstyled default 404. Renders inside the root layout like any other page,
// so it gets the real Header/Footer/CrisisButton for free — no special
// wiring needed for that part. Copy is Content Manager-editable (new "Not
// Found" tab) via the same getPageContent/site_content pattern as every
// other simple page; kept as a plain server-rendered page (no
// EditableText/resolveEditorPreview visual-builder wiring) since a 404 page
// has no real need for inline click-to-select editing — same simpler
// treatment Legal Pages/Media Library/Trusted Partners already get.
export default async function NotFound() {
  const content = await getPageContent("page_not_found", NOT_FOUND_CONTENT_FALLBACK);

  return (
    <PageHero icon={Compass} eyebrow={content.eyebrow} title={content.heading} description={content.body} narrow>
      <Button href="/" className="mt-2">
        {content.ctaLabel}
      </Button>
    </PageHero>
  );
}

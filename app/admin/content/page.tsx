import { getFaqs, getAllLegalPages, getSiteContentMap } from "@/lib/queries";
import { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import { FOOTER_CONTENT_FALLBACK } from "@/components/Footer";
import { HEADER_CONTENT_FALLBACK } from "@/components/Header";
import { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
import { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import {
  THERAPISTS_CONTENT_FALLBACK,
  SUPPORT_GROUPS_CONTENT_FALLBACK,
  BLOG_CONTENT_FALLBACK,
  FAQ_CONTENT_FALLBACK,
  CONTACT_CONTENT_FALLBACK,
  ABOUT_SECTIONS_FALLBACK,
  type HomeContent,
  type HeroContent,
  type AboutSectionsContent,
  type FooterContent,
  type HeaderContent,
  type TherapistsDirectoryContent,
  type SupportGroupsDirectoryContent,
  type SimplePageContent,
} from "@/lib/content";
import ContentManagerApp from "@/components/admin/content/ContentManagerApp";

export const dynamic = "force-dynamic";

const KEYS = [
  "page_home",
  "page_about_hero",
  "page_about_sections",
  "page_therapists",
  "page_support_groups",
  "page_blog",
  "page_faq",
  "page_contact",
  "page_footer",
  "site_header",
  "component_therapists_directory",
  "component_support_groups_directory",
];

// Reads every editable row in one bulk query rather than one getPageContent()
// call per key — this page needs all of them at once to build every tab,
// unlike the public pages which only ever need their own single row.
function merge<T extends Record<string, unknown>>(row: unknown, fallback: T): T {
  if (!row || typeof row !== "object") return fallback;
  return { ...fallback, ...(row as Partial<T>) } as T;
}

export default async function AdminContentPage() {
  const [map, faqs, legalPages] = await Promise.all([getSiteContentMap(KEYS), getFaqs(), getAllLegalPages()]);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-lg">Content Manager (Editing Details)</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Edit the hero banners, section copy, footer tagline, FAQs, and legal pages shown across the public site.
          Each page falls back to its built-in default text automatically if a row here is unpublished or empty, so
          the site can never render blank.
        </p>
      </div>
      <ContentManagerApp
        home={merge<HomeContent>(map.get("page_home"), HOME_CONTENT_FALLBACK)}
        aboutHero={merge<HeroContent>(map.get("page_about_hero"), HERO_CONTENT_FALLBACK)}
        aboutSections={merge<AboutSectionsContent>(map.get("page_about_sections"), ABOUT_SECTIONS_FALLBACK)}
        footer={merge<FooterContent>(map.get("page_footer"), FOOTER_CONTENT_FALLBACK)}
        header={merge<HeaderContent>(map.get("site_header"), HEADER_CONTENT_FALLBACK)}
        therapistsDirectory={merge<TherapistsDirectoryContent>(
          map.get("component_therapists_directory"),
          THERAPISTS_DIRECTORY_CONTENT_FALLBACK
        )}
        supportGroupsDirectory={merge<SupportGroupsDirectoryContent>(
          map.get("component_support_groups_directory"),
          SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK
        )}
        therapists={merge<SimplePageContent>(map.get("page_therapists"), THERAPISTS_CONTENT_FALLBACK)}
        supportGroups={merge<SimplePageContent>(map.get("page_support_groups"), SUPPORT_GROUPS_CONTENT_FALLBACK)}
        blog={merge<SimplePageContent>(map.get("page_blog"), BLOG_CONTENT_FALLBACK)}
        faqBanner={merge<SimplePageContent>(map.get("page_faq"), FAQ_CONTENT_FALLBACK)}
        contact={merge<SimplePageContent>(map.get("page_contact"), CONTACT_CONTENT_FALLBACK)}
        faqs={faqs}
        legalPages={legalPages}
      />
    </div>
  );
}

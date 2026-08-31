import { getFaqs, getAllLegalPages, getSiteContentMap } from "@/lib/queries";
import { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import { FOOTER_CONTENT_FALLBACK } from "@/components/Footer";
import { HEADER_CONTENT_FALLBACK } from "@/components/Header";
import { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
import { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import { DONATE_BAND_CONTENT_FALLBACK } from "@/components/home/DonateBand";
import { DONATE_PAGE_FALLBACK } from "@/components/donate/DonatePage";
import { HOME_STATS_CONTENT_FALLBACK } from "@/components/home/Stats";
import { CRISIS_BUTTON_CONTENT_FALLBACK } from "@/components/CrisisButton";
import { INTAKE_FLOW_CONTENT_FALLBACK } from "@/app/intake/intakeContent";
import {
  SIMPLE_PAGE_ENTRIES,
  ABOUT_SECTIONS_FALLBACK,
  type HomeContent,
  type HeroContent,
  type AboutSectionsContent,
  type FooterContent,
  type HeaderContent,
  type TherapistsDirectoryContent,
  type SupportGroupsDirectoryContent,
  type SimplePageContent,
  type DonateBandContent,
  type DonatePageContent,
  type HomeStatsContent,
  type CrisisButtonContent,
  type IntakeFlowContent,
} from "@/lib/content";
import ContentManagerApp from "@/components/admin/content/ContentManagerApp";

export const dynamic = "force-dynamic";

// Phase 80 round 2 — the simple-page keys now come from the SIMPLE_PAGE_ENTRIES
// registry (lib/content.ts) instead of being listed twice (once here, once
// in that registry) — adding a future simple page there is enough for its
// row to actually get fetched here too, no second place to remember.
const KEYS = [
  "page_home",
  "page_about_hero",
  "page_about_sections",
  "page_footer",
  "site_header",
  "component_therapists_directory",
  "component_support_groups_directory",
  "component_donate_band",
  "page_donate",
  "component_home_stats",
  "component_crisis_button",
  "component_intake_flow",
  ...SIMPLE_PAGE_ENTRIES.map((e) => e.key),
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

  // Phase 80 round 2 — every SIMPLE_PAGE_ENTRIES row (Our Therapists,
  // Support Groups, Find Your Therapist, Blog, FAQ banner, Contact — and
  // whatever's added to that registry later) resolved generically here,
  // instead of one hand-written `merge<SimplePageContent>(...)` call per
  // page. ContentManagerApp decides which of these get their own bespoke
  // tab (because they carry extra, non-banner content alongside them) vs.
  // which are rendered generically as a plain banner-only tab.
  const simplePages: Record<string, SimplePageContent> = Object.fromEntries(
    SIMPLE_PAGE_ENTRIES.map((entry) => [entry.key, merge<SimplePageContent>(map.get(entry.key), entry.fallback)])
  );

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
        donateBand={merge<DonateBandContent>(map.get("component_donate_band"), DONATE_BAND_CONTENT_FALLBACK)}
        donatePage={merge<DonatePageContent>(map.get("page_donate"), DONATE_PAGE_FALLBACK)}
        homeStats={merge<HomeStatsContent>(map.get("component_home_stats"), HOME_STATS_CONTENT_FALLBACK)}
        crisisButton={merge<CrisisButtonContent>(map.get("component_crisis_button"), CRISIS_BUTTON_CONTENT_FALLBACK)}
        intakeFlow={merge<IntakeFlowContent>(map.get("component_intake_flow"), INTAKE_FLOW_CONTENT_FALLBACK)}
        simplePages={simplePages}
        simplePageEntries={SIMPLE_PAGE_ENTRIES}
        faqs={faqs}
        legalPages={legalPages}
      />
    </div>
  );
}

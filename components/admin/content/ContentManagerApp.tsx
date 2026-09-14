"use client";

import { useState } from "react";
import SimplePageEditor from "@/components/admin/content/SimplePageEditor";
import HomeEditor from "@/components/admin/content/HomeEditor";
import HeroEditor from "@/components/admin/content/HeroEditor";
import AboutSectionsEditor from "@/components/admin/content/AboutSectionsEditor";
import FooterEditor from "@/components/admin/content/FooterEditor";
import HeaderEditor from "@/components/admin/content/HeaderEditor";
import TherapistsDirectoryEditor from "@/components/admin/content/TherapistsDirectoryEditor";
import SupportGroupsDirectoryEditor from "@/components/admin/content/SupportGroupsDirectoryEditor";
import DonateBandEditor from "@/components/admin/content/DonateBandEditor";
import DonatePageEditor from "@/components/admin/content/DonatePageEditor";
import HomeStatsEditor from "@/components/admin/content/HomeStatsEditor";
import CrisisButtonEditor from "@/components/admin/content/CrisisButtonEditor";
import IntakeFlowEditor from "@/components/admin/content/IntakeFlowEditor";
import VolunteerApplicationModalEditor from "@/components/admin/content/VolunteerApplicationModalEditor";
import DonateThankYouEditor from "@/components/admin/content/DonateThankYouEditor";
import CommunityIntroEditor from "@/components/admin/content/CommunityIntroEditor";
import FaqManager from "@/components/admin/content/FaqManager";
import LegalPagesManager from "@/components/admin/content/LegalPagesManager";
import MediaLibrary from "@/components/admin/content/MediaLibrary";
import PartnersManager from "@/components/admin/content/PartnersManager";
import NotFoundEditor from "@/components/admin/content/NotFoundEditor";
import type { MediaAssetRow, MediaAssetUsageRow } from "@/lib/database.types";
import type {
  HomeContent,
  HeroContent,
  AboutSectionsContent,
  FooterContent,
  HeaderContent,
  TherapistsDirectoryContent,
  SupportGroupsDirectoryContent,
  DonateBandContent,
  DonatePageContent,
  HomeStatsContent,
  CrisisButtonContent,
  IntakeFlowContent,
  VolunteerApplicationModalContent,
  DonateThankYouContent,
  CommunityIntroContent,
  SimplePageContent,
  NotFoundPageContent,
} from "@/lib/content";
import type { Tables } from "@/lib/database.types";

type Props = {
  home: HomeContent;
  aboutHero: HeroContent;
  aboutSections: AboutSectionsContent;
  footer: FooterContent;
  header: HeaderContent;
  therapistsDirectory: TherapistsDirectoryContent;
  supportGroupsDirectory: SupportGroupsDirectoryContent;
  donateBand: DonateBandContent;
  donatePage: DonatePageContent;
  homeStats: HomeStatsContent;
  crisisButton: CrisisButtonContent;
  intakeFlow: IntakeFlowContent;
  volunteerModal: VolunteerApplicationModalContent;
  donateThankYou: DonateThankYouContent;
  communityIntro: CommunityIntroContent;
  // Phase 80 round 2 — every SIMPLE_PAGE_ENTRIES row (Our Therapists,
  // Support Groups, Find Your Therapist, Blog, FAQ banner, Contact, and
  // anything added to that registry later), keyed by its site_content key.
  // Composite tabs (Our Therapists, Support Groups, FAQ) pull their banner
  // out of this same map instead of a dedicated named prop, so there's one
  // less place to remember to wire up per page.
  simplePages: Record<string, SimplePageContent>;
  simplePageEntries: { key: string; label: string; hasDescription: boolean; fallback: SimplePageContent }[];
  faqs: Tables<"faqs">[];
  legalPages: Tables<"legal_pages">[];
  mediaAssets: Array<MediaAssetRow & { publicUrl: string; usages: MediaAssetUsageRow[] }>;
  partners: Tables<"partners">[];
  notFound: NotFoundPageContent;
};

// Tabs that need more than a plain banner — each gets its own bespoke block
// below. Every other entry in `simplePageEntries` (Find Your Therapist,
// Blog, Contact today; anything added to that registry later) renders
// generically via the loop at the bottom of TABS/the render body, with zero
// changes needed here — that's the concrete "future content captured
// automatically" mechanism for the simple-banner-only case. See
// CONTENT_GUIDE.md for the full convention.
const COMPOSITE_SIMPLE_KEYS = new Set(["page_therapists", "page_support_groups", "page_faq"]);

// Phase 105 — Roy pointed out these tabs didn't match what a visitor
// actually sees in the live header nav, which is confusing since he's
// picking a tab by the page's real-world name, not its internal route/key.
// Phase 88 relabeled the header nav so "/" reads "About" and "/about" read
// "Find Support" (a deliberate swap, not a typo — see Header.tsx's own
// comment) — so the tab for the homepage (page_home) is named "About" here.
// Same idea for "Our Therapists" → "Our Professionals" and "Support
// Groups" → "Community" (Header.tsx's therapistsLabel/supportGroupsLabel).
//
// Phase 145 — the "About Us" tab (page_about_hero/page_about_sections) is
// renamed "Find Support": that content now renders at /find-your-therapist,
// not a separate About Us page/nav item (both removed — see
// lib/navigation.ts and next.config.mjs's redirect). Still the same two
// site_content keys/editors underneath, just relabeled to match what an
// admin actually sees in the live nav and browser tab now.
const PAGE_FIXED_TABS = [
  "About", // page_home — the header nav labels "/" as "About" (Phase 88)
  "Find Support", // page_about_hero / page_about_sections — now renders at /find-your-therapist (Phase 145)
  "Our Professionals", // page_therapists
  "Community", // page_support_groups
] as const;

const PAGE_FIXED_TABS_END = ["Intake", "FAQ", "Not Found Page"] as const;

const GLOBAL_ELEMENT_TABS = ["Header", "Footer", "Crisis Button"] as const;

const FORMS_AND_POPUPS_TABS = ["Donate Page", "Donate Band", "Volunteer Modal"] as const;

const DATA_AND_MEDIA_TABS = ["Legal Pages", "Media Library", "Trusted Partners"] as const;

// Phase 205 — Content Manager IA rebuild. With ~20 tabs accumulated over
// 204 phases, a single flat `flex flex-wrap` row of same-weight pills (no
// grouping, no search, order = build history rather than any real
// hierarchy) had become the exact "an admin can't predict where a page
// lives without scanning the whole row" problem this phase exists to fix.
// Pure UI reorganization — every tab's underlying contentKey/editor/props
// is completely unchanged, so this carries none of the data-model risk a
// real schema/content change would. Four groups, chosen to match how an
// admin actually thinks about "what am I editing" rather than when it was
// built: **Pages** (anything rendering as its own routed page — including
// every SIMPLE_PAGE_ENTRIES-driven generic tab, same as before), **Global
// Elements** (chrome that appears on every page regardless of route),
// **Forms & Popups** (a flow/modal a visitor actively fills out or is
// funneled through), **Data & Media** (a managed list/table rather than a
// single page's copy — FAQ's *questions* would fit here too, but its own
// tab already bundles the banner with the question list, so it stays a
// single "Pages" entry rather than being split across two groups).
function useTabGroups(genericEntries: { key: string; label: string }[]) {
  return [
    {
      heading: "Pages",
      tabs: [...PAGE_FIXED_TABS, ...genericEntries.map((e) => e.label), ...PAGE_FIXED_TABS_END],
    },
    { heading: "Global Elements", tabs: [...GLOBAL_ELEMENT_TABS] },
    { heading: "Forms & Popups", tabs: [...FORMS_AND_POPUPS_TABS] },
    { heading: "Data & Media", tabs: [...DATA_AND_MEDIA_TABS] },
  ];
}

// The Content Manager's tab shell — a client component so switching tabs is
// instant (no navigation/refetch), matching the "Admin UI" layer from the
// architecture Roy asked to implement. Each tab wraps one editor pointed at
// its own site_content key (or, for FAQ/Legal Pages, the existing tables
// those already lived in before this feature).
export default function ContentManagerApp(props: Props) {
  const genericEntries = props.simplePageEntries.filter((e) => !COMPOSITE_SIMPLE_KEYS.has(e.key));
  const tabGroups = useTabGroups(genericEntries);
  const [tab, setTab] = useState<string>("Header");

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4">
        {tabGroups.map((group) => (
          <div key={group.heading} className="flex flex-wrap items-center gap-2">
            <span className="mr-1 w-[110px] flex-none text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">
              {group.heading}
            </span>
            {group.tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
                  tab === t ? "bg-primary text-white" : "bg-secondary text-muted-fg hover:text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>

      {tab === "Header" && <HeaderEditor initial={props.header} />}

      {tab === "About" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Hero band, path cards &amp; gallery</h3>
            <HomeEditor initial={props.home} />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Stats row</h3>
            <HomeStatsEditor initial={props.homeStats} />
          </div>
        </div>
      )}

      {tab === "Find Support" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Hero</h3>
            <HeroEditor contentKey="page_about_hero" initial={props.aboutHero} />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Mission, how it works, founders &amp; volunteer CTA</h3>
            <AboutSectionsEditor initial={props.aboutSections} />
          </div>
        </div>
      )}

      {tab === "Our Professionals" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Banner</h3>
            <SimplePageEditor contentKey="page_therapists" initial={props.simplePages.page_therapists} hasDescription />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Directory filters &amp; buttons</h3>
            <TherapistsDirectoryEditor initial={props.therapistsDirectory} />
          </div>
        </div>
      )}

      {tab === "Community" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Banner</h3>
            <SimplePageEditor contentKey="page_support_groups" initial={props.simplePages.page_support_groups} hasDescription />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">
              Hero buttons, &quot;Why GESA exists&quot;, pathway cards &amp; closing band
            </h3>
            <CommunityIntroEditor initial={props.communityIntro} />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Registration flow</h3>
            <SupportGroupsDirectoryEditor initial={props.supportGroupsDirectory} />
          </div>
        </div>
      )}

      {/* Phase 80 round 2 — generic loop over every non-composite entry in
          the SIMPLE_PAGE_ENTRIES registry (lib/content.ts). Adding a future
          banner-only page there is enough for it to get a real tab here,
          with no new editor component and no new block in this file. */}
      {genericEntries.map(
        (entry) =>
          tab === entry.label && (
            <SimplePageEditor
              key={entry.key}
              contentKey={entry.key}
              initial={props.simplePages[entry.key]}
              hasDescription={entry.hasDescription}
              note={
                entry.key === "page_blog"
                  ? "The Blog page is currently disabled site-wide (it redirects to Home) — this banner isn't live yet. It's here so the copy is ready once Blog is turned back on."
                  : undefined
              }
            />
          )
      )}

      {tab === "Intake" && <IntakeFlowEditor initial={props.intakeFlow} />}

      {tab === "FAQ" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Banner</h3>
            <SimplePageEditor contentKey="page_faq" initial={props.simplePages.page_faq} hasDescription={false} />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Questions</h3>
            <FaqManager initialFaqs={props.faqs} />
          </div>
        </div>
      )}

      {tab === "Legal Pages" && <LegalPagesManager pages={props.legalPages} />}

      {tab === "Footer" && <FooterEditor initial={props.footer} />}

      {tab === "Donate Page" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Page</h3>
            <DonatePageEditor initial={props.donatePage} />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Thank-you page (after checkout)</h3>
            <DonateThankYouEditor initial={props.donateThankYou} />
          </div>
        </div>
      )}

      {tab === "Donate Band" && <DonateBandEditor initial={props.donateBand} />}

      {tab === "Crisis Button" && <CrisisButtonEditor initial={props.crisisButton} />}

      {tab === "Volunteer Modal" && <VolunteerApplicationModalEditor initial={props.volunteerModal} />}

      {tab === "Media Library" && <MediaLibrary initialAssets={props.mediaAssets} />}

      {tab === "Trusted Partners" && <PartnersManager initialPartners={props.partners} />}

      {tab === "Not Found Page" && <NotFoundEditor initial={props.notFound} />}
    </div>
  );
}

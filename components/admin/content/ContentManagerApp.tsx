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
// Phase 88 relabeled the header nav so "/" reads "About" and "/about" reads
// "Find Support" (a deliberate swap, not a typo — see Header.tsx's own
// comment) — so the tab for the homepage (page_home) is now named "About"
// here, and the tab for the About page (page_about_hero/page_about_sections)
// is named "Find Support", matching the nav exactly even though it means
// the tab names don't match this file's own internal identifiers. Same idea
// for "Our Therapists" → "Our Professionals" and "Support Groups" →
// "Community" (Header.tsx's therapistsLabel/supportGroupsLabel).
const FIXED_TABS = [
  "Header",
  "About", // page_home — the header nav labels "/" as "About" (Phase 88)
  "Find Support", // page_about_hero / page_about_sections — the actual About page, labeled "Find Support" in nav
  "Our Professionals", // page_therapists
  "Community", // page_support_groups
] as const;

const FIXED_TABS_END = [
  "Intake",
  "FAQ",
  "Legal Pages",
  "Footer",
  "Donate Page",
  "Donate Band",
  "Crisis Button",
  "Volunteer Modal",
] as const;

// The Content Manager's tab shell — a client component so switching tabs is
// instant (no navigation/refetch), matching the "Admin UI" layer from the
// architecture Roy asked to implement. Each tab wraps one editor pointed at
// its own site_content key (or, for FAQ/Legal Pages, the existing tables
// those already lived in before this feature).
export default function ContentManagerApp(props: Props) {
  const genericEntries = props.simplePageEntries.filter((e) => !COMPOSITE_SIMPLE_KEYS.has(e.key));
  const TABS = [...FIXED_TABS, ...genericEntries.map((e) => e.label), ...FIXED_TABS_END];
  const [tab, setTab] = useState<string>(TABS[0]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 border-b border-border pb-4">
        {TABS.map((t) => (
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
    </div>
  );
}

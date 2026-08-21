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
  therapists: SimplePageContent;
  supportGroups: SimplePageContent;
  blog: SimplePageContent;
  faqBanner: SimplePageContent;
  contact: SimplePageContent;
  faqs: Tables<"faqs">[];
  legalPages: Tables<"legal_pages">[];
};

const TABS = [
  "Header",
  "Home",
  "About",
  "Our Therapists",
  "Support Groups",
  "Blog",
  "FAQ",
  "Contact",
  "Legal Pages",
  "Footer",
] as const;
type Tab = (typeof TABS)[number];

// The Content Manager's tab shell — a client component so switching tabs is
// instant (no navigation/refetch), matching the "Admin UI" layer from the
// architecture Roy asked to implement. Each tab wraps one editor pointed at
// its own site_content key (or, for FAQ/Legal Pages, the existing tables
// those already lived in before this feature).
export default function ContentManagerApp(props: Props) {
  const [tab, setTab] = useState<Tab>("Header");

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

      {tab === "Home" && <HomeEditor initial={props.home} />}

      {tab === "About" && (
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

      {tab === "Our Therapists" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Banner</h3>
            <SimplePageEditor contentKey="page_therapists" initial={props.therapists} hasDescription />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Directory filters &amp; buttons</h3>
            <TherapistsDirectoryEditor initial={props.therapistsDirectory} />
          </div>
        </div>
      )}

      {tab === "Support Groups" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Banner</h3>
            <SimplePageEditor contentKey="page_support_groups" initial={props.supportGroups} hasDescription />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Registration flow</h3>
            <SupportGroupsDirectoryEditor initial={props.supportGroupsDirectory} />
          </div>
        </div>
      )}

      {tab === "Blog" && (
        <SimplePageEditor
          contentKey="page_blog"
          initial={props.blog}
          hasDescription
          note="The Blog page is currently disabled site-wide (it redirects to Home) — this banner isn't live yet. It's here so the copy is ready once Blog is turned back on."
        />
      )}

      {tab === "FAQ" && (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="mb-3 text-[15px] font-semibold">Banner</h3>
            <SimplePageEditor contentKey="page_faq" initial={props.faqBanner} hasDescription={false} />
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="mb-3 text-[15px] font-semibold">Questions</h3>
            <FaqManager initialFaqs={props.faqs} />
          </div>
        </div>
      )}

      {tab === "Contact" && <SimplePageEditor contentKey="page_contact" initial={props.contact} hasDescription />}

      {tab === "Legal Pages" && <LegalPagesManager pages={props.legalPages} />}

      {tab === "Footer" && <FooterEditor initial={props.footer} />}
    </div>
  );
}

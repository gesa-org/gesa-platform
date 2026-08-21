import Link from 'next/link';
import Logo from '@/components/Logo';
import type { FooterContent } from '@/lib/content';

export const FOOTER_CONTENT_FALLBACK: FooterContent = {
  published: true,
  tagline:
    "Free, professional, culturally sensitive mental health support, delivered by a global network of verified volunteer therapists.",
  exploreHeading: "Explore",
  exploreAboutLabel: "About",
  exploreTherapistsLabel: "Our Therapists",
  exploreSupportGroupsLabel: "Support Groups",
  exploreBlogLabel: "Blog",
  exploreBlogBadge: "Soon",
  exploreFaqLabel: "FAQ",
  exploreContactLabel: "Contact",
  supportHeading: "Support",
  supportFindTherapistLabel: "Find a Therapist",
  supportJoinGroupLabel: "Join a Group",
  supportDonateLabel: "Donate",
  supportVolunteerLabel: "Volunteer",
  supportEmergencyLabel: "Emergency Contact",
  legalHeading: "Legal",
  copyrightLine: "© {year} GESA (Global Emotional Support Alliance). A registered non-profit organization.",
  madeWithLine: "Made with care for those on the path to healing.",
};

// Phase 35 — the tagline is Content Manager-editable via site_content key
// "page_footer". Stays a plain synchronous component (no fetching in here)
// so it can keep being rendered directly from the client SiteFooterSlot —
// the actual DB fetch happens up in app/layout.tsx (a Server Component) and
// is passed down as a prop, since a Client Component can't import a
// Server-only data-fetching module without breaking the browser bundle.
export default function Footer({ content = FOOTER_CONTENT_FALLBACK }: { content?: FooterContent }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#16293a] text-[#cdd8dd] py-16 mt-10">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-sans text-[19px] font-medium tracking-[0.25em] text-[#a9b9c4]">
              <Logo size={34} />
              GESA
            </Link>
            <p className="text-[#8fa2ae] max-w-[260px] text-sm mt-3 leading-relaxed">{content.tagline}</p>
          </div>
          <div>
            <h4 className="text-white font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.exploreHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#a9bcc3]">
              <li><Link href="/about" className="hover:text-white transition-colors">{content.exploreAboutLabel}</Link></li>
              <li><Link href="/therapists" className="hover:text-white transition-colors">{content.exploreTherapistsLabel}</Link></li>
              <li><Link href="/support-groups" className="hover:text-white transition-colors">{content.exploreSupportGroupsLabel}</Link></li>
              {/* Blog moved here from the main header nav — the page has no
                  posts to show yet, so it's a disabled, non-clickable label
                  rather than a dead link, until there's real content. */}
              <li>
                <span
                  aria-disabled="true"
                  title="Coming soon — no posts published yet"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 text-[#5f7480]"
                >
                  {content.exploreBlogLabel}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#8fa2ae]">
                    {content.exploreBlogBadge}
                  </span>
                </span>
              </li>
              <li><Link href="/faq" className="hover:text-white transition-colors">{content.exploreFaqLabel}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{content.exploreContactLabel}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.supportHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#a9bcc3]">
              <li><Link href="/find-your-therapist" className="hover:text-white transition-colors">{content.supportFindTherapistLabel}</Link></li>
              <li><Link href="/support-groups" className="hover:text-white transition-colors">{content.supportJoinGroupLabel}</Link></li>
              <li><Link href="/contact?subject=Donation" className="hover:text-white transition-colors">{content.supportDonateLabel}</Link></li>
              <li><Link href="/contact?subject=Volunteer" className="hover:text-white transition-colors">{content.supportVolunteerLabel}</Link></li>
              <li><a href="tel:988" className="hover:text-white transition-colors">{content.supportEmergencyLabel}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.legalHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#a9bcc3]">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies-policy" className="hover:text-white transition-colors">Cookies Policy</Link></li>
              <li><Link href="/legal-notice" className="hover:text-white transition-colors">Legal Notice</Link></li>
              <li><Link href="/accessibility-statement" className="hover:text-white transition-colors">Accessibility Statement</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-5 text-[13px] text-[#8fa2ae] flex flex-col md:flex-row justify-between gap-4">
          <span>{content.copyrightLine.replace("{year}", String(year))}</span>
          <span>{content.madeWithLine}</span>
        </div>
      </div>
    </footer>
  );
}

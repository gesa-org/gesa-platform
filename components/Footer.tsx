import Link from 'next/link';
import { Linkedin, Twitter, Instagram, Facebook, Globe2, BadgeCheck, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';
import VolunteerApplyButton from '@/components/volunteer/VolunteerApplyButton';
import type { FooterContent } from '@/lib/content';

// Phase 57 — one icon per trusted-partner slot, fixed by position (not
// editable — only each slot's label text is), same approach as About's
// how-it-works icons.
const PARTNER_ICONS = [Globe2, BadgeCheck, ShieldCheck];

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
  connectWithUsLabel: "Connect with Us",
  socialLinkedinHref: "#",
  socialTwitterHref: "#",
  socialInstagramHref: "#",
  socialFacebookHref: "#",
  trustedPartnersHeading: "Our Trusted Partners",
  partner1Label: "Global Mental Health Alliance",
  partner2Label: "Validated Therapist Network",
  partner3Label: "Crisis Support International",
  nonprofitStatusLine: "GESA is a registered 501(c)(3) non-profit in the United States.",
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
    <footer className="bg-espresso text-[#c7d0de] py-16 mt-10">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-sans text-[19px] font-medium tracking-[0.25em] text-[#b7c3d6]">
              <Logo size={34} />
              GESA
            </Link>
            <p className="text-[#a8b4c8] max-w-[260px] text-sm mt-3 leading-relaxed">{content.tagline}</p>
          </div>
          <div>
            <h4 className="text-[#eef1f6] font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.exploreHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b0bbcc]">
              <li><Link href="/about" className="hover:text-[#eef1f6] transition-colors">{content.exploreAboutLabel}</Link></li>
              <li><Link href="/therapists" className="hover:text-[#eef1f6] transition-colors">{content.exploreTherapistsLabel}</Link></li>
              <li><Link href="/support-groups" className="hover:text-[#eef1f6] transition-colors">{content.exploreSupportGroupsLabel}</Link></li>
              {/* Blog moved here from the main header nav — the page has no
                  posts to show yet, so it's a disabled, non-clickable label
                  rather than a dead link, until there's real content. */}
              <li>
                <span
                  aria-disabled="true"
                  title="Coming soon — no posts published yet"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 text-[#6f7889]"
                >
                  {content.exploreBlogLabel}
                  <span className="rounded-full bg-[#eef1f6]/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#a8b4c8]">
                    {content.exploreBlogBadge}
                  </span>
                </span>
              </li>
              <li><Link href="/faq" className="hover:text-[#eef1f6] transition-colors">{content.exploreFaqLabel}</Link></li>
              <li><Link href="/contact" className="hover:text-[#eef1f6] transition-colors">{content.exploreContactLabel}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#eef1f6] font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.supportHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b0bbcc]">
              <li><Link href="/find-your-therapist" className="hover:text-[#eef1f6] transition-colors">{content.supportFindTherapistLabel}</Link></li>
              <li><Link href="/support-groups" className="hover:text-[#eef1f6] transition-colors">{content.supportJoinGroupLabel}</Link></li>
              <li><Link href="/contact?subject=Donation" className="hover:text-[#eef1f6] transition-colors">{content.supportDonateLabel}</Link></li>
              {/* Phase 63 — was a plain Link to the generic Contact form;
                  now opens the real volunteer therapist application. */}
              <li>
                <VolunteerApplyButton className="text-left hover:text-[#eef1f6] transition-colors">
                  {content.supportVolunteerLabel}
                </VolunteerApplyButton>
              </li>
              <li><a href="tel:988" className="hover:text-[#eef1f6] transition-colors">{content.supportEmergencyLabel}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#eef1f6] font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.legalHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b0bbcc]">
              <li><Link href="/privacy-policy" className="hover:text-[#eef1f6] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies-policy" className="hover:text-[#eef1f6] transition-colors">Cookies Policy</Link></li>
              <li><Link href="/legal-notice" className="hover:text-[#eef1f6] transition-colors">Legal Notice</Link></li>
              <li><Link href="/accessibility-statement" className="hover:text-[#eef1f6] transition-colors">Accessibility Statement</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-[#eef1f6] transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Phase 57 — "Connect with Us" social row + "Our Trusted Partners"
            row, replacing Phase 56's reverted 5-column/CTA-button redesign
            with the simpler layout Roy sent this time. Social hrefs default
            to "#" (see the FooterContent comment in lib/content.ts for why
            that's a deliberate change from Phase 56's "" default) so all
            four icons always render, matching the reference immediately —
            Roy swaps in real profile URLs via the Content Manager. */}
        <div className="mt-8 flex flex-col gap-5 border-t border-[#eef1f6]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-[#eef1f6]">{content.connectWithUsLabel}</span>
            <div className="flex items-center gap-2">
              <a
                href={content.socialLinkedinHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Linkedin size={15} />
              </a>
              <a
                href={content.socialTwitterHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on Twitter"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Twitter size={15} />
              </a>
              <a
                href={content.socialInstagramHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Instagram size={15} />
              </a>
              <a
                href={content.socialFacebookHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Facebook size={15} />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[13px] font-semibold text-[#eef1f6]">{content.trustedPartnersHeading}</span>
            <div className="flex flex-wrap items-center gap-4">
              {[content.partner1Label, content.partner2Label, content.partner3Label].map((label, i) => {
                const Icon = PARTNER_ICONS[i] ?? PARTNER_ICONS[PARTNER_ICONS.length - 1];
                return (
                  <span key={label} className="flex items-center gap-1.5 text-[12.5px] text-[#b0bbcc]">
                    <Icon size={15} className="text-[#8b96a8]" /> {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-[#eef1f6]/10 mt-8 pt-5 text-[13px] text-[#a8b4c8] flex flex-col md:flex-row justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span>{content.copyrightLine.replace("{year}", String(year))}</span>
            <span>{content.nonprofitStatusLine}</span>
          </div>
          <span>{content.madeWithLine}</span>
        </div>
      </div>
    </footer>
  );
}

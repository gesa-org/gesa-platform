import Link from 'next/link';
import { Linkedin, Twitter, Facebook, Globe2, BadgeCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';
import type { FooterContent } from '@/lib/content';

// Phase 56 — icon per accreditation slot. Fixed by position (not editable —
// only each slot's label text is), same approach as About's how-it-works
// icons, since choosing an icon isn't really "content."
const ACCREDITATION_ICONS = [Globe2, BadgeCheck, ShieldCheck];

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
  connectHeading: "Connect",
  connectNewsletterLabel: "Newsletter Signup",
  connectNewsletterHref: "/contact?subject=Newsletter Signup",
  connectPressLabel: "Press Inquiries",
  connectPressHref: "/contact?subject=Press Inquiry",
  connectPartnershipsLabel: "Partnerships",
  connectPartnershipsHref: "/contact?subject=Partnership Inquiry",
  connectBlogLabel: "Blog",
  socialFollowLabel: "Follow our journey",
  socialLinkedinHref: "",
  socialTwitterHref: "",
  socialFacebookHref: "",
  accreditationsHeading: "Accreditations & Partners",
  accreditation1Label: "Global Mental Health Alliance",
  accreditation2Label: "Validated Therapist Network",
  accreditation3Label: "Crisis Support International",
  joinNetworkLabel: "Join Our Global Network",
  joinNetworkHref: "/contact?subject=Volunteer",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
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
              <li><Link href="/contact?subject=Volunteer" className="hover:text-[#eef1f6] transition-colors">{content.supportVolunteerLabel}</Link></li>
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
          {/* Phase 56 — new fifth column per Roy's reference redesign.
              Newsletter/Press/Partnerships route to the existing, real
              Contact form (same pattern Donate/Volunteer already use
              above) since there's no dedicated newsletter-signup or press
              page — Blog reuses the same disabled "coming soon" treatment
              as the Explore column's Blog link, rather than a second,
              differently-behaving Blog link. */}
          <div>
            <h4 className="text-[#eef1f6] font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">{content.connectHeading}</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b0bbcc]">
              <li><Link href={content.connectNewsletterHref} className="hover:text-[#eef1f6] transition-colors">{content.connectNewsletterLabel}</Link></li>
              <li><Link href={content.connectPressHref} className="hover:text-[#eef1f6] transition-colors">{content.connectPressLabel}</Link></li>
              <li><Link href={content.connectPartnershipsHref} className="hover:text-[#eef1f6] transition-colors">{content.connectPartnershipsLabel}</Link></li>
              <li>
                <span
                  aria-disabled="true"
                  title="Coming soon — no posts published yet"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 text-[#6f7889]"
                >
                  {content.connectBlogLabel}
                  <span className="rounded-full bg-[#eef1f6]/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#a8b4c8]">
                    {content.exploreBlogBadge}
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Phase 56 — social links + accreditations row, and the closing
            "Join Our Global Network" CTA. Each social icon only renders if
            its href is actually set (all default to "" — Roy asked for
            these to be filled in via the Content Manager rather than
            hardcoded here), so an unconfigured social link never becomes a
            dead "#" link on the live site. */}
        <div className="mt-8 flex flex-col gap-6 border-t border-[#eef1f6]/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2.5">
              {content.socialLinkedinHref && (
                <a
                  href={content.socialLinkedinHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GESA on LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {content.socialTwitterHref && (
                <a
                  href={content.socialTwitterHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GESA on Twitter"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
                >
                  <Twitter size={16} />
                </a>
              )}
              {content.socialFacebookHref && (
                <a
                  href={content.socialFacebookHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GESA on Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
                >
                  <Facebook size={16} />
                </a>
              )}
            </div>
            {(content.socialLinkedinHref || content.socialTwitterHref || content.socialFacebookHref) && (
              <span className="text-[13.5px] text-[#a8b4c8]">{content.socialFollowLabel}</span>
            )}

            <span className="hidden text-[#eef1f6]/15 lg:inline">|</span>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a8b4c8]">
                {content.accreditationsHeading}
              </span>
              <div className="flex flex-wrap items-center gap-4">
                {[content.accreditation1Label, content.accreditation2Label, content.accreditation3Label].map(
                  (label, i) => {
                    const Icon = ACCREDITATION_ICONS[i] ?? ACCREDITATION_ICONS[ACCREDITATION_ICONS.length - 1];
                    return (
                      <span key={label} className="flex items-center gap-1.5 text-[13px] text-[#b0bbcc]">
                        <Icon size={16} className="text-[#8b96a8]" /> {label}
                      </span>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <Link
            href={content.joinNetworkHref}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-[#eef1f6] px-6 py-3 text-[14px] font-semibold text-[#1d212b] transition-transform hover:-translate-y-px"
          >
            {content.joinNetworkLabel} <ArrowRight size={15} />
          </Link>
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

import Link from 'next/link';
import { Linkedin, Twitter, Instagram, Facebook, Globe2, BadgeCheck, ShieldCheck, Heart } from 'lucide-react';
import Logo from '@/components/Logo';
import VolunteerApplyButton from '@/components/volunteer/VolunteerApplyButton';
import HelpUsGrowForm from '@/components/footer/HelpUsGrowForm';
import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerReveal';
import type { FooterContent, HeaderContent } from '@/lib/content';
import { HEADER_CONTENT_FALLBACK } from '@/components/Header';
import { getFooterExploreItems } from '@/lib/navigation';
import { SITE_FOOTER_ID } from '@/lib/accessibility/config';

// Phase 57 — one icon per trusted-partner slot, fixed by position (not
// editable — only each slot's label text is), same approach as About's
// how-it-works icons.
const PARTNER_ICONS = [Globe2, BadgeCheck, ShieldCheck];

export const FOOTER_CONTENT_FALLBACK: FooterContent = {
  published: true,
  tagline:
    "Free, professional, culturally sensitive mental health support, delivered by a global network of verified volunteer therapists.",
  exploreHeading: "Explore",
  // Phase 117 — these three fields are kept in the type/fallback/DB row
  // (same "don't delete data just because a section stopped reading it"
  // precedent used elsewhere in this codebase) but are no longer rendered.
  // They're exactly the bug this phase fixed: two independently-editable
  // labels for "the same nav item" (this field, and HeaderContent's own
  // homeLabel/aboutLabel/therapistsLabel/supportGroupsLabel) had already
  // drifted apart on the live site — the footer called /therapists "Find
  // Support" while the header called it "Our Professionals". The Explore
  // column below now reads its first four links' labels/hrefs from
  // `headerContent` via lib/navigation.ts's shared PRIMARY_NAVIGATION list
  // instead, so there is exactly one editable label per route going
  // forward. See FooterEditor.tsx for the matching admin-UI note.
  exploreAboutLabel: "Find Support",
  exploreTherapistsLabel: "Our Professionals",
  exploreSupportGroupsLabel: "Community",
  exploreBlogLabel: "Blog",
  exploreBlogBadge: "Soon",
  exploreFaqLabel: "FAQ",
  exploreContactLabel: "Contact",
  supportHeading: "Support",
  supportFindTherapistLabel: "Find a Therapist",
  supportJoinGroupLabel: "Join a Group",
  // Phase 117 — kept in the type/fallback/DB row (not deleted, same
  // precedent as the exploreAboutLabel-etc. note above) but no longer
  // rendered: this was a second, independently-editable "Donate" link that
  // pointed to /contact?subject=Donation — a different destination than the
  // header's/Explore's own Donate, which goes to the real /donate flow
  // (HeaderContent.donateHref). That mismatch is exactly the "links point to
  // different routes" bug this phase fixed; Donate now appears exactly once
  // in this footer, in the Explore column, sharing the header's own link.
  supportDonateLabel: "Donate",
  supportVolunteerLabel: "Volunteer",
  supportEmergencyLabel: "Emergency Contact",
  legalHeading: "Legal",
  legalPrivacyLabel: "Privacy Policy",
  legalCookiesLabel: "Cookies Policy",
  legalNoticeLabel: "Legal Notice",
  legalAccessibilityLabel: "Accessibility Statement",
  legalTermsLabel: "Terms & Conditions",
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
  helpGrowHeading: "Help us grow",
  helpGrowSubtitle: "We will continue to contribute and succeed, also thanks to you.",
  helpGrowSubmitLabel: "Sent",
  helpGrowSendingLabel: "Sending…",
  helpGrowSubmittedMessage: "Thank you — we've received your message and will be in touch soon.",
};

// Phase 35 — the tagline is Content Manager-editable via site_content key
// "page_footer". Stays a plain synchronous component (no fetching in here)
// so it can keep being rendered directly from the client SiteFooterSlot —
// the actual DB fetch happens up in app/layout.tsx (a Server Component) and
// is passed down as a prop, since a Client Component can't import a
// Server-only data-fetching module without breaking the browser bundle.
// Phase 117 — headerContent is a new, optional prop (defaults to the same
// HEADER_CONTENT_FALLBACK the header itself falls back to) so every existing
// caller/test that only ever passed `content` keeps working unchanged, while
// app/layout.tsx's real render now threads the same HeaderContent object it
// already fetches for <Header> down here too — see lib/navigation.ts for why.
export default function Footer({
  content = FOOTER_CONTENT_FALLBACK,
  headerContent = HEADER_CONTENT_FALLBACK,
}: {
  content?: FooterContent;
  headerContent?: HeaderContent;
}) {
  const year = new Date().getFullYear();
  const exploreItems = getFooterExploreItems(headerContent);
  return (
    // Phase 90 — id/tabIndex added for the accessibility widget's "Skip To
    // Content → Footer" control (components/accessibility/sections/
    // SkipToContentSection.tsx), which needs a stable, focusable landmark.
    <footer id={SITE_FOOTER_ID} tabIndex={-1} className="bg-espresso text-[#c7d0de] py-20 sm:py-24 mt-10 focus:outline-none">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
        {/* Phase 70 — Roy asked for the footer's overall size/padding to
            feel more spacious, its text more legible, and for scroll-
            triggered reveal animations on the footer's text/sections.
            Every column stagers in via StaggerGroup/StaggerItem, the same
            primitive already used for card grids elsewhere on the site.
            Phase 70 follow-up — the "Help us grow" form moved out of this
            4-column nav grid into its own full-width row below (per the
            second reference Roy sent, a full-width card rather than a 5th
            narrow column). */}
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <StaggerItem className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-sans text-[19px] font-medium tracking-[0.25em] text-[#b7c3d6]">
              <Logo size={34} />
              GESA
            </Link>
            <p className="text-[#a8b4c8] max-w-[260px] text-[14.5px] mt-3.5 leading-relaxed">{content.tagline}</p>
          </StaggerItem>
          <StaggerItem>
            <h4 className="text-[#eef1f6] font-sans text-[13.5px] uppercase tracking-[0.14em] mb-4.5 mb-[18px] font-semibold">{content.exploreHeading}</h4>
            {/* Phase 117 — every link here now comes from
                lib/navigation.ts's shared PRIMARY_NAVIGATION list, resolved
                against the same `headerContent` object <Header> itself
                renders from (both fetched once, together, in
                app/layout.tsx) — so this list's labels, hrefs, and order
                always match the top nav exactly, with no separate footer
                copy of any of it left to drift out of sync. Blog/FAQ/Contact
                moved to the Support column below: they're not part of the
                primary header nav, so per the "match the top nav, keep
                everything else separate" goal they don't belong mixed into
                Explore either.
                Structural audit (this phase) — Donate rendered identically
                to the four plain page links above it lost the distinct
                "this is a monetary ask, not a page link" signal Donate gets
                everywhere else on the site (Header's filled pill CTA,
                DonateBand's pill CTA) — a screen-reader user tabbing this
                list had no way to tell the 5th item apart from the first
                four. Donate keeps its position and destination (still the
                same `content.donateHref` the header uses) but now renders
                with a small heart icon and warmer text color, matching the
                icon this same button uses in the header, so it's visually
                and semantically distinguishable without becoming a second,
                differently-styled button competing with the header's own. */}
            <ul className="flex flex-col gap-2.5 text-[14.5px] text-[#b0bbcc]">
              {exploreItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={
                      item.key === "donate"
                        ? "inline-flex items-center gap-1.5 font-semibold text-[#ecd48f] hover:text-[#f5e3ab] transition-colors"
                        : "hover:text-[#eef1f6] transition-colors"
                    }
                  >
                    {item.key === "donate" && <Heart size={13} aria-hidden="true" />}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>
          <StaggerItem>
            <h4 className="text-[#eef1f6] font-sans text-[13.5px] uppercase tracking-[0.14em] mb-4.5 mb-[18px] font-semibold">{content.supportHeading}</h4>
            <ul className="flex flex-col gap-2.5 text-[14.5px] text-[#b0bbcc]">
              <li><Link href="/find-your-therapist" className="hover:text-[#eef1f6] transition-colors">{content.supportFindTherapistLabel}</Link></li>
              <li><Link href="/support-groups" className="hover:text-[#eef1f6] transition-colors">{content.supportJoinGroupLabel}</Link></li>
              {/* Phase 63 — was a plain Link to the generic Contact form;
                  now opens the real volunteer therapist application. */}
              <li>
                <VolunteerApplyButton className="text-left hover:text-[#eef1f6] transition-colors">
                  {content.supportVolunteerLabel}
                </VolunteerApplyButton>
              </li>
              <li><a href="tel:988" className="hover:text-[#eef1f6] transition-colors">{content.supportEmergencyLabel}</a></li>
              {/* Phase 117 — moved here from the Explore column (see the
                  comment on that column above): Blog/FAQ/Contact aren't part
                  of the primary header nav, so they no longer live alongside
                  the items that mirror it. Blog stays a disabled,
                  non-clickable label (no real page exists yet), not a dead
                  link. */}
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
          </StaggerItem>
          <StaggerItem>
            <h4 className="text-[#eef1f6] font-sans text-[13.5px] uppercase tracking-[0.14em] mb-4.5 mb-[18px] font-semibold">{content.legalHeading}</h4>
            <ul className="flex flex-col gap-2.5 text-[14.5px] text-[#b0bbcc]">
              <li><Link href="/privacy-policy" className="hover:text-[#eef1f6] transition-colors">{content.legalPrivacyLabel}</Link></li>
              <li><Link href="/cookies-policy" className="hover:text-[#eef1f6] transition-colors">{content.legalCookiesLabel}</Link></li>
              <li><Link href="/legal-notice" className="hover:text-[#eef1f6] transition-colors">{content.legalNoticeLabel}</Link></li>
              <li><Link href="/accessibility-statement" className="hover:text-[#eef1f6] transition-colors">{content.legalAccessibilityLabel}</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-[#eef1f6] transition-colors">{content.legalTermsLabel}</Link></li>
            </ul>
          </StaggerItem>
        </StaggerGroup>

        <Reveal type="fade-up" as="div" className="mt-10">
          <HelpUsGrowForm
            heading={content.helpGrowHeading}
            subtitle={content.helpGrowSubtitle}
            submitLabel={content.helpGrowSubmitLabel}
            sendingLabel={content.helpGrowSendingLabel}
            submittedMessage={content.helpGrowSubmittedMessage}
          />
        </Reveal>

        {/* Phase 57 — "Connect with Us" social row + "Our Trusted Partners"
            row, replacing Phase 56's reverted 5-column/CTA-button redesign
            with the simpler layout Roy sent this time. Social hrefs default
            to "#" (see the FooterContent comment in lib/content.ts for why
            that's a deliberate change from Phase 56's "" default) so all
            four icons always render, matching the reference immediately —
            Roy swaps in real profile URLs via the Content Manager. */}
        <Reveal type="fade-up" as="div" className="mt-10 flex flex-col gap-5 border-t border-[#eef1f6]/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[13.5px] font-semibold text-[#eef1f6]">{content.connectWithUsLabel}</span>
            <div className="flex items-center gap-2.5">
              <a
                href={content.socialLinkedinHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Linkedin size={16} />
              </a>
              <a
                href={content.socialTwitterHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Twitter size={16} />
              </a>
              <a
                href={content.socialInstagramHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Instagram size={16} />
              </a>
              <a
                href={content.socialFacebookHref}
                target="_blank"
                rel="noreferrer"
                aria-label="GESA on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1f6]/10 text-[#c7d0de] transition-colors hover:bg-[#eef1f6]/20 hover:text-[#eef1f6]"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[13.5px] font-semibold text-[#eef1f6]">{content.trustedPartnersHeading}</span>
            <div className="flex flex-wrap items-center gap-4">
              {[content.partner1Label, content.partner2Label, content.partner3Label].map((label, i) => {
                const Icon = PARTNER_ICONS[i] ?? PARTNER_ICONS[PARTNER_ICONS.length - 1];
                return (
                  <span key={label} className="flex items-center gap-1.5 text-[13px] text-[#b0bbcc]">
                    <Icon size={15} className="text-[#8b96a8]" /> {label}
                  </span>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal
          type="fade"
          as="div"
          className="border-t border-[#eef1f6]/10 mt-9 pt-6 text-[13.5px] text-[#a8b4c8] flex flex-col md:flex-row justify-between gap-2"
        >
          <div className="flex flex-col gap-1">
            <span>{content.copyrightLine.replace("{year}", String(year))}</span>
            <span>{content.nonprofitStatusLine}</span>
          </div>
          <span>{content.madeWithLine}</span>
        </Reveal>
      </div>
    </footer>
  );
}

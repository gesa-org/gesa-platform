import Link from 'next/link';
import { Heart } from 'lucide-react';
import AuthStatus from '@/components/AuthStatus';
import Logo from '@/components/Logo';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationBell from '@/components/admin/NotificationBell';
import VolunteerPrimaryCta from '@/components/volunteer/VolunteerPrimaryCta';
import type { HeaderContent } from '@/lib/content';
import { PRIMARY_NAVIGATION, resolveNavHref } from '@/lib/navigation';

// Phase 88 — Roy asked to relabel the main nav and the Donate CTA without
// touching any page's actual URL, structure, or in-page content: the item
// that links to "/" now reads "About", the one linking to "/about" now
// reads "Find Support", "/therapists" now reads "Our Professionals",
// "/support-groups" now reads "Community", and the header's Donate button
// now reads "JOIN GESA". Only these visible label strings changed — every
// href below is untouched, and no page's own heading/copy changed (those
// live in each page's own content, not here).
// Phase 93 — Roy asked for "JOIN GESA" to behave like the Home donate
// band's "Join as a professional" button (open the volunteer application
// modal), not like a donation link. `donateHref` changed to the same
// default VolunteerPrimaryCta already recognizes as "open the modal"
// (used by the About page's volunteer CTA and the donate band) — this is
// no longer a donation field despite the historical field name.
// Phase 98 — Roy asked for this button to become a real "DONATE" CTA again,
// linking to the new full-page /donate flow (see components/donate/
// DonatePage.tsx) rather than the volunteer modal. `donateHref` is no
// longer VolunteerPrimaryCta's recognized "open the modal" default, so it
// now renders as a plain link to /donate — this field is genuinely a
// donation field again.
export const HEADER_CONTENT_FALLBACK: HeaderContent = {
  published: true,
  homeLabel: "About",
  aboutLabel: "Find Support",
  therapistsLabel: "Our Professionals",
  supportGroupsLabel: "Community",
  donateLabel: "DONATE",
  donateHref: "/donate",
};

// Phase 35 (round 2) — nav labels and the Donate CTA are Content
// Manager-editable via site_content key "site_header". The four main nav
// items' destinations (/, /about, /therapists, /support-groups) stay fixed
// — only their visible label text and the Donate button's label+link are
// editable, matching Roy's "keep the current build structure" instruction.
// Header stays a plain component (not async) for the same reason Footer
// does: content is fetched once in app/layout.tsx and passed down.
export default function Header({ content = HEADER_CONTENT_FALLBACK }: { content?: HeaderContent }) {
  return (
    <header className="sticky top-0 z-40 bg-[#eef1f6d1] backdrop-blur-md border-b border-transparent transition-all duration-200">
      <div className="max-w-[1160px] mx-auto px-6 flex items-center h-[74px] gap-5">
        <Link href="/" className="flex items-center gap-2.5 font-sans text-[19px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={34} />
          GESA
        </Link>
        {/* ms-2/ms-auto (CSS logical "margin-inline-start", not a physical
            margin-left) rather than ml-2/ml-auto — these automatically flip
            to the trailing/leading edge under dir="rtl" (set by
            TranslationProvider when Hebrew is active), so the nav and the
            right-hand action cluster actually mirror sides like the
            reference recording, instead of staying pinned left regardless
            of reading direction. */}
        {/* Phase 117 — every plain nav link now maps from the shared
            PRIMARY_NAVIGATION config (lib/navigation.ts) instead of being
            hand-written per item, so this list and Footer's "Explore"
            column can never drift apart again — both read the exact same
            HeaderContent object passed down from app/layout.tsx. Donate
            renders differently (a filled CTA button via VolunteerPrimaryCta,
            not a plain Link) so it's pulled out of the map and rendered on
            its own right after, same visual treatment as before. */}
        <nav className="hidden md:flex gap-2 ms-2">
          {PRIMARY_NAVIGATION.filter((item) => item.showInHeader && item.key !== "donate").map((item) => (
            <Link
              key={item.key}
              href={resolveNavHref(item, content)}
              className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors"
            >
              {content[item.contentField]}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {/* Phase 93 — VolunteerPrimaryCta (not a plain Link) so this opens
              the real volunteer application modal when donateHref is still
              the recognized default, same as the Home donate band's "Join
              as a professional" button and the About page's volunteer CTA;
              an admin who's deliberately repointed this via the Content
              Manager still just gets a normal link. */}
          <VolunteerPrimaryCta
            href={content.donateHref}
            className="hidden sm:inline-flex items-center gap-2 bg-primary text-primary-fg hover:bg-primary-600 px-6 py-3 rounded-full text-[15px] font-semibold transition-all shadow-soft"
          >
            <Heart size={16} /> {content.donateLabel}
          </VolunteerPrimaryCta>
          <NotificationBell />
          <LanguageSelector />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}

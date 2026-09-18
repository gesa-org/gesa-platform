import Link from 'next/link';
import { Heart } from 'lucide-react';
import AuthStatus from '@/components/AuthStatus';
import Logo from '@/components/Logo';
import GesaWordmark from '@/components/GesaWordmark';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationBell from '@/components/admin/NotificationBell';
import VolunteerPrimaryCta from '@/components/volunteer/VolunteerPrimaryCta';
import MobileNavDrawer from '@/components/MobileNavDrawer';
import type { HeaderContent } from '@/lib/content';
import { PRIMARY_NAVIGATION, resolveNavHref } from '@/lib/navigation';
import EditableText from '@/components/ui-builder/public/EditableText';

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
// "Find Support" flow rework — the "Find Support" nav item (`aboutLabel`)
// used to link to `/about`; it now links to `/find-your-therapist`, the
// real AI/Manual Support entry point (see lib/navigation.ts). A new
// `aboutPageLabel` item was added right after it so `/about` — a real,
// existing page — stays reachable from primary nav; see lib/content.ts's
// HeaderContent comment for the full reasoning.
export const HEADER_CONTENT_FALLBACK: HeaderContent = {
  published: true,
  homeLabel: "About",
  aboutLabel: "Find Support",
  aboutPageLabel: "About Us",
  therapistsLabel: "Our Professionals",
  supportGroupsLabel: "Community",
  donateLabel: "DONATE",
  donateHref: "/donate",
};

// Phase 35 (round 2) — nav labels and the Donate CTA are Content
// Manager-editable via site_content key "site_header". Nav items'
// destinations stay fixed in code — only their visible label text and the
// Donate button's label+link are editable, matching Roy's "keep the
// current build structure" instruction.
// Header stays a plain component (not async) for the same reason Footer
// does: content is fetched once in app/layout.tsx and passed down.
export default function Header({ content = HEADER_CONTENT_FALLBACK }: { content?: HeaderContent }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-[#eef1f6d1] pt-[env(safe-area-inset-top)] backdrop-blur-md transition-all duration-200 md:pt-0">
      {/* Phase 199 (mobile pass) — px-4 below `sm` (was a flat px-6 at every
          width) buys back ~16px of edge room on 320-375px phones, where the
          logo/wordmark + hamburger + bell + language + auth cluster below
          all have to fit on one line; h-16 (was a flat h-[74px]) matches
          the ~44-48px comfortable touch-target band better on small
          screens without shrinking the desktop header. */}
      <div className="mx-auto flex min-h-16 min-w-0 max-w-[1160px] items-center gap-1.5 px-4 py-2 sm:h-[74px] sm:px-6 sm:py-0 sm:gap-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-sans text-[15px] font-medium tracking-[0.18em] text-[#5c6470] sm:gap-2.5 sm:text-[19px] sm:tracking-[0.25em]"
        >
          <Logo size={30} />
          {/* The full wordmark reads as a wall of tracked-out letters at
              320-360px next to the icons on the right; hiding it below
              `xs` keeps the "G" mark (already the recognizable brand
              element on its own, per Logo.tsx) as the identity anchor
              instead of clipping/wrapping the wordmark. */}
          <GesaWordmark className="hidden xs:inline-flex" />
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
        <nav className="hidden lg:flex gap-2 ms-2">
          {/* Phase 140 — each nav label is now Page Content-editable via
              "global.header.<contentField>" (see pageRegistry.ts's
              GLOBAL_EDITABLE_FIELDS), same contentField this list already
              used to read from `content`. */}
          {PRIMARY_NAVIGATION.filter((item) => item.showInHeader && item.key !== "donate").map((item) => (
            <Link
              key={item.key}
              href={resolveNavHref(item, content)}
              className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors"
            >
              <EditableText
                contentId={`global.header.${item.contentField}`}
                label={`Nav: "${content[item.contentField]}"`}
                value={content[item.contentField] as string}
                as="span"
              />
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1 whitespace-nowrap sm:gap-2">
          {/* Phase 93 — VolunteerPrimaryCta (not a plain Link) so this opens
              the real volunteer application modal when donateHref is still
              the recognized default, same as the Home donate band's "Join
              as a professional" button and the About page's volunteer CTA;
              an admin who's deliberately repointed this via the Content
              Manager still just gets a normal link. */}
          <VolunteerPrimaryCta
            href={content.donateHref}
            className="hidden lg:inline-flex items-center gap-2 bg-[var(--donate-navy)] text-primary-fg hover:bg-[var(--donate-navy-600)] px-6 py-3 rounded-full text-[15px] font-semibold transition-all shadow-soft"
          >
            <Heart size={16} />{" "}
            <EditableText contentId="global.header.donateLabel" label="Donate button label" value={content.donateLabel} as="span" />
          </VolunteerPrimaryCta>
          <NotificationBell />
          <LanguageSelector />
          <AuthStatus />
          {/* Phase 199 (mobile pass) — the desktop <nav> above and the
              Donate button just above are both hidden below `lg` with no
              other way to reach them on a compact layout.
              MobileNavDrawer renders nothing at `lg`+ (its own root is
              `lg:hidden`) and is the actual fix: a hamburger trigger that
              opens an off-canvas panel with every primary nav link plus
              Donate. */}
          <MobileNavDrawer content={content} />
        </div>
      </div>
    </header>
  );
}

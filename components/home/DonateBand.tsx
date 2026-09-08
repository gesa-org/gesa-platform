import Link from "next/link";
import { Heart } from "lucide-react";
import VolunteerPrimaryCta from "@/components/volunteer/VolunteerPrimaryCta";
import { getPageContent, type DonateBandContent } from "@/lib/content";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 80 round 2 — this band is rendered identically on Home, About, Our
// Therapists, and Support Groups (Phase 75), so one Content Manager save
// updates all four pages at once.
// Phase 83 — Roy asked for a redesign: the single "Donate to GESA" button
// became two pill CTAs, plus a small crisis-resources line underneath.
// `cta1Href` defaults to the same href VolunteerPrimaryCta already treats
// as "open the volunteer application modal" (see that component), so "Join
// as a professional" opens the modal by default rather than just linking
// to the contact page, matching the About page's existing volunteer CTA
// behavior.
export const DONATE_BAND_CONTENT_FALLBACK: DonateBandContent = {
  published: true,
  headline: "Your gift keeps care free",
  subtitle:
    "Every donation extends the six free sessions that make GESA possible for people who have nowhere else to turn.",
  cta1Label: "Join as a professional",
  cta1Href: "/contact?subject=Volunteer",
  cta2Label: "Explore the community",
  cta2Href: "/support-groups",
  crisisText: "Need immediate emergency support?",
  crisisLinkLabel: "Find local crisis services.",
  crisisLinkHref: "https://findahelpline.com/",
};

const PILL_CLASS =
  "inline-flex items-center rounded-full border border-white/70 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10";

// Phase 164 — Roy sent a fuller Home-page mockup putting this closing band
// on an ivory background instead of the dark navy gradient every other
// page using this component keeps. Since this one component renders
// unchanged on Home, Find Support, Our Professionals, and Community (see
// the Phase 153 comment above), an opt-in `variant` prop scopes the new
// look to whichever caller asks for it — only app/page.tsx (Home) passes
// `variant="ivory"`; every other call site omits the prop and keeps
// today's dark-navy band exactly as before.
const IVORY_PILL_CLASS =
  "inline-flex items-center rounded-full bg-primary px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-primary-fg transition-colors hover:bg-primary-600";

// Phase 153 — registered in the Page Content Layers panel as "Donation /
// Support CTA" on the About/Find Support page (see lib/ui-builder/
// pageRegistry.ts's "about" entry — that's the only page with a "Team &
// Advisors" group for this to sit after), even though this component also
// renders unchanged on Home, Our Professionals, and Community. An optional
// `content` prop lets a page that already resolved this band's content
// (published + admin's in-progress draft, via resolveEditorPreview) pass it
// straight through instead of this component re-fetching published-only
// content itself — used only by app/find-your-therapist/page.tsx today, so
// that page's editor preview reflects unpublished edits live. Every other
// render site keeps calling `<DonateBand />` with no props, unchanged.
export default async function DonateBand({
  content: contentProp,
  variant = "navy",
}: { content?: DonateBandContent; variant?: "navy" | "ivory" } = {}) {
  const content = contentProp ?? (await getPageContent("component_donate_band", DONATE_BAND_CONTENT_FALLBACK));
  const crisisLinkIsExternal = content.crisisLinkHref.startsWith("http");
  const isIvory = variant === "ivory";

  return (
    <section className={isIvory ? "section bg-clay-soft" : "section bg-gradient-to-br from-primary to-primary-600"}>
      <div className="wrap text-center">
        <h2 className={`mb-2.5 font-serif text-[34px] font-semibold ${isIvory ? "text-espresso" : "text-white"}`}>
          <EditableText contentId="about.donate.headline" label="Donation band heading" value={content.headline} as="span" />
        </h2>
        <p className={`mx-auto max-w-[560px] ${isIvory ? "text-espresso/75" : "text-white/80"}`}>
          <EditableText contentId="about.donate.subtitle" label="Donation band body" value={content.subtitle} as="span" />
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
          <VolunteerPrimaryCta href={content.cta1Href} className={isIvory ? IVORY_PILL_CLASS : PILL_CLASS}>
            <EditableText contentId="about.donate.cta1Label" label="CTA 1 label" value={content.cta1Label} as="span" />
          </VolunteerPrimaryCta>
          <Link href={content.cta2Href} className={isIvory ? IVORY_PILL_CLASS : PILL_CLASS}>
            <EditableText contentId="about.donate.cta2Label" label="CTA 2 label" value={content.cta2Label} as="span" />
          </Link>
        </div>
        <p className={`mt-5 flex items-center justify-center gap-1.5 text-[14px] ${isIvory ? "text-espresso/75" : "text-white/80"}`}>
          <Heart size={15} className="flex-none" />
          <EditableText contentId="about.donate.crisisText" label="Crisis line text" value={content.crisisText} as="span" />{" "}
          <a
            href={content.crisisLinkHref}
            target={crisisLinkIsExternal ? "_blank" : undefined}
            rel={crisisLinkIsExternal ? "noreferrer" : undefined}
            className={`underline underline-offset-2 ${isIvory ? "hover:text-espresso" : "hover:text-white"}`}
          >
            <EditableText contentId="about.donate.crisisLinkLabel" label="Crisis link label" value={content.crisisLinkLabel} as="span" />
          </a>
        </p>
      </div>
    </section>
  );
}

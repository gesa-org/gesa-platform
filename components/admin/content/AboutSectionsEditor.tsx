"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ImageUploadField from "@/components/admin/content/ImageUploadField";
import type { AboutSectionsContent } from "@/lib/content";

type Point = AboutSectionsContent["howItWorksPoints"][number];
type Founder = AboutSectionsContent["founders"][number];

// Everything on the About page below the hero (mission, how-it-works cards,
// founders, the volunteer CTA band, and the legal/tax blurb) lives in one
// site_content row ("page_about_sections") since they're all edited and
// published together as "the rest of the About page." The hero itself is a
// separate row/tab (HeroEditor, "page_about_hero") because it's rendered by
// the shared Hero component used elsewhere.
export default function AboutSectionsEditor({ initial }: { initial: AboutSectionsContent }) {
  const [published, setPublished] = useState(initial.published);
  const [missionHeading, setMissionHeading] = useState(initial.missionHeading);
  const [missionParagraphs, setMissionParagraphs] = useState<string[]>(initial.missionParagraphs);
  const [howItWorksHeading, setHowItWorksHeading] = useState(initial.howItWorksHeading);
  const [howItWorksPoints, setHowItWorksPoints] = useState<Point[]>(initial.howItWorksPoints);
  const [foundersHeading, setFoundersHeading] = useState(initial.foundersHeading);
  const [foundersIntro, setFoundersIntro] = useState(initial.foundersIntro);
  const [founders, setFounders] = useState<Founder[]>(initial.founders);
  const [movementHeading, setMovementHeading] = useState(initial.movementHeading);
  const [movementSubtitle, setMovementSubtitle] = useState(initial.movementSubtitle);
  const [movementCtaLabel, setMovementCtaLabel] = useState(initial.movementCtaLabel);
  const [movementCtaHref, setMovementCtaHref] = useState(initial.movementCtaHref);
  const [teamEyebrow, setTeamEyebrow] = useState(initial.teamEyebrow);
  const [teamHeading, setTeamHeading] = useState(initial.teamHeading);
  const [teamIntro, setTeamIntro] = useState(initial.teamIntro);
  const [teamCtaLabel, setTeamCtaLabel] = useState(initial.teamCtaLabel);
  const [teamCtaHref, setTeamCtaHref] = useState(initial.teamCtaHref);
  const [volunteerHeading, setVolunteerHeading] = useState(initial.volunteerHeading);
  const [volunteerBody, setVolunteerBody] = useState(initial.volunteerBody);
  const [volunteerPrimaryLabel, setVolunteerPrimaryLabel] = useState(initial.volunteerPrimaryLabel);
  const [volunteerPrimaryHref, setVolunteerPrimaryHref] = useState(initial.volunteerPrimaryHref);
  const [volunteerSecondaryLabel, setVolunteerSecondaryLabel] = useState(initial.volunteerSecondaryLabel);
  const [volunteerSecondaryHref, setVolunteerSecondaryHref] = useState(initial.volunteerSecondaryHref);
  const [legalBlurb, setLegalBlurb] = useState(initial.legalBlurb);
  const [taxNote, setTaxNote] = useState(initial.taxNote);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function updatePoint(i: number, field: keyof Point, val: string) {
    setHowItWorksPoints((pts) => pts.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
  }
  function updateFounder(i: number, field: keyof Founder, val: string) {
    setFounders((fs) => fs.map((f, idx) => (idx === i ? { ...f, [field]: val } : f)));
  }
  function updateParagraph(i: number, val: string) {
    setMissionParagraphs((ps) => ps.map((p, idx) => (idx === i ? val : p)));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const value: AboutSectionsContent = {
      published,
      missionHeading,
      missionParagraphs,
      howItWorksHeading,
      howItWorksPoints,
      foundersHeading,
      foundersIntro,
      founders,
      movementHeading,
      movementSubtitle,
      movementCtaLabel,
      movementCtaHref,
      teamEyebrow,
      teamHeading,
      teamIntro,
      teamCtaLabel,
      teamCtaHref,
      volunteerHeading,
      volunteerBody,
      volunteerPrimaryLabel,
      volunteerPrimaryHref,
      volunteerSecondaryLabel,
      volunteerSecondaryHref,
      legalBlurb,
      taxNote,
    };
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "page_about_sections", value }, { onConflict: "key" });
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-7">
      <label className="flex items-center gap-2.5 text-[14px] font-medium">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
        Published
      </label>

      <section className="flex flex-col gap-3">
        <h3 className="text-[15px] font-semibold">Why GESA exists</h3>
        <p className="text-[12px] text-muted-fg">
          Not currently shown on the page (removed per Phase 77) — kept here in case a future layout brings it
          back. Editing this section has no visible effect on the live site right now.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Heading</label>
          <input
            value={missionHeading}
            onChange={(e) => setMissionHeading(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        {missionParagraphs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              rows={3}
              value={p}
              onChange={(e) => updateParagraph(i, e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setMissionParagraphs((ps) => ps.filter((_, idx) => idx !== i))}
              className="flex-none self-start rounded-lg p-2 text-destructive hover:bg-destructive/10"
              aria-label="Remove paragraph"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setMissionParagraphs((ps) => [...ps, ""])}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-primary hover:bg-secondary"
        >
          <Plus size={14} /> Add paragraph
        </button>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[15px] font-semibold">How it works</h3>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Heading</label>
          <input
            value={howItWorksHeading}
            onChange={(e) => setHowItWorksHeading(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        {howItWorksPoints.map((pt, i) => (
          <div key={i} className="rounded-xl border border-border p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-fg">Card {i + 1}</span>
              <button
                type="button"
                onClick={() => setHowItWorksPoints((pts) => pts.filter((_, idx) => idx !== i))}
                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Remove card"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <input
              value={pt.title}
              onChange={(e) => updatePoint(i, "title", e.target.value)}
              placeholder="Title"
              className="mb-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            <textarea
              rows={2}
              value={pt.body}
              onChange={(e) => updatePoint(i, "body", e.target.value)}
              placeholder="Body"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setHowItWorksPoints((pts) => [...pts, { title: "", body: "" }])}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-primary hover:bg-secondary"
        >
          <Plus size={14} /> Add card
        </button>
        <p className="text-[12px] text-muted-fg">
          Icons are fixed by card position and aren&apos;t editable here — the 5th card onward reuses the last icon.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[15px] font-semibold">Founder spotlight &amp; Team / Advisors</h3>
        <p className="text-[12px] text-muted-fg">
          Founder 1 below is shown as the spotlighted &quot;Meet [Name]&quot; section on its own. Founder 2
          onward appear instead in the Team &amp; Advisors grid further down the page.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Founder section eyebrow label</label>
          <input
            value={foundersHeading}
            onChange={(e) => setFoundersHeading(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Intro (not currently shown on the page — kept for a future layout)</label>
          <textarea
            rows={2}
            value={foundersIntro}
            onChange={(e) => setFoundersIntro(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        {founders.map((f, i) => (
          <div key={i} className="rounded-xl border border-border p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-fg">
                {i === 0 ? "Founder 1 (spotlighted)" : `Team member ${i + 1}`}
              </span>
              <button
                type="button"
                onClick={() => setFounders((fs) => fs.filter((_, idx) => idx !== i))}
                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Remove founder"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <ImageUploadField
              label="Photo"
              value={f.photoUrl ?? ""}
              onChange={(url) => updateFounder(i, "photoUrl", url)}
              pathPrefix={`founders/${i}`}
              help="Shown on the About page in place of their initials. Optional — leave empty to keep showing initials."
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={f.name}
                onChange={(e) => updateFounder(i, "name", e.target.value)}
                placeholder="Name"
                className="rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
              <input
                value={f.roleTitle}
                onChange={(e) => updateFounder(i, "roleTitle", e.target.value)}
                placeholder="Role title"
                className="rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>
            <input
              value={f.email}
              onChange={(e) => updateFounder(i, "email", e.target.value)}
              placeholder="Email"
              className="my-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            <textarea
              rows={3}
              value={f.shortBio}
              onChange={(e) => updateFounder(i, "shortBio", e.target.value)}
              placeholder="Short bio"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFounders((fs) => [...fs, { name: "", roleTitle: "", email: "", shortBio: "", photoUrl: "" }])}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-primary hover:bg-secondary"
        >
          <Plus size={14} /> Add founder
        </button>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[15px] font-semibold">Movement tagline band</h3>
        <p className="text-[12px] text-muted-fg">Sits between the founder spotlight and Team &amp; Advisors.</p>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Heading</label>
          <input
            value={movementHeading}
            onChange={(e) => setMovementHeading(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Subtitle</label>
          <input
            value={movementSubtitle}
            onChange={(e) => setMovementSubtitle(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Button label</label>
            <input
              value={movementCtaLabel}
              onChange={(e) => setMovementCtaLabel(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Button link</label>
            <input
              value={movementCtaHref}
              onChange={(e) => setMovementCtaHref(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[15px] font-semibold">Team &amp; Advisors</h3>
        <p className="text-[12px] text-muted-fg">
          Lists founders 2 onward (see the Founder section above to add or edit those people).
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Eyebrow</label>
          <input
            value={teamEyebrow}
            onChange={(e) => setTeamEyebrow(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Heading</label>
          <input
            value={teamHeading}
            onChange={(e) => setTeamHeading(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Intro</label>
          <textarea
            rows={2}
            value={teamIntro}
            onChange={(e) => setTeamIntro(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Button label</label>
            <input
              value={teamCtaLabel}
              onChange={(e) => setTeamCtaLabel(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Button link</label>
            <input
              value={teamCtaHref}
              onChange={(e) => setTeamCtaHref(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[15px] font-semibold">Volunteer CTA band</h3>
        <p className="text-[12px] text-muted-fg">
          Not currently shown on the page (removed per Phase 85) — kept here in case a future layout brings it
          back. Editing this section has no visible effect on the live site right now.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Heading</label>
          <input
            value={volunteerHeading}
            onChange={(e) => setVolunteerHeading(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Body</label>
          <textarea
            rows={2}
            value={volunteerBody}
            onChange={(e) => setVolunteerBody(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Primary CTA label</label>
            <input
              value={volunteerPrimaryLabel}
              onChange={(e) => setVolunteerPrimaryLabel(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Primary CTA link</label>
            <input
              value={volunteerPrimaryHref}
              onChange={(e) => setVolunteerPrimaryHref(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Secondary CTA label</label>
            <input
              value={volunteerSecondaryLabel}
              onChange={(e) => setVolunteerSecondaryLabel(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Secondary CTA link</label>
            <input
              value={volunteerSecondaryHref}
              onChange={(e) => setVolunteerSecondaryHref(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="text-[15px] font-semibold">Legal / tax blurb</h3>
        <p className="text-[12px] text-muted-fg">
          Not currently shown on the page (removed per Phase 85) — kept here in case a future layout brings it
          back. Editing this section has no visible effect on the live site right now.
        </p>
        <textarea
          rows={2}
          value={legalBlurb}
          onChange={(e) => setLegalBlurb(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        <input
          value={taxNote}
          onChange={(e) => setTaxNote(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </section>

      <div className="flex items-center gap-4 border-t border-border pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
        {status === "error" && <span className="text-[13.5px] font-medium text-destructive">Couldn&apos;t save — try again.</span>}
      </div>
    </form>
  );
}

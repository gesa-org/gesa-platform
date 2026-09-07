"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, MapPin, Users, Clock, User, X, Hourglass } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Tables } from "@/lib/database.types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { SupportGroupsDirectoryContent } from "@/lib/content";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { MOTION_DURATION, MOTION_EASE } from "@/components/motion/config";
import EditableText from "@/components/ui-builder/public/EditableText";

// Phase 157 — every group in `support_groups` has always had fabricated
// facilitator/schedule/capacity/location values (Phase 2/3 placeholder seed
// data, never replaced with anything real) — none of the six groups on this
// page have an actual confirmed facilitator or session. Rather than keep
// showing invented details, any group whose `status` isn't `"active"` now
// renders a "Coming Soon" badge, no facilitator/schedule/capacity/location,
// and a safe "not yet available" state instead of the registration flow. A
// group only gets the full, original card/drawer/register experience once
// someone deliberately sets `status = 'active'` and fills in real details —
// nothing here assumes a null/placeholder shape is "active" by mistake.
function isGroupAvailable(g: Pick<Tables<"support_groups">, "status">): boolean {
  return g.status === "active";
}

const COMING_SOON_BADGE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-[#e8c874]/50 bg-black/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#e8c874]";

const COMING_SOON_SUPPORT_TEXT =
  "This community session is currently being prepared. Facilitator and schedule details will be announced soon.";

export const SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK: SupportGroupsDirectoryContent = {
  published: true,
  noGroupsMessage: "No support groups are open for registration right now — check back soon.",
  registerButtonLabel: "Register",
  confirmButtonLabel: "Confirm registration",
  successHeading: "You're registered",
};

// Phase 46 — Roy flagged that the Support Groups page read as effectively
// unanimated compared to Home/About. This is the actual main content of
// that page (the group-picker list and its live preview card), so it's
// the highest-leverage place to add motion here.
//
// Phase 48 — restyled the group cards and preview panel as dark
// charcoal-navy with gold accents (see `.charcoal-marble` in
// app/globals.css), per Roy's reference mockup.
//
// Phase 49 — Roy clarified the mockup's interaction model: clicking a
// group card should open its details "in the right field" as a modal —
// i.e. a slide-in drawer, not an always-visible inline column. Rebuilt
// around that: the cards are now a 2-column grid (matching the mockup's
// layout), and clicking one opens a right-side drawer (own backdrop,
// own close button, slides in via framer-motion) showing that group's
// details and the Register button. Closing the drawer doesn't clear
// `activeId` — the drawer just hides — so reopening any card immediately
// shows the right content with no flash of stale data.
//
// Also per Roy's explicit correction: the mockup's "Secure Phone
// Verification" boxes (on every card) and the "Phone Modal" box (in the
// side panel) aren't real features anywhere in this app — registration
// only ever had a plain optional phone *number* field, never a
// verification step. Removed instead of built, and that visual slot in
// the drawer is filled with the actual existing content instead: the
// real online-call preview or in-person location details, exactly as
// implemented since Phase 30/42, just relocated into the drawer.
//
// Every piece of real data (g.title, g.format, g.description,
// g.facilitator_name, g.schedule, g.capacity, g.location), the
// registration form's fields/validation/Supabase insert/email call, and
// the shared components/ui/Modal.tsx (used by other flows) are all
// unchanged — only the container/interaction around the group details
// (inline column -> drawer) and the removed fake fields are different
// from Phase 48.
//
// Phase 157 — every branch above (card, drawer, register modal) now only
// runs for a group whose `status === "active"`. Every group today is
// `"coming_soon"` (see the migration's own comment), so in practice every
// card currently renders the new coming-soon branch — but nothing here is
// hardcoded to "there are no active groups yet"; the moment a real group's
// `status` flips to `"active"` with real facilitator/schedule/capacity
// data filled in, that one card/drawer automatically reverts to the exact
// original experience, with zero redesign.
export default function SupportGroupsInteractive({
  groups,
  content = SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK,
}: {
  groups: Tables<"support_groups">[];
  content?: SupportGroupsDirectoryContent;
}) {
  const [activeId, setActiveId] = useState(groups[0]?.id);
  const active = groups.find((g) => g.id === activeId) ?? groups[0];
  const [previewOpen, setPreviewOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerState, setRegisterState] = useState<"idle" | "pending" | "done" | "error">("idle");

  if (!active) {
    return (
      <div className="mt-10 rounded-[var(--radius)] border border-border bg-card p-7 text-center text-muted-fg">
        <EditableText contentId="supportGroups.directory.noGroupsMessage" label="No-groups message" value={content.noGroupsMessage} as="span" />
      </div>
    );
  }

  return (
    <div className="mt-11 mt-[44px]">
      <StaggerGroup className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => {
          const isOn = g.id === activeId;
          const available = isGroupAvailable(g);
          return (
            <StaggerItem key={g.id}>
              <button
                onClick={() => {
                  setActiveId(g.id);
                  setPreviewOpen(true);
                }}
                aria-label={available ? g.title : `${g.title} — coming soon, not yet available`}
                className={`gold-card-hover relative w-full overflow-hidden rounded-2xl border p-5 text-left text-white outline-none transition-all duration-300 charcoal-marble ${
                  isOn ? "border-clay shadow-lg shadow-black/40" : "border-white/10 hover:border-clay/60"
                } ${available ? "" : "opacity-80 saturate-[0.65]"}`}
              >
                <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-clay/50 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-[#e8c874]">
                    {g.format === "online" ? <Video size={12} /> : <MapPin size={12} />}
                    {g.format === "online" ? "Online" : "In person"}
                  </span>
                  {/* Phase 157 — "Coming Soon" status badge. Real text (not
                      just an icon), so it reads correctly to screen readers
                      alongside the aria-label above. */}
                  {!available && (
                    <span className={COMING_SOON_BADGE_CLASS}>
                      <Hourglass size={12} aria-hidden="true" />
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="relative z-10 font-serif text-[19px] text-[#e8c874]">{g.title}</h3>
                <div className="relative z-10">
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">{g.description}</p>
                  {available ? (
                    <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12.5px] text-white/65">
                      <span className="inline-flex items-center gap-1.5">
                        <User size={13} /> {g.facilitator_name}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} /> {g.schedule}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={13} /> {g.capacity} seats
                      </span>
                    </div>
                  ) : (
                    /* Phase 157 — no facilitator name, date/time, or seat
                       count is shown here (none has ever been confirmed for
                       any group) — just the same supporting line every
                       coming-soon group shares. */
                    <p className="mt-2 text-[12.5px] italic leading-relaxed text-white/55">{COMING_SOON_SUPPORT_TEXT}</p>
                  )}
                </div>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      {/* Phase 49 — the group-details drawer. Own backdrop + own close
          control, independent of components/ui/Modal.tsx (kept untouched
          since that's shared with the booking/intake flows). */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            key="preview-backdrop"
            className="fixed inset-0 z-[70] bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_DURATION.micro }}
            onClick={() => setPreviewOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            key="preview-drawer"
            className="charcoal-marble fixed inset-y-0 right-0 z-[80] flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-clay/40 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
          >
            <button
              onClick={() => setPreviewOpen(false)}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/40"
            >
              <X size={18} />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {isGroupAvailable(active) ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
                  className="flex flex-1 flex-col items-center gap-4 p-8 pt-16 text-center"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-clay/50 bg-black/20 font-serif text-2xl text-[#e8c874]">
                    {(active.facilitator_name ?? "?")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <h3 className="font-serif text-2xl text-[#e8c874]">{active.title}</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-clay/50 bg-black/25 px-3 py-1 text-[12px] font-semibold text-[#e8c874]">
                    {active.format === "online" ? <Video size={13} /> : <MapPin size={13} />}
                    {active.format === "online" ? "Online" : "In person"}
                  </span>

                  {/* The real, existing per-format details — same content
                      that used to sit in the always-visible inline panel
                      before Phase 49, just relocated into the drawer. */}
                  {active.format === "online" ? (
                    <div className="mb-2 flex gap-4">
                      {["mic", "video", "end"].map((k) => (
                        <span
                          key={k}
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${
                            k === "end" ? "bg-destructive text-white" : "bg-[#e8c874]/90 text-[#241b06]"
                          }`}
                        >
                          {k === "video" ? <Video size={18} /> : k === "end" ? "×" : "•"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-clay/30 bg-black/15 text-[#e8c874]">
                      <MapPin size={26} />
                    </div>
                  )}

                  <div className="w-full rounded-2xl border border-white/10 bg-black/15 p-4 text-left text-sm text-white/75">
                    {active.format !== "online" && (
                      <div className="flex items-center gap-2 py-1">
                        <MapPin size={14} /> {active.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 py-1">
                      <User size={14} /> {active.facilitator_name}
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <Clock size={14} /> {active.schedule}
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <Users size={14} /> {active.capacity} seats
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setRegisterState("idle");
                      setRegisterOpen(true);
                    }}
                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-clay to-amber py-3 text-sm font-bold text-[#241b06] shadow-md transition-transform hover:-translate-y-px"
                  >
                    {content.registerButtonLabel}
                  </button>
                </motion.div>
              ) : (
                /* Phase 157 — the "not yet available" state. No facilitator
                   name, schedule, capacity, or location anywhere here (none
                   confirmed), and deliberately no path into the registration
                   form below — only two safe actions, both of which just
                   close this drawer or navigate away from it, never toward
                   a booking/intake flow. */
                <motion.div
                  key={`${active.id}-coming-soon`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
                  className="flex flex-1 flex-col items-center gap-4 p-8 pt-16 text-center"
                  role="status"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-clay/50 bg-black/20 text-[#e8c874]">
                    <Hourglass size={28} aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#e8c874]">{active.title}</h3>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-clay/50 bg-black/25 px-3 py-1 text-[12px] font-semibold text-[#e8c874]">
                      {active.format === "online" ? <Video size={13} /> : <MapPin size={13} />}
                      {active.format === "online" ? "Online" : "In person"}
                    </span>
                    <span className={COMING_SOON_BADGE_CLASS}>
                      <Hourglass size={12} aria-hidden="true" />
                      Coming Soon
                    </span>
                  </div>

                  <div className="w-full rounded-2xl border border-white/10 bg-black/15 p-5 text-left text-sm text-white/80">
                    <p className="font-semibold text-white">This support group is not yet available</p>
                    <p className="mt-2 leading-relaxed">
                      We are currently finalizing the facilitator and session schedule for this group. Please check
                      back soon for updates.
                    </p>
                  </div>

                  <div className="mt-2 flex w-full flex-col gap-2.5">
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="w-full rounded-xl border border-clay/50 bg-black/20 py-3 text-sm font-semibold text-[#e8c874] transition-colors hover:bg-black/30"
                    >
                      Back to Community
                    </button>
                    <Link
                      href="/therapists"
                      className="w-full rounded-xl bg-gradient-to-r from-clay to-amber py-3 text-center text-sm font-bold text-[#241b06] shadow-md transition-transform hover:-translate-y-px"
                    >
                      Explore Other Support Options
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}>
        {registerState === "done" ? (
          <div className="py-4 text-center">
            <h3 className="mb-2 font-serif text-lg font-semibold text-primary">{content.successHeading}</h3>
            <p className="text-muted-fg">
              Confirmation for <strong>{active.title}</strong> is on its way to your inbox.
            </p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3.5"
            onSubmit={async (e) => {
              e.preventDefault();
              setRegisterState("pending");
              const data = new FormData(e.currentTarget);
              const name = String(data.get("name") ?? "");
              const email = String(data.get("email") ?? "");
              const phone = String(data.get("phone") ?? "");
              const supabase = createClient();
              const { error } = await supabase.from("group_registrations").insert({
                group_id: active.id,
                name,
                email,
                phone: phone || null,
              });
              if (error) {
                setRegisterState("error");
                return;
              }
              setRegisterState("done");
              fetch("/api/email/group-registration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, groupTitle: active.title, schedule: active.schedule }),
              }).catch(() => {});
            }}
          >
            <h3 className="font-serif text-lg font-semibold text-primary">Register for {active.title}</h3>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Name</label>
              <input
                name="name"
                required
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-clay focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-clay focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Phone (optional)</label>
              <input
                name="phone"
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-clay focus:outline-none"
              />
            </div>
            {registerState === "error" && (
              <p className="text-sm text-destructive">Something went wrong — please try again.</p>
            )}
            <Button type="submit" block variant="clay">
              {registerState === "pending" ? "Registering…" : content.confirmButtonLabel}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

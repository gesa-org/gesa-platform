"use client";

import { useState } from "react";
import { Video, MapPin, Users, Clock, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Tables } from "@/lib/database.types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { SupportGroupsDirectoryContent } from "@/lib/content";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import { MOTION_DURATION, MOTION_EASE } from "@/components/motion/config";

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
// the highest-leverage place to add motion here: the group list gets the
// same staggered card entrance used everywhere else, and — the bigger,
// more "advanced" addition — the preview card on the right now crossfades
// its content when a different group is selected instead of snapping
// instantly, via AnimatePresence keyed on the active group's id. No
// change to the selection logic, the registration flow, the modal, or any
// copy — purely how the already-existing state transition is presented.
//
// Phase 48 — Roy sent a reference mockup restyling this same content as
// dark charcoal-navy cards with gold serif headings and gold-bordered
// pills (see `.charcoal-marble` in app/globals.css). Every piece of real
// data below — g.title, g.format, g.description, g.facilitator_name,
// g.schedule, g.capacity, the online/in-person preview layouts, the
// Register button, the registration form's fields and submit logic — is
// unchanged; only colors/backgrounds/borders changed. The mockup also
// showed a "Secure Phone Verification" element with a progress bar on
// each card and inside a "Phone Modal" — that isn't a real feature
// anywhere in this app (there's no phone-verification step in the
// registration flow, just the existing optional phone number field), so
// it wasn't added; inventing a fake control here would contradict Roy's
// own instruction not to change this page's controls or logic, only its
// UI. The registration modal's own panel chrome (backdrop, close button)
// comes from the shared components/ui/Modal.tsx, used by other flows
// (booking, intake) too — left that file untouched and only restyled the
// content Modal renders here (the form itself), so this page's redesign
// doesn't bleed into unrelated modals elsewhere on the site.
export default function SupportGroupsInteractive({
  groups,
  content = SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK,
}: {
  groups: Tables<"support_groups">[];
  content?: SupportGroupsDirectoryContent;
}) {
  const [activeId, setActiveId] = useState(groups[0]?.id);
  const active = groups.find((g) => g.id === activeId) ?? groups[0];
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerState, setRegisterState] = useState<"idle" | "pending" | "done" | "error">("idle");

  if (!active) {
    return (
      <div className="mt-10 rounded-[var(--radius)] border border-border bg-card p-7 text-center text-muted-fg">
        {content.noGroupsMessage}
      </div>
    );
  }

  return (
    <div className="mt-11 mt-[44px] grid gap-11 gap-[44px] lg:grid-cols-[1fr_0.92fr] lg:items-center">
      <StaggerGroup className="flex flex-col gap-3.5">
        {groups.map((g) => {
          const isOn = g.id === activeId;
          return (
            <StaggerItem key={g.id}>
              <button
                onClick={() => setActiveId(g.id)}
                className={`gold-card-hover relative w-full overflow-hidden rounded-2xl border p-5 text-left text-white outline-none transition-all duration-300 charcoal-marble ${
                  isOn ? "border-clay shadow-lg shadow-black/40" : "border-white/10 hover:border-clay/60"
                }`}
              >
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-clay/50 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-[#e8c874]">
                  {g.format === "online" ? <Video size={12} /> : <MapPin size={12} />}
                  {g.format === "online" ? "Online" : "In person"}
                </span>
                <h3 className="relative z-10 font-serif text-[19px] text-[#e8c874]">{g.title}</h3>
                {/* Phase 48 — Roy's mockup shows every card's description
                    and meta row visible at once, not just the selected
                    one. Previously this block only rendered `{isOn &&
                    ...}` (Phase 30 behavior: only the active card
                    expanded). Matching the reference image's information
                    density — same text, same fields, just no longer
                    gated behind selection — since the mockup was the
                    explicit brief for "the UI in the section." The
                    selection/registration/preview-panel logic itself is
                    unchanged; `isOn` still drives the border highlight and
                    which group the right-hand preview panel shows. */}
                <div className="relative z-10">
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">{g.description}</p>
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
                </div>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      <div className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-[420px] rounded-[26px] bg-gradient-to-br from-clay to-amber p-1.5 shadow-lg">
          <div className="charcoal-marble flex min-h-[380px] flex-col overflow-hidden rounded-[20px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
                className="flex flex-1 flex-col"
              >
                {active.format === "online" ? (
                  <div className="flex flex-1 flex-col items-center justify-end gap-4 p-6 text-white">
                    <div className="text-center font-serif text-sm text-[#e8c874]">{active.title}</div>
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-clay/50 bg-black/20 font-serif text-3xl text-[#e8c874]">
                      {(active.facilitator_name ?? "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </div>
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
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex h-32 items-center justify-center rounded-xl border border-clay/30 bg-black/15 text-[#e8c874]">
                      <MapPin size={30} />
                    </div>
                    <div className="text-sm text-white/75">
                      <div className="flex items-center gap-2 py-1">
                        <MapPin size={14} /> {active.location}
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <Clock size={14} /> {active.schedule}
                      </div>
                      <div className="flex items-center gap-2 py-1">
                        <Users size={14} /> {active.capacity} seats
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="flex-none p-4">
              <button
                onClick={() => {
                  setRegisterState("idle");
                  setRegisterOpen(true);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-clay to-amber py-3 text-sm font-bold text-[#241b06] shadow-md transition-transform hover:-translate-y-px"
              >
                {content.registerButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

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

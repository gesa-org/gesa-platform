"use client";

import { useState } from "react";
import { Video, MapPin, Users, Clock, User } from "lucide-react";
import type { Tables } from "@/lib/database.types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { SupportGroupsDirectoryContent } from "@/lib/content";

export const SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK: SupportGroupsDirectoryContent = {
  published: true,
  noGroupsMessage: "No support groups are open for registration right now — check back soon.",
  registerButtonLabel: "Register",
  confirmButtonLabel: "Confirm registration",
  successHeading: "You're registered",
};

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
      <div className="flex flex-col gap-3.5">
        {groups.map((g) => {
          const isOn = g.id === activeId;
          return (
            <button
              key={g.id}
              onClick={() => setActiveId(g.id)}
              className={`relative rounded-2xl border p-5 text-left outline-none transition-all duration-300 ${
                isOn
                  ? "border-primary bg-primary text-white shadow-lg"
                  : "border-border bg-[#f3f0e8] hover:border-accent hover:shadow-soft"
              }`}
            >
              <span
                className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  isOn ? "border-white/30 bg-[#e7e2d8]/15 text-white" : "border-border bg-card text-muted-fg"
                }`}
              >
                {g.format === "online" ? <Video size={12} /> : <MapPin size={12} />}
                {g.format === "online" ? "Online" : "In person"}
              </span>
              <h3 className="text-[19px]">{g.title}</h3>
              {isOn && (
                <>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/85">{g.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12.5px] text-white/85">
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
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-[420px] rounded-[26px] bg-gradient-to-br from-primary to-accent p-1.5 shadow-lg">
          <div className="flex min-h-[380px] flex-col overflow-hidden rounded-[20px] bg-card">
            {active.format === "online" ? (
              <div className="flex flex-1 flex-col items-center justify-end gap-4 bg-gradient-to-br from-[#4a453a] to-primary p-6 text-white">
                <div className="text-center text-sm opacity-90">{active.title}</div>
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/35 bg-[#e7e2d8]/15 font-serif text-3xl">
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
                        k === "end" ? "bg-destructive text-white" : "bg-[#e7e2d8]/90 text-[#292a27]"
                      }`}
                    >
                      {k === "video" ? <Video size={18} /> : k === "end" ? "×" : "•"}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col bg-[#e7e2d8] p-6">
                <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-[#e7e2d8]/70 text-primary">
                  <MapPin size={30} />
                </div>
                <div className="text-sm text-[#4a453d]">
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
            <div className="flex-none p-4">
              <button
                onClick={() => {
                  setRegisterState("idle");
                  setRegisterOpen(true);
                }}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white"
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
            <h3 className="mb-2 text-lg font-semibold">{content.successHeading}</h3>
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
            <h3 className="text-lg font-semibold">Register for {active.title}</h3>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Name</label>
              <input
                name="name"
                required
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Phone (optional)</label>
              <input
                name="phone"
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>
            {registerState === "error" && (
              <p className="text-sm text-destructive">Something went wrong — please try again.</p>
            )}
            <Button type="submit" block>
              {registerState === "pending" ? "Registering…" : content.confirmButtonLabel}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

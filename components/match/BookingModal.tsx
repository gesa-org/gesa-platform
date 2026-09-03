"use client";

import { useState } from "react";
import { X, Video, MessageCircle, MapPin, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import type { WizardAnswers, TherapistMatch } from "@/components/match/types";
import type { Tables } from "@/lib/database.types";

function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function mapsDirectionsLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function BookingModal({
  match,
  answers,
  clinicLocation,
  onClose,
}: {
  match: TherapistMatch;
  answers: WizardAnswers;
  clinicLocation: Tables<"clinic_locations"> | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Phase 126 — the match object no longer carries a raw phone number
  // (only the has_whatsapp boolean, for the pre-booking gate). The actual
  // number, if there is one, only comes back from /api/match-booking after
  // a real booking is created — never before.
  const [therapistContactPhone, setTherapistContactPhone] = useState<string | null>(null);

  const t = match.therapist;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/match-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          symptoms: answers.symptoms,
          treatmentType: answers.treatmentType || null,
          genderPreference: answers.genderPreference,
          sessionFormat: answers.sessionFormat,
          clinicLocationId: answers.clinicLocationId,
          preferredDate: date || null,
          preferredTime: time || null,
          selectedTherapistId: t.id,
          selectedTherapistName: t.full_name,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json().catch(() => null);
      setTherapistContactPhone(data?.therapistContactPhone ?? null);
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[var(--radius)] bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <span className="eyebrow">Book a session</span>
            <h2 className="text-[20px]">with {t.full_name}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-fg hover:bg-secondary" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="rounded-xl bg-accent-soft p-6 text-center">
            <h3 className="mb-1.5 text-lg">You&apos;re all set</h3>
            <p className="text-muted-fg">
              We&apos;ve sent your request to {t.full_name}. Check your email — you&apos;ll hear from us shortly to
              confirm your session.
            </p>
            {answers.sessionFormat === "call" && therapistContactPhone && (
              <a
                href={whatsappLink(
                  therapistContactPhone,
                  `Hi ${t.full_name}, I just requested a call session with GESA and wanted to reach out directly.`
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[15px] font-semibold text-white transition-transform hover:-translate-y-px"
              >
                <MessageCircle size={16} /> Message {t.full_name} on WhatsApp
              </a>
            )}
            <div>
              <Button onClick={onClose} className="mt-4">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Preferred date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Preferred time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <p className="-mt-2 text-[12.5px] text-muted-fg">
              This is a request, not a confirmed slot — our team will confirm the exact time with you.
            </p>

            {answers.sessionFormat === "online" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/50 p-3.5 text-[13.5px] text-muted-fg">
                <Video size={16} className="mt-0.5 flex-none text-primary" />
                <span>We&apos;ll email you a Zoom link once {t.full_name} confirms your session.</span>
              </div>
            )}

            {answers.sessionFormat === "call" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/50 p-3.5 text-[13.5px] text-muted-fg">
                <MessageCircle size={16} className="mt-0.5 flex-none text-primary" />
                <span>
                  Once confirmed, you can message {t.full_name} directly on WhatsApp to arrange your call.
                </span>
              </div>
            )}

            {answers.sessionFormat === "in_person" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/50 p-3.5 text-[13.5px] text-muted-fg">
                <MapPin size={16} className="mt-0.5 flex-none text-primary" />
                {clinicLocation ? (
                  <span>
                    Meeting at <strong className="text-foreground">{clinicLocation.name}</strong>,{" "}
                    {clinicLocation.address}.{" "}
                    <a
                      href={mapsDirectionsLink(clinicLocation.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary underline"
                    >
                      Get directions
                    </a>
                  </span>
                ) : (
                  <span>Our team will confirm a convenient location with you.</span>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" block disabled={pending}>
              {pending ? "Sending…" : "Confirm request"} <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

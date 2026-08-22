"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Video, ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { ContactChannel, Tables } from "@/lib/database.types";

function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

const CHANNELS: { id: ContactChannel; label: string; icon: typeof Mail; description: string }[] = [
  { id: "email", label: "Email", icon: Mail, description: "We'll confirm and follow up at your email." },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, description: "Message your therapist directly." },
  { id: "zoom", label: "Zoom", icon: Video, description: "We'll email you a Zoom link before your session." },
];

// Phase 20 — the real conflict-free booking flow. Availability is fetched
// fresh from /api/therapist-availability (which already subtracts anything
// taken), and the slot is only actually reserved once /api/intake-booking's
// insert succeeds against the UNIQUE(therapist_id, session_date,
// session_time) constraint — so even if two people are looking at this same
// modal for the same therapist at the same time, only one of them can win a
// given slot. The other gets a clear "just taken, pick another" message
// (handled in the 409 branch below) instead of a silent double-booking.
export default function IntakeBookingModal({
  therapist,
  pathKey,
  onClose,
  onPickDifferentTherapist,
}: {
  therapist: Tables<"therapists">;
  pathKey: string;
  onClose: () => void;
  onPickDifferentTherapist: () => void;
}) {
  const [channel, setChannel] = useState<ContactChannel>("email");
  const [date, setDate] = useState(addDaysIso(1));
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; time: string; therapistPhone: string | null } | null>(
    null
  );

  const minDate = useMemo(() => todayIso(), []);
  const maxDate = useMemo(() => addDaysIso(14), []);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedTime(null);
    fetch(`/api/therapist-availability?therapistId=${therapist.id}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [therapist.id, date]);

  async function refetchSlots() {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/therapist-availability?therapistId=${therapist.id}&date=${date}`);
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime) {
      setError("Please choose a time.");
      return;
    }
    if (channel === "whatsapp" && !therapist.contact_phone) {
      setError("This therapist doesn't have WhatsApp connected yet — please choose Email or Zoom.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/intake-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          therapistId: therapist.id,
          therapistName: therapist.full_name,
          sessionDate: date,
          sessionTime: selectedTime,
          contactChannel: channel,
          path: pathKey,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError(data.error ?? "That time was just booked — please pick another slot.");
        await refetchSlots();
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "failed");
      setConfirmed({ date, time: selectedTime, therapistPhone: data.therapistContactPhone ?? null });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (confirmed) {
    return (
      <Modal open onClose={onClose}>
        <div className="text-center">
          <h3 className="mb-1.5 text-xl">You&apos;re booked with {therapist.full_name}</h3>
          <p className="text-muted-fg">
            {confirmed.date} at {formatTime(confirmed.time)}. This slot is reserved just for you.
          </p>

          {channel === "whatsapp" && confirmed.therapistPhone && (
            <a
              href={whatsappLink(
                confirmed.therapistPhone,
                `Hi ${therapist.full_name}, I just booked a GESA session with you for ${confirmed.date} at ${formatTime(confirmed.time)}.`
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[15px] font-semibold text-white hover:-translate-y-px transition-all"
            >
              <MessageCircle size={17} /> Message on WhatsApp
            </a>
          )}
          {channel === "zoom" && (
            <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-primary-600">
              We&apos;ll email your Zoom link before the session starts.
            </p>
          )}
          {channel === "email" && (
            <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-primary-600">
              Check your email — {therapist.full_name} will reach out to confirm any final details.
            </p>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose}>
      <button
        onClick={onPickDifferentTherapist}
        className="mb-3 flex items-center gap-1 text-[13px] font-semibold text-muted-fg hover:text-primary"
      >
        <ArrowLeft size={14} /> Choose a different therapist
      </button>

      <h3 className="mb-1 text-xl">Book with {therapist.full_name}</h3>
      <p className="mb-5 text-[14px] text-muted-fg">Pick how you&apos;d like to connect and a time that works.</p>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold">How should we connect you?</label>
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors ${
                  channel === c.id
                    ? "border-primary bg-accent-soft text-primary"
                    : "border-border text-muted-fg hover:border-primary-600"
                }`}
              >
                <c.icon size={18} />
                <span className="text-[13px] font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted-fg">
            {CHANNELS.find((c) => c.id === channel)?.description}
          </p>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <CalendarDays size={15} /> Date
          </label>
          <input
            type="date"
            required
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Time {therapist.time_zone ? `(${therapist.time_zone})` : ""}
          </label>
          {loadingSlots ? (
            <p className="text-[13.5px] text-muted-fg">Checking availability…</p>
          ) : slots.length === 0 ? (
            <p className="text-[13.5px] text-muted-fg">No open times this day — try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors ${
                    selectedTime === slot
                      ? "border-primary bg-primary text-white"
                      : "border-border hover:border-primary-600"
                  }`}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>

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
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        {channel === "whatsapp" && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Your phone (for WhatsApp)</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" block disabled={pending || !selectedTime}>
          {pending ? "Booking…" : "Confirm booking"} <ArrowRight size={16} />
        </Button>
        <p className="text-center text-[13px] text-muted-fg">
          This slot is reserved the moment you confirm — no one else can take it.
        </p>
      </form>
    </Modal>
  );
}

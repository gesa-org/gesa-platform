"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TagPicker from "@/components/ui/TagPicker";
import { createClient } from "@/lib/supabase/client";
import type { MeetingDurationChoice } from "@/lib/database.types";

// Phase 63 — Roy pointed out that "Become a volunteer therapist" / "Join us
// as a therapist" / "Volunteer" everywhere on the site all routed to the
// generic Contact form (name/email/subject/message), which doesn't collect
// anything close to what a real therapist profile needs — compare Karin
// Horen's real "Our Therapists" listing (specialties, languages, verified
// status, bio) to what the old flow ever asked for. This modal collects the
// real fields Roy specified: Full Name, proof of license/verification,
// specialties (required, curated quick-picks + unlimited custom), languages
// (required, curated quick-picks + unlimited custom, no cap), a required
// meeting duration (60/45/30 min presets, or a free-text "Specify time" —
// added Phase 64, revised Phase 65), and a bio —
// into the new therapist_applications table, reviewed by an admin at
// /admin/volunteer-applications before anyone becomes an actual listed
// therapist (that promotion step is a deliberate human decision, not
// automatic — this form does not create a therapists row by itself).
const SPECIALTY_OPTIONS = [
  "CBT",
  "Trauma Support",
  "Emotional Support for Couples",
  "Psychiatry",
  "Group Sessions",
  "Coach (Life Coach)",
  "Guided Meditation",
  "Social Work",
  "Children and Adolescents",
  "Mindful Self Compassion",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Hebrew",
  "Spanish",
  "French",
  "Arabic",
  "Russian",
  "Portuguese",
  "German",
  "Amharic",
  "Ukrainian",
];

// Phase 64 — Roy asked for a required, single-choice "Meeting Duration"
// field: how long a session this volunteer is willing to commit to.
// Single-select (not TagPicker, which is multi-select) — modeled on the
// same selected/unselected button styling used across the site's other
// single-choice pickers (e.g. gender preference, session format in the
// match wizard). Phase 65 — Roy pointed out "Anytime" didn't actually let
// a volunteer say how long they want a session to run; replaced it with
// "Specify time," which reveals a free-text input so they can state their
// own duration (e.g. "2 hours") — meant to be shown on their public
// profile once they're a listed therapist.
const MEETING_DURATION_OPTIONS: { value: MeetingDurationChoice; label: string }[] = [
  { value: "60", label: "60 min" },
  { value: "45", label: "45 min" },
  { value: "30", label: "30 min" },
  { value: "custom", label: "Specify time" },
];

export default function VolunteerApplicationModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [credentialsProof, setCredentialsProof] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [meetingDurationChoice, setMeetingDurationChoice] = useState<MeetingDurationChoice | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [bio, setBio] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (specialties.length === 0) {
      setError("Please select or add at least one specialty.");
      return;
    }
    if (languages.length === 0) {
      setError("Please select or add at least one language.");
      return;
    }
    if (!meetingDurationChoice) {
      setError("Please select a meeting duration.");
      return;
    }
    if (meetingDurationChoice === "custom" && customDuration.trim() === "") {
      setError("Please specify how long you'd like your sessions to be.");
      return;
    }
    // The preset choices ("60"/"45"/"30") are stored as-is; "Specify time"
    // stores the volunteer's own free text instead of the literal word
    // "custom" — that's the actual profile-facing duration value.
    const meetingDuration = meetingDurationChoice === "custom" ? customDuration.trim() : meetingDurationChoice;
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("therapist_applications").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      credentials_proof: credentialsProof,
      specialties,
      languages,
      meeting_duration: meetingDuration,
      bio,
    });

    setPending(false);
    if (insertError) {
      setError("Something went wrong submitting your application. Please try again.");
      return;
    }
    setSubmitted(true);
    // Best-effort — the application is already saved even if either email fails.
    fetch("/api/email/volunteer-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone: phone || null,
        credentialsProof,
        specialties,
        languages,
        meetingDuration,
        bio,
      }),
    }).catch(() => {});
  }

  if (submitted) {
    return (
      <Modal open onClose={onClose}>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-primary">
            <HeartHandshake size={22} />
          </div>
          <h3 className="mb-1.5 text-xl">Thank you, {fullName || "friend"}</h3>
          <p className="text-muted-fg">
            We&apos;ve received your volunteer therapist application. Our team reviews every application by hand and
            will follow up at {email} once we have.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose}>
      <h3 className="mb-1 text-xl">Become a volunteer therapist</h3>
      <p className="mb-5 text-[14px] text-muted-fg">
        Tell us about yourself — our team reviews every application before you&apos;re listed on the site.
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="volunteer-full-name" className="mb-1.5 block text-sm font-semibold">
              Full name <span className="text-destructive">*</span>
            </label>
            <input
              id="volunteer-full-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="volunteer-email" className="mb-1.5 block text-sm font-semibold">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="volunteer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="volunteer-phone" className="mb-1.5 block text-sm font-semibold">
            Phone (optional)
          </label>
          <input
            id="volunteer-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 123 4567"
            className="w-full max-w-[260px] rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="volunteer-credentials-proof" className="mb-1.5 block text-sm font-semibold">
            Proof of license / verification <span className="text-destructive">*</span>
          </label>
          <textarea
            id="volunteer-credentials-proof"
            required
            rows={3}
            value={credentialsProof}
            onChange={(e) => setCredentialsProof(e.target.value)}
            placeholder="Your license number, certifying body/institution, and any other credential details our team can verify."
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-[12px] text-muted-fg">
            Our team reviews this before you&apos;re listed as a verified volunteer.
          </p>
        </div>

        <TagPicker
          label="Specialties"
          options={SPECIALTY_OPTIONS}
          selected={specialties}
          onChange={setSpecialties}
          required
          customPlaceholder="Other specialty…"
          help="Pick any that apply, or add your own — at least one is required."
        />

        <TagPicker
          label="Languages"
          options={LANGUAGE_OPTIONS}
          selected={languages}
          onChange={setLanguages}
          required
          customPlaceholder="Other language…"
          help="Add every language you can work in — no limit, and not restricted to the list above."
        />

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Meeting duration <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Meeting duration">
            {MEETING_DURATION_OPTIONS.map((option) => {
              const isSelected = meetingDurationChoice === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setMeetingDurationChoice(option.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-accent-soft text-primary"
                      : "border-border text-foreground hover:border-primary-600"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {meetingDurationChoice === "custom" && (
            // Deliberately no `required` HTML attribute here — the actual
            // required-ness is enforced by handleSubmit's own JS check
            // above (setError(...)), same as Specialties/Languages, so a
            // browser's native constraint validation can't silently
            // swallow the submit event before that check ever runs.
            <input
              id="volunteer-duration-custom"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              placeholder="e.g. 2 hours, 90 minutes"
              aria-label="Specify your meeting duration"
              className="mt-2 w-full max-w-[260px] rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          )}
          <p className="mt-1 text-[12px] text-muted-fg">
            How long a session are you able to commit to volunteering. Pick a preset, or Specify time to enter your
            own — this is shown on your public profile once you&apos;re listed.
          </p>
        </div>

        <div>
          <label htmlFor="volunteer-bio" className="mb-1.5 block text-sm font-semibold">
            Bio <span className="text-destructive">*</span>
          </label>
          <textarea
            id="volunteer-bio"
            required
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about your background and why you'd like to volunteer with GESA."
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" block disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </Modal>
  );
}

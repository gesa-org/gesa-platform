"use client";

import { useMemo, useRef, useState } from "react";
import { HeartHandshake, Upload, X, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import { createClient } from "@/lib/supabase/client";
import { useSiteContent } from "@/lib/content-client";
import { GESA_PUBLIC_CONTACT_EMAIL } from "@/lib/contact";
import type { MeetingDurationChoice } from "@/lib/database.types";
import type { VolunteerApplicationModalContent } from "@/lib/content";

// Phase 189 — full rebuild of this modal per Roy's "Join Us as a Volunteer/
// Caregiver" spec: five sections (Personal Information, Professional
// Credentials, Availability & Scheduling, Profile Content, Legal Consent),
// a required profile photo with size/dimension validation, a word-counted
// bio, a fixed 30/45/60/90-minute duration dropdown (replacing the old
// 60/45/30 + free-text "Specify time" picker), and two required legal
// consents. Everything from Phase 63-65's original build (curated
// specialty/language lists, the therapist_applications insert, the
// best-effort notification email) is kept; this only adds the new fields
// and restructures the form around them. See EXECUTION_PLAN.md's Phase 189
// entry for the full field-by-field rationale.
export const VOLUNTEER_MODAL_CONTENT_FALLBACK: VolunteerApplicationModalContent = {
  published: true,
  heading: "Join us as a volunteer or caregiver",
  intro: "Tell us about yourself — our team reviews every application before you're listed on the site.",
  submitLabel: "Apply Now",
  submittingLabel: "Submitting…",
  thankYouHeading: "Thank you, {name}",
  thankYouBody:
    "We've received your application. Our team reviews every application by hand and will follow up at {email} once we have.",
};

// Phase 63 — curated quick-picks for specialties/languages; kept as the
// single master list for both the new "Primary Area of Expertise" (single
// select) and "Additional Areas of Expertise" (checkbox grid) fields per
// Roy's explicit instruction to reuse this list rather than introduce a
// second one.
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

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

// Phase 189 — Roy's spec, followed exactly: a plain fixed dropdown, no
// free-text option (replaces Phase 64/65's "Specify time" custom picker).
const DURATION_OPTIONS: { value: MeetingDurationChoice; label: string }[] = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
];

const BIO_MIN_WORDS = 80;
const BIO_MAX_WORDS = 250;
const PHOTO_MAX_BYTES = 256 * 1024;
const PHOTO_MIN_DIMENSION = 500;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      reject(new Error("Could not read that image file."));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children} <span className="text-destructive">*</span>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const checkboxClass = "h-4 w-4 cursor-pointer rounded border-border accent-primary focus-visible:ring-2 focus-visible:ring-primary/40";

export default function VolunteerApplicationModal({ onClose }: { onClose: () => void }) {
  const content = useSiteContent("component_volunteer_modal", VOLUNTEER_MODAL_CONTENT_FALLBACK);

  // Section 1 — Personal Information
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);

  // Section 2 — Professional Credentials
  const [hasCertification, setHasCertification] = useState<"yes" | "no" | "">("");
  const [credentialsProof, setCredentialsProof] = useState("");
  const [primaryExpertise, setPrimaryExpertise] = useState("");
  const [additionalExpertise, setAdditionalExpertise] = useState<string[]>([]);

  // Section 3 — Availability & Scheduling
  const [languages, setLanguages] = useState<string[]>([]);
  const [meetingDuration, setMeetingDuration] = useState<MeetingDurationChoice | "">("");
  const [calendarLink, setCalendarLink] = useState("");

  // Section 4 — Profile Content
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Section 5 — Legal Consent
  const [consentAffidavit, setConsentAffidavit] = useState(false);
  const [consentPrivacyTerms, setConsentPrivacyTerms] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioWordCount = countWords(bio);
  const bioTooShort = bioWordCount > 0 && bioWordCount < BIO_MIN_WORDS;
  const bioTooLong = bioWordCount > BIO_MAX_WORDS;
  const bioValid = bioWordCount >= BIO_MIN_WORDS && bioWordCount <= BIO_MAX_WORDS;

  function togglePrimary(value: string) {
    setPrimaryExpertise(value);
    // Spec: "the primary selection should also be checked" in Additional
    // Areas of Expertise — auto-included rather than making the applicant
    // check it twice; they can still add more on top of it.
    setAdditionalExpertise((prev) => (prev.includes(value) ? prev : [...prev, value]));
  }

  function toggleAdditional(value: string) {
    setAdditionalExpertise((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function toggleLanguage(value: string) {
    setLanguages((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError(`That image is too large — please upload one under ${Math.round(PHOTO_MAX_BYTES / 1024)}KB.`);
      return;
    }
    let dimensions: { width: number; height: number };
    try {
      dimensions = await readImageDimensions(file);
    } catch {
      setPhotoError("We couldn't read that image file — try a different one.");
      return;
    }
    if (dimensions.width < PHOTO_MIN_DIMENSION || dimensions.height < PHOTO_MIN_DIMENSION) {
      setPhotoError(`Please upload an image at least ${PHOTO_MIN_DIMENSION}×${PHOTO_MIN_DIMENSION}px (yours is ${dimensions.width}×${dimensions.height}px).`);
      return;
    }

    setPhotoUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("volunteer-application-photos").upload(path, file, {
      contentType: file.type,
    });
    setPhotoUploading(false);
    if (uploadError) {
      setPhotoError(
        `Upload failed — please try again, or email your photo to ${GESA_PUBLIC_CONTACT_EMAIL} and we'll add it to your application.`
      );
      return;
    }
    const { data } = supabase.storage.from("volunteer-application-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
  }

  // Single source of truth for "can this be submitted" — drives both the
  // disabled Apply Now button and, as a fallback, the inline error shown if
  // onSubmit somehow fires anyway (e.g. Enter key in a text field).
  const validationError = useMemo(() => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!gender) return "Please select a gender.";
    if (!country.trim()) return "Please enter your country.";
    if (!email.trim() || !isValidEmail(email)) return "Please enter a valid email address.";
    if (!phone || !phoneValid) return "Please enter a valid mobile number.";
    if (!hasCertification) return "Please tell us whether you have a certification.";
    if (hasCertification === "yes" && !credentialsProof.trim())
      return "Please share your certification/license details.";
    if (!primaryExpertise) return "Please select your primary area of expertise.";
    if (additionalExpertise.length === 0) return "Please select at least one area of expertise.";
    if (!additionalExpertise.includes(primaryExpertise))
      return "Your primary area of expertise should also be checked in Additional Areas of Expertise.";
    if (languages.length === 0) return "Please select at least one language you offer.";
    if (!meetingDuration) return "Please select a session/engagement duration.";
    if (bioWordCount === 0) return "Please write a short bio.";
    if (bioTooShort) return `Your bio needs at least ${BIO_MIN_WORDS} words (currently ${bioWordCount}).`;
    if (bioTooLong) return `Your bio must be ${BIO_MAX_WORDS} words or fewer (currently ${bioWordCount}).`;
    if (!photoUrl) return "Please upload a profile picture.";
    if (!consentAffidavit) return "Please confirm you've read the Affidavit.";
    if (!consentPrivacyTerms) return "Please confirm you've read the Privacy Policy and Terms & Conditions.";
    return null;
  }, [
    fullName,
    gender,
    country,
    email,
    phone,
    phoneValid,
    hasCertification,
    credentialsProof,
    primaryExpertise,
    additionalExpertise,
    languages,
    meetingDuration,
    bioWordCount,
    bioTooShort,
    bioTooLong,
    photoUrl,
    consentAffidavit,
    consentPrivacyTerms,
  ]);

  const canSubmit = validationError === null && !photoUploading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouchedSubmit(true);
    if (validationError) {
      setError(validationError);
      return;
    }
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("therapist_applications").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      phone,
      gender,
      country: country.trim(),
      has_certification: hasCertification === "yes",
      credentials_proof: hasCertification === "yes" ? credentialsProof.trim() : "",
      primary_expertise: primaryExpertise,
      specialties: additionalExpertise,
      languages,
      meeting_duration: meetingDuration,
      calendar_link: calendarLink.trim() || null,
      bio: bio.trim(),
      photo_url: photoUrl,
      consent_affidavit: consentAffidavit,
      consent_privacy_terms: consentPrivacyTerms,
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
        phone,
        gender,
        country,
        credentialsProof: hasCertification === "yes" ? credentialsProof : "",
        primaryExpertise,
        specialties: additionalExpertise,
        languages,
        meetingDuration,
        calendarLink: calendarLink.trim() || null,
        photoUrl,
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
          <h3 className="mb-1.5 text-xl">{content.thankYouHeading.replace("{name}", fullName || "friend")}</h3>
          <p className="text-muted-fg">{content.thankYouBody.replace("{email}", email)}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose}>
      <h3 className="mb-1 text-xl">{content.heading}</h3>
      <p className="mb-5 text-[14px] text-muted-fg">{content.intro}</p>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        {/* Section 1 — Personal Information */}
        <fieldset className="flex flex-col gap-3.5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">
            Personal Information
          </legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="volunteer-full-name">Full name</FieldLabel>
              <input
                id="volunteer-full-name"
                required
                aria-required="true"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe / ג'יין דו"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="volunteer-gender">Gender</FieldLabel>
              <select
                id="volunteer-gender"
                required
                aria-required="true"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select…
                </option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="volunteer-country">Country</FieldLabel>
              <input
                id="volunteer-country"
                required
                aria-required="true"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Israel"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="volunteer-email">Email</FieldLabel>
              <input
                id="volunteer-email"
                type="email"
                required
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              {touchedSubmit && email.trim() && !isValidEmail(email) && (
                <p className="mt-1 text-[12px] text-destructive">Enter a valid email address.</p>
              )}
            </div>
          </div>

          <PhoneNumberInput
            id="volunteer-mobile"
            value={phone}
            onChange={(e164, isValid) => {
              setPhone(e164);
              setPhoneValid(isValid);
            }}
            helpText="Required — used to follow up on your application."
          />
        </fieldset>

        {/* Section 2 — Professional Credentials */}
        <fieldset className="flex flex-col gap-3.5 border-t border-border pt-5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">
            Professional Credentials
          </legend>
          <div>
            <FieldLabel htmlFor="volunteer-has-certification">Do you have a certification?</FieldLabel>
            <select
              id="volunteer-has-certification"
              required
              aria-required="true"
              value={hasCertification}
              onChange={(e) => setHasCertification(e.target.value as "yes" | "no" | "")}
              className={inputClass}
            >
              <option value="" disabled>
                Select…
              </option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {hasCertification === "yes" && (
            <div>
              <FieldLabel htmlFor="volunteer-credentials-proof">Certification / license details</FieldLabel>
              <textarea
                id="volunteer-credentials-proof"
                required
                rows={3}
                value={credentialsProof}
                onChange={(e) => setCredentialsProof(e.target.value)}
                placeholder="Your license number, certifying body/institution, and any other credential details our team can verify."
                className={inputClass}
              />
              <p className="mt-1 text-[12px] text-muted-fg">
                Our team reviews this before you&apos;re listed as a verified volunteer.
              </p>
            </div>
          )}

          <div>
            <FieldLabel htmlFor="volunteer-primary-expertise">Primary Area of Expertise</FieldLabel>
            <select
              id="volunteer-primary-expertise"
              required
              aria-required="true"
              value={primaryExpertise}
              onChange={(e) => togglePrimary(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select…
              </option>
              {SPECIALTY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold">
              Additional Areas of Expertise <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 md:grid-cols-4">
              {SPECIALTY_OPTIONS.map((option) => (
                <label key={option} className="flex items-start gap-1.5 text-[13.5px]">
                  <input
                    type="checkbox"
                    checked={additionalExpertise.includes(option)}
                    onChange={() => toggleAdditional(option)}
                    className={`${checkboxClass} mt-0.5`}
                  />
                  {option}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] text-muted-fg">
              Pick at least one — your Primary Area of Expertise above is automatically checked here too.
            </p>
          </fieldset>
        </fieldset>

        {/* Section 3 — Availability & Scheduling */}
        <fieldset className="flex flex-col gap-3.5 border-t border-border pt-5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">
            Availability &amp; Scheduling
          </legend>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold">
              Languages Offered <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 md:grid-cols-4">
              {LANGUAGE_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-1.5 text-[13.5px]">
                  <input
                    type="checkbox"
                    checked={languages.includes(option)}
                    onChange={() => toggleLanguage(option)}
                    className={checkboxClass}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <FieldLabel htmlFor="volunteer-duration">Session/engagement duration</FieldLabel>
            <select
              id="volunteer-duration"
              required
              aria-required="true"
              value={meetingDuration}
              onChange={(e) => setMeetingDuration(e.target.value as MeetingDurationChoice)}
              className={`${inputClass} max-w-[220px]`}
            >
              <option value="" disabled>
                Select…
              </option>
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="volunteer-calendar-link" className="mb-1.5 block text-sm font-semibold">
              Personal calendar link (optional)
            </label>
            <input
              id="volunteer-calendar-link"
              type="url"
              value={calendarLink}
              onChange={(e) => setCalendarLink(e.target.value)}
              placeholder="https://calendar.google.com/…"
              className={inputClass}
            />
            <p className="mt-1 text-[12px] text-muted-fg">
              A shareable link to your own calendar, if you have one.{" "}
              <a
                href="https://support.google.com/calendar/answer/37083"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline"
              >
                How to get a shareable Google Calendar link
              </a>
              .
            </p>
          </div>
        </fieldset>

        {/* Section 4 — Profile Content */}
        <fieldset className="flex flex-col gap-3.5 border-t border-border pt-5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">Profile Content</legend>
          <div>
            <FieldLabel htmlFor="volunteer-bio">About / bio</FieldLabel>
            <textarea
              id="volunteer-bio"
              required
              aria-required="true"
              rows={6}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your background and why you'd like to volunteer with GESA. This will be shown publicly on your profile."
              className={inputClass}
            />
            <div className="mt-1 flex items-center justify-between text-[12px]">
              <span className="text-muted-fg">This text will display publicly on your profile.</span>
              <span
                className={
                  bioWordCount === 0
                    ? "text-muted-fg"
                    : bioValid
                      ? "font-medium text-primary"
                      : "font-medium text-destructive"
                }
              >
                {bioWordCount} / {BIO_MIN_WORDS}–{BIO_MAX_WORDS} words
              </span>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="volunteer-photo">Profile picture</FieldLabel>
            <div className="flex items-start gap-3">
              <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full bg-secondary">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-center text-[10.5px] text-muted-fg">No photo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  id="volunteer-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoSelected}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                  >
                    {photoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{" "}
                    {photoUploading ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
                  </Button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      aria-label="Remove photo"
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] text-destructive hover:bg-destructive/10"
                    >
                      <X size={13} /> Remove
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-muted-fg">
                  Required. At least {PHOTO_MIN_DIMENSION}×{PHOTO_MIN_DIMENSION}px, under{" "}
                  {Math.round(PHOTO_MAX_BYTES / 1024)}KB.
                </p>
                {photoError && <p className="text-[12px] text-destructive">{photoError}</p>}
              </div>
            </div>
          </div>
        </fieldset>

        {/* Section 5 — Legal Consent */}
        <fieldset className="flex flex-col gap-2.5 border-t border-border pt-5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">Legal Consent</legend>
          <label className="flex items-start gap-2 text-[13.5px]">
            <input
              type="checkbox"
              required
              aria-required="true"
              checked={consentAffidavit}
              onChange={(e) => setConsentAffidavit(e.target.checked)}
              className={`${checkboxClass} mt-0.5`}
            />
            <span>
              I confirm I have read the{" "}
              <a
                href="/affidavit"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline"
              >
                Affidavit
              </a>
              . <span className="text-destructive">*</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-[13.5px]">
            <input
              type="checkbox"
              required
              aria-required="true"
              checked={consentPrivacyTerms}
              onChange={(e) => setConsentPrivacyTerms(e.target.checked)}
              className={`${checkboxClass} mt-0.5`}
            />
            <span>
              I confirm I have read the{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline"
              >
                Terms &amp; Conditions
              </a>
              . <span className="text-destructive">*</span>
            </span>
          </label>
        </fieldset>

        {(error || (touchedSubmit && validationError)) && (
          <p className="text-sm text-destructive" role="alert">
            {error ?? validationError}
          </p>
        )}

        <Button type="submit" block disabled={pending || !canSubmit}>
          {pending ? content.submittingLabel : content.submitLabel}
        </Button>
      </form>
    </Modal>
  );
}

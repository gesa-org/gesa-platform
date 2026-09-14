"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HeartHandshake, Upload, X, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import MultiSelectCombobox from "@/components/ui/MultiSelectCombobox";
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

// Phase 63 — curated quick-picks for specialties/languages; single master
// list reused for both the "Primary Area of Expertise" (single select) and
// "Additional Areas of Expertise" (multi-select combobox) fields per Roy's
// explicit instruction to reuse one list rather than introduce a second.
// Phase 195 — replaced the original 10-item quick-pick subset with Roy's
// full 30-option "maintain these options" list for the Additional Areas of
// Expertise combobox, and reused it for Primary Area of Expertise too
// (rather than leaving Primary on the old short list) so every value a
// therapist can pick as their primary is guaranteed to exist, verbatim, in
// the Additional Expertise list it gets auto-added to — a mismatch here
// (the old list spelled one option "Mindful Self Compassion", Roy's new
// list spells it "Mindful Self-Compassion") would have made the auto-add
// silently produce an option that didn't match anything in the new list.
const EXPERTISE_OPTIONS = [
  "Art Therapy",
  "Breathing Exercises",
  "CBT",
  "Children and Adolescents",
  "Coach (Life Coach)",
  "Counseling",
  "EMDR",
  "Emotional Support",
  "Emotional Support for Couples",
  "Family Support",
  "Group Sessions",
  "Guided Meditation",
  "Helping The Helper",
  "Herbal Medicine",
  "Homeopathy",
  "Medical Hypnosis",
  "Mindful Self-Compassion",
  "NLP",
  "Pilates",
  "Psychiatry",
  "Psychoanalysis / Psychoanalyst",
  "Psychology",
  "Psychotherapy",
  "Reiki",
  "Social Work",
  "Supervision",
  "Support for Pregnant Women and Infants",
  "ThetaHealing",
  "Trauma Support",
  "Tree of Life Medicine",
  "Yoga",
];

// Phase 195 — Roy's full 23-option "maintain these options" list for
// Possible Therapy Languages, replacing the old 10-item quick-pick subset.
const LANGUAGE_OPTIONS = [
  "Arabic",
  "Bulgarian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Filipino (Tagalog)",
  "French",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Italian",
  "Latvian",
  "Nigerian",
  "Norwegian",
  "Portuguese",
  "Romanian",
  "Russian",
  "Slovak",
  "Spanish",
  "Swedish",
];

// Phase 195 — labels for the "Other" rows in each combobox. Kept as named
// constants (not inline strings) since the submit handler and the
// sessionStorage draft-restore logic below both need to recognize these
// exact values too.
const OTHER_EXPERTISE_LABEL = "Other";
const OTHER_LANGUAGE_LABEL = "Other language";

// Phase 195 — sessionStorage key for "preserve selections if the modal is
// closed accidentally and reopened in the same session." VolunteerApplyButton
// fully unmounts this modal on close (`{open && <VolunteerApplicationModal />}`),
// so any of this component's own useState is normally lost; this persists
// only the two new required multi-select fields (values + their "Other" text)
// Roy asked to be preserved, not the whole form — sessionStorage (not
// localStorage) matches "during the same session" exactly, and is cleared
// once the application actually submits so a later, fresh application
// doesn't silently inherit stale picks.
const DRAFT_STORAGE_KEY = "gesa-volunteer-application-draft-v1";

type MultiSelectDraft = {
  additionalExpertise: string[];
  otherExpertise: string;
  languages: string[];
  otherLanguage: string;
};

function readDraft(): MultiSelectDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      additionalExpertise: Array.isArray(parsed.additionalExpertise) ? parsed.additionalExpertise : [],
      otherExpertise: typeof parsed.otherExpertise === "string" ? parsed.otherExpertise : "",
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      otherLanguage: typeof parsed.otherLanguage === "string" ? parsed.otherLanguage : "",
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: MultiSelectDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Best-effort only — private browsing etc. can throw; losing the draft
    // cache is not worth failing the form over.
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

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

  // Professional Details — Phase 195's two required multi-select combobox
  // fields (moved to sit immediately after Primary Area of Expertise, per
  // Roy's spec; Languages used to live down in Availability & Scheduling as
  // a checkbox grid). `additional_expertise[]`/`therapy_languages[]` and
  // `other_expertise`/`other_therapy_language` are these fields' logical
  // submission keys — see the Phase 195 EXECUTION_PLAN.md entry for exactly
  // how they map onto the existing `specialties`/`languages` DB columns.
  const [additionalExpertise, setAdditionalExpertise] = useState<string[]>([]);
  const [otherExpertise, setOtherExpertise] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLanguage, setOtherLanguage] = useState("");

  // Phase 195 — hydrate any draft saved from an accidentally-closed modal
  // earlier in this browser session (see readDraft/writeDraft/clearDraft
  // above). Runs once on mount only.
  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    if (draft.additionalExpertise.length) setAdditionalExpertise(draft.additionalExpertise);
    if (draft.otherExpertise) setOtherExpertise(draft.otherExpertise);
    if (draft.languages.length) setLanguages(draft.languages);
    if (draft.otherLanguage) setOtherLanguage(draft.otherLanguage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 195 — persist on every change so closing the modal (which fully
  // unmounts it — see VolunteerApplyButton.tsx) doesn't lose these two
  // fields' selections within the same session.
  useEffect(() => {
    writeDraft({ additionalExpertise, otherExpertise, languages, otherLanguage });
  }, [additionalExpertise, otherExpertise, languages, otherLanguage]);

  // Section 3 — Availability & Scheduling
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
    // Spec: preselect/auto-add the Primary Area of Expertise value into
    // Additional Areas of Expertise, since the form asks for it there again
    // — auto-included rather than making the applicant pick it twice; they
    // can still add more on top of it (or, per Phase 195, remove it again,
    // which re-triggers the validation rule below asking them to re-add it).
    setAdditionalExpertise((prev) => (prev.includes(value) ? prev : [...prev, value]));
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
      return "Your primary area of expertise should also be included in Additional Areas of Expertise.";
    if (additionalExpertise.includes(OTHER_EXPERTISE_LABEL) && !otherExpertise.trim())
      return "Please specify your other area of expertise.";
    if (languages.length === 0) return "Please select at least one therapy language.";
    if (languages.includes(OTHER_LANGUAGE_LABEL) && !otherLanguage.trim())
      return "Please specify the other language.";
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
    otherExpertise,
    languages,
    otherLanguage,
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

    // Phase 195 — the `specialties`/`languages` DB columns and the email
    // template both already just store/join whatever strings this array
    // contains (see lib/email/templates.ts, VolunteerApplicationsTable.tsx —
    // neither needed to change). So rather than add new DB columns for the
    // "Other" free-text fields, the bare "Other"/"Other language" placeholder
    // is replaced with a self-describing "Other: <what they typed>" entry
    // right here, before either submission — the admin view and email both
    // read it as plain, readable text, and there's no separate DB migration
    // for two optional text fields.
    const finalExpertise = additionalExpertise.map((option) =>
      option === OTHER_EXPERTISE_LABEL && otherExpertise.trim() ? `Other: ${otherExpertise.trim()}` : option
    );
    const finalLanguages = languages.map((option) =>
      option === OTHER_LANGUAGE_LABEL && otherLanguage.trim() ? `Other: ${otherLanguage.trim()}` : option
    );

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
      specialties: finalExpertise,
      languages: finalLanguages,
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
    clearDraft();
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
        specialties: finalExpertise,
        languages: finalLanguages,
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
              {EXPERTISE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Professional Details — Phase 195. Placed immediately after
            Primary Area of Expertise per Roy's spec: both required
            multi-select fields get their own short heading here instead of
            being buried as long checkbox grids further down the form (the
            old "Languages Offered" checkbox grid used to live in Section 3,
            Availability & Scheduling — moved up to sit beside Additional
            Areas of Expertise instead, since both are the same kind of
            field and Roy asked for them grouped together right after
            Primary Area of Expertise). */}
        <fieldset className="flex flex-col gap-4 border-t border-border pt-5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">
            Professional Details
          </legend>

          <MultiSelectCombobox
            id="volunteer-additional-expertise"
            label="Additional Areas of Expertise"
            required
            helperText="Select all relevant areas, including your primary area of expertise."
            placeholder="Search areas of expertise…"
            options={EXPERTISE_OPTIONS}
            value={additionalExpertise}
            onChange={setAdditionalExpertise}
            otherOptionLabel={OTHER_EXPERTISE_LABEL}
            otherFieldLabel="Please specify other expertise."
            otherFieldPlaceholder="e.g. Equine-assisted therapy"
            otherValue={otherExpertise}
            onOtherValueChange={setOtherExpertise}
            error={touchedSubmit ? (validationError?.toLowerCase().includes("expertise") ? validationError : null) : null}
          />

          <MultiSelectCombobox
            id="volunteer-therapy-languages"
            label="Possible Therapy Languages"
            required
            helperText="Select every language in which you can confidently provide therapy."
            placeholder="Search languages…"
            options={LANGUAGE_OPTIONS}
            value={languages}
            onChange={setLanguages}
            otherOptionLabel={OTHER_LANGUAGE_LABEL}
            otherFieldLabel="Please specify language."
            otherFieldPlaceholder="e.g. Amharic"
            otherValue={otherLanguage}
            onOtherValueChange={setOtherLanguage}
            error={
              touchedSubmit
                ? validationError?.toLowerCase().includes("language")
                  ? validationError
                  : null
                : null
            }
          />
        </fieldset>

        {/* Section 3 — Availability & Scheduling */}
        <fieldset className="flex flex-col gap-3.5 border-t border-border pt-5">
          <legend className="mb-1 text-[13px] font-bold uppercase tracking-wide text-muted-fg">
            Availability &amp; Scheduling
          </legend>

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

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, Globe2, GraduationCap, ArrowLeft, MapPin, HeartHandshake } from "lucide-react";
import { getTherapistBySlug } from "@/lib/queries";
import MessageTherapistButton from "@/components/chat/MessageTherapistButton";
import BookSessionButton from "@/components/therapists/BookSessionButton";

export const revalidate = 60;

const GENDER_LABEL: Record<string, string> = {
  woman: "Female",
  man: "Male",
  nonbinary: "Non-binary",
  no_preference: "Prefer not to say",
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const therapist = await getTherapistBySlug(params.slug);
  if (!therapist) return { title: "Therapist — GESA" };
  return {
    title: `${therapist.full_name} — GESA`,
    description: therapist.short_summary || `Meet ${therapist.full_name}, a verified volunteer therapist with GESA.`,
  };
}

export default async function TherapistProfilePage({ params }: { params: { slug: string } }) {
  const therapist = await getTherapistBySlug(params.slug);
  if (!therapist) notFound();

  const initials = therapist.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <section className="section wrap max-w-[880px]">
      <Link href="/therapists" className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary">
        <ArrowLeft size={15} /> Back to all therapists
      </Link>

      <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary to-accent shadow-soft">
          {therapist.photo_url ? (
            <Image
              src={therapist.photo_url}
              alt={therapist.full_name}
              fill
              className="object-cover object-[center_22%]"
              sizes="220px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-[44px] font-semibold text-white">
              {initials}
            </div>
          )}
          {therapist.is_verified && (
            <span className="absolute right-2.5 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e3e8ef]/90 text-primary shadow-soft">
              <BadgeCheck size={17} />
            </span>
          )}
        </div>

        <div>
          <h1 className="text-[30px]">{therapist.full_name}</h1>
          {therapist.credentials && <div className="mt-1 text-[15px] font-medium text-primary">{therapist.credentials}</div>}
          {therapist.short_summary && <p className="mt-2 text-[15.5px] text-muted-fg">{therapist.short_summary}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {therapist.specialties.map((s) => (
              <span key={s} className="rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-medium text-primary">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-[13.5px] text-muted-fg sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Globe2 size={16} className="text-primary" />
              {therapist.languages.join(", ") || "—"}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              {therapist.session_lengths.map((d) => `${d}m`).join(", ") || "—"}
            </div>
            {therapist.years_experience != null && (
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-primary" />
                {therapist.years_experience} years experience
              </div>
            )}
            {therapist.gender && (
              <div className="flex items-center gap-2">{GENDER_LABEL[therapist.gender] ?? therapist.gender}</div>
            )}
            {/* Phase 126 — country and fee/price note are new, non-
                confidential fields from the source data; shown here using
                the same icon-plus-text pattern as the fields above, and
                simply omitted (not shown blank) when a record doesn't have
                one yet. */}
            {therapist.country && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                {therapist.country}
              </div>
            )}
            {therapist.price_note && (
              <div className="flex items-center gap-2">
                <HeartHandshake size={16} className="text-primary" />
                {therapist.price_note}
              </div>
            )}
          </div>

          {/* Phase 126 — was a plain <Link href="/intake">, which sent
              every profile-page visitor into the generic intake flow
              regardless of which therapist's page they were on. Swapped for
              the same BookSessionButton the directory card uses, so this
              page's booking action is this specific therapist's actual
              diary-link-or-native flow, not a disconnected generic one —
              matching Roy's "directory cards and individual profile pages
              show consistent information" instruction. */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="w-[220px]">
              <BookSessionButton therapist={therapist} />
            </div>
            <div className="w-[160px]">
              <MessageTherapistButton therapistId={therapist.id} />
            </div>
          </div>
        </div>
      </div>

      {therapist.bio && (
        <div className="mt-10 border-t border-border pt-8">
          <h2 className="mb-3 text-[22px]">About {therapist.full_name.split(" ")[0]}</h2>
          <p className="whitespace-pre-line text-[15.5px] leading-[1.7] text-muted-fg">{therapist.bio}</p>
        </div>
      )}
    </section>
  );
}

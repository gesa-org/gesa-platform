import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Tables } from "@/lib/database.types";
import MessageTherapistButton from "@/components/chat/MessageTherapistButton";

export default function TherapistCard({ t }: { t: Tables<"therapists"> }) {
  const initials = t.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent">
      <Link href={`/therapists/${t.slug}`} className="contents">
        <div className="relative aspect-square w-full flex-none overflow-hidden bg-gradient-to-br from-primary to-accent">
          {t.photo_url ? (
            <Image
              src={t.photo_url}
              alt={t.full_name}
              fill
              className="object-cover object-[center_22%]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-[52px] font-semibold text-white">
              {initials}
            </div>
          )}
          {t.is_verified && (
            <span className="absolute right-2.5 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/90 text-primary shadow-soft">
              <BadgeCheck size={17} />
            </span>
          )}
        </div>
        <div className="flex-1 px-[18px] pb-1 pt-4">
          <h3 className="text-base font-semibold">{t.full_name}</h3>
          <div className="mb-2 text-[13px] font-medium text-primary">{t.specialties?.[0] ?? ""}</div>
          <p className="mb-3 line-clamp-2 text-[13.5px] text-muted-fg">{t.short_summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {t.languages.map((l) => (
              <span
                key={l}
                className="rounded-full border border-border bg-white px-2.5 py-1 text-[11.5px] font-medium text-muted-fg"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="px-[18px] pb-3 pt-2">
        <MessageTherapistButton therapistId={t.id} />
      </div>
    </div>
  );
}

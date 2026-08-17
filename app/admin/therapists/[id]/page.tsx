import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTherapistByIdAdmin } from "@/lib/queries";
import TherapistEditForm from "@/components/admin/TherapistEditForm";

export const dynamic = "force-dynamic";

export default async function AdminTherapistEditPage({ params }: { params: { id: string } }) {
  const therapist = await getTherapistByIdAdmin(params.id);
  if (!therapist) notFound();

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <Link href="/admin/therapists" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        <ArrowLeft size={14} /> All therapists
      </Link>
      <h2 className="mb-5 text-lg">Edit {therapist.full_name}</h2>
      <TherapistEditForm therapist={therapist} />
    </div>
  );
}

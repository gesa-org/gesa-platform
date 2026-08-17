import Image from "next/image";
import Link from "next/link";
import { getAllTherapistsAdmin } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsPage() {
  const therapists = await getAllTherapistsAdmin();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Therapists ({therapists.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Edit photos, bios, and languages, or deactivate a therapist to remove them from the public directory.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-5 py-3">Photo</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Languages</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {therapists.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-5 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
                    {t.photo_url && (
                      <Image src={t.photo_url} alt={t.full_name} fill className="object-cover object-[center_22%]" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 font-medium">{t.full_name}</td>
                <td className="px-5 py-3 text-muted-fg">{t.languages.join(", ") || "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                      t.is_active ? "bg-accent-soft text-primary" : "bg-secondary text-muted-fg"
                    }`}
                  >
                    {t.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/therapists/${t.id}`} className="font-semibold text-primary underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

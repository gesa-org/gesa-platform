import { getAllInquiries } from "@/lib/queries";
import InquiriesTable from "@/components/admin/InquiriesTable";

export const dynamic = "force-dynamic";

// Phase 150 — CRM inquiry-architecture cleanup. This is the single,
// authoritative admin location for general client inquiries (route
// unchanged: /admin/inquiries; sidebar label unchanged: "Inquiries"). Both
// live public forms that create rows here — the Contact page's ContactForm
// and the footer's HelpUsGrowForm — already fed this same `inquiries` table
// before this phase; there was no second, duplicate inquiry form to remove.
// What this phase actually added: a real status workflow, internal admin
// notes, search/filter/sort, a detail view, and a server-authorized Delete
// action — none of which existed before (see InquiriesTable.tsx).
export default async function AdminInquiriesPage() {
  const inquiries = await getAllInquiries();
  return <InquiriesTable initialInquiries={inquiries} />;
}

import Link from "next/link";
import Card from "@/components/ui/Card";
import {
  getAllBookingRequests,
  getAllGroupRegistrations,
  getAllInquiries,
  getAllProfiles,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [inquiries, bookings, registrations, profiles] = await Promise.all([
    getAllInquiries(),
    getAllBookingRequests(),
    getAllGroupRegistrations(),
    getAllProfiles(),
  ]);

  const newBookings = bookings.filter((b) => b.status === "new").length;
  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});

  const tiles = [
    { label: "Contact inquiries", value: inquiries.length, href: "/admin/inquiries" },
    { label: "Booking requests", value: bookings.length, sub: `${newBookings} new`, href: "/admin/bookings" },
    { label: "Group registrations", value: registrations.length, href: "/admin/registrations" },
    { label: "Registered users", value: profiles.length, href: "/admin/users" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className="p-5">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-muted-fg">{t.label}</div>
              <div className="mt-1.5 text-[32px] font-serif font-semibold text-primary">{t.value}</div>
              {t.sub && <div className="mt-0.5 text-[13px] text-clay">{t.sub}</div>}
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6" padded={false}>
        <div className="p-6">
          <h2 className="mb-3 text-lg">Users by role</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span
                key={role}
                className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-medium text-muted-fg"
              >
                {role}: <strong className="text-primary">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

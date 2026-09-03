"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string };

// Phase 60 — split out of app/admin/layout.tsx (which is a Server Component,
// so it can't call usePathname itself) so the active section can be
// highlighted the way Roy's reference CRM mockup shows "Overview"
// highlighted while it's the current page. `/admin` itself needs an exact
// match (otherwise it would also light up for every other /admin/* route,
// since it's a prefix of all of them); every other item is a normal
// prefix match so e.g. /admin/therapists/[id] still highlights the
// sidebar's "Our Professionals" item (renamed from "Therapists" Phase 125 —
// the href/route itself is unchanged).
export default function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-[var(--radius)] border border-white/40 bg-clay-soft/80 p-3 shadow-soft backdrop-blur-sm lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors lg:whitespace-normal ${
              isActive
                ? "bg-card text-primary shadow-soft"
                : "text-primary/80 hover:bg-card/60 hover:text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

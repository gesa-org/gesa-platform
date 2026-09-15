"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type TherapistNavItem = { href: string; label: string; icon?: LucideIcon };

// Phase 208 — mirrors components/admin/AdminNav.tsx's shape (a therapist's
// dashboard grows from a single page to this same "sticky sidebar + active
// highlight" pattern used by /admin, rather than inventing a second nav
// style). `/therapist` needs an exact match (it's a prefix of every other
// item's href), every other item is a prefix match so a future sub-route
// (e.g. /therapist/bookings/[id]) still highlights the right sidebar entry.
export default function TherapistNav({ items }: { items: TherapistNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-[var(--radius)] border border-border bg-card p-3 shadow-soft lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const isActive = item.href === "/therapist" ? pathname === "/therapist" : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors lg:whitespace-normal ${
              isActive ? "bg-accent-soft text-primary" : "text-foreground hover:bg-secondary"
            }`}
          >
            {Icon && <Icon size={16} className="flex-none" aria-hidden="true" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

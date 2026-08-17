"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Top-nav bell for admins only. Self-gates: checks the signed-in user's own
// profile role client-side (same RLS-backed pattern as AuthStatus) rather
// than requiring Header to become an async server component. Renders
// nothing for signed-out users or any role other than "admin" — matching
// the "strictly restricted to the Administrator role" requirement.
export default function NotificationBell() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (cancelled || profile?.role !== "admin") return;
      setIsAdmin(true);

      const { count: newCount } = await supabase
        .from("booking_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (!cancelled) setCount(newCount ?? 0);
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/bookings"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-secondary"
      title={count > 0 ? `${count} new booking request${count === 1 ? "" : "s"}` : "No new booking requests"}
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10.5px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

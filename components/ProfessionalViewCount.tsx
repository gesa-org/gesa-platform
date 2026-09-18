"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

type OwnedProfileViews = { therapistId: string; profileViews: number } | null;

export function ProfessionalViewCount({ therapistId }: { therapistId: string }) {
  const [ownedViews, setOwnedViews] = useState<OwnedProfileViews>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/analytics/my-profile-views", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { therapistId?: string; profileViews?: number } | null) => {
        if (!cancelled && data?.therapistId === therapistId && typeof data.profileViews === "number") {
          setOwnedViews({ therapistId: data.therapistId, profileViews: data.profileViews });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [therapistId]);

  if (!ownedViews) return null;

  return (
    <div className="flex items-center gap-1 text-[12px] text-muted-fg" aria-label={`${ownedViews.profileViews.toLocaleString()} profile views`}>
      <Eye size={12} aria-hidden="true" />
      <span>{ownedViews.profileViews.toLocaleString()}</span>
    </div>
  );
}

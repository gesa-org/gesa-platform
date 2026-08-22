"use client";

import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import { FORMAT_OPTIONS } from "@/components/match/constants";
import type { SessionFormat, Tables } from "@/lib/database.types";

export default function StepFormatLocation({
  sessionFormat,
  clinicLocationId,
  clinicLocations,
  onFormatChange,
  onClinicLocationChange,
  onBack,
  onNext,
}: {
  sessionFormat: SessionFormat | null;
  clinicLocationId: string | null;
  clinicLocations: Tables<"clinic_locations">[];
  onFormatChange: (value: SessionFormat) => void;
  onClinicLocationChange: (value: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1.5 text-[22px]">How would you like to meet?</h2>
      <p className="mb-6 text-muted-fg">Choose the format that works best for you.</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {FORMAT_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFormatChange(f.value)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              sessionFormat === f.value
                ? "border-primary bg-accent-soft"
                : "border-border bg-card hover:border-primary-600"
            }`}
          >
            <div className="text-[15px] font-semibold text-foreground">{f.label}</div>
            <div className="mt-0.5 text-[13px] text-muted-fg">{f.description}</div>
          </button>
        ))}
      </div>

      {sessionFormat === "in_person" && (
        <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <MapPin size={15} /> Clinic location
          </label>
          {clinicLocations.length > 0 ? (
            <select
              value={clinicLocationId ?? ""}
              onChange={(e) => onClinicLocationChange(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
            >
              <option value="">Select a location…</option>
              {clinicLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} — {loc.address}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-[13.5px] text-muted-fg">
              We don&apos;t have a clinic location listed yet — our team will reach out to arrange a convenient
              place to meet.
            </p>
          )}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={onNext} disabled={!sessionFormat}>
          See my matches <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

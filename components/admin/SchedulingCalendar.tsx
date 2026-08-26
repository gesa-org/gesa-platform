"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { EVENT_LEGEND, KIND_LABELS, type CalendarEvent } from "@/lib/adminSchedule";

// Phase 63 — Roy asked for the Scheduling Overview calendar to work like
// Google Calendar: click a day, see everything logged that date (time,
// type, status, who) in a bigger view, rather than only a hover tooltip
// on a tiny grid cell. This owns that "which day is open" click state —
// app/admin/page.tsx stays a Server Component and just hands this plain,
// pre-computed, JSON-serializable data (events grouped by date, calendar
// cells as {dayNumber, iso} rather than Date objects) to render.
function formatDayHeading(iso: string) {
  // "2026-08-24" -> parsed as local time (not UTC) so the heading always
  // matches the day the cell was actually clicked, regardless of timezone.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function SchedulingCalendar({
  monthLabel,
  todayIso,
  thisMonthEventCount,
  calendarCells,
  eventsByDate,
}: {
  monthLabel: string;
  todayIso: string;
  thisMonthEventCount: number;
  calendarCells: { dayNumber: number | null; iso: string | null }[];
  eventsByDate: Record<string, CalendarEvent[]>;
}) {
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const selectedEvents = selectedIso
    ? [...(eventsByDate[selectedIso] ?? [])].sort((a, b) => {
        // Timed events first (chronologically), then untimed ones — matches
        // how Google Calendar's day view separates the "all day"/no-time
        // items from ones with an actual scheduled time.
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      })
    : [];

  return (
    <div className="rounded-[var(--radius)] border border-white/50 bg-card p-5 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base text-primary">Scheduling Overview</h2>
        <span className="text-[12px] text-muted-fg">{monthLabel}</span>
      </div>
      <div className="mb-2.5">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-fg">Logged this month</div>
        <div className="mt-0.5 text-[22px] font-serif font-semibold text-primary">{thisMonthEventCount}</div>
      </div>
      <div className="mb-2 flex flex-wrap gap-x-2.5 gap-y-1">
        {EVENT_LEGEND.map((l) => (
          <span key={l.kind} className="flex items-center gap-1 text-[10px] text-muted-fg">
            <span className={`h-1.5 w-1.5 rounded-full ${l.dotClass}`} />
            {l.label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase text-muted-fg">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {calendarCells.map((cell, i) => {
          const dayEvents = cell.iso ? eventsByDate[cell.iso] ?? [] : [];
          const presentKinds = EVENT_LEGEND.filter((l) => dayEvents.some((e) => e.kind === l.kind));
          const isToday = cell.iso === todayIso;

          if (!cell.dayNumber || !cell.iso) {
            return <div key={i} className="min-h-[30px]" />;
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIso(cell.iso)}
              title={dayEvents.length ? `${dayEvents.length} logged — click for details` : "Click for details"}
              className={`flex min-h-[30px] flex-col items-center justify-center gap-0.5 rounded p-0.5 text-[10px] transition-colors hover:bg-clay-soft focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                isToday ? "bg-clay-soft" : "bg-secondary/40"
              }`}
            >
              <span className={isToday ? "font-bold text-primary" : "text-muted-fg"}>{cell.dayNumber}</span>
              {presentKinds.length > 0 && (
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {presentKinds.map((k) => (
                    <span key={k.kind} className={`h-1.5 w-1.5 rounded-full ${k.dotClass}`} />
                  ))}
                  {dayEvents.length > 1 && <span className="text-[9px] text-clay">{dayEvents.length}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Phase 63 — the "bigger, click-to-expand" day view. Reuses the
          site's one shared Modal component (same one every booking/intake
          flow uses) rather than a bespoke popover, so it gets the same
          escape-key/backdrop-click/portal behavior for free. */}
      {selectedIso && (
        <Modal open onClose={() => setSelectedIso(null)}>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <CalendarDays size={18} />
            <h3 className="text-lg">{formatDayHeading(selectedIso)}</h3>
          </div>
          <p className="mb-4 text-[13px] text-muted-fg">
            {selectedEvents.length} logged {selectedEvents.length === 1 ? "item" : "items"} this day.
          </p>

          {selectedEvents.length === 0 ? (
            <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-fg">
              Nothing logged this day.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {selectedEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3.5">
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${e.dotClass}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[14px] font-semibold text-primary">{KIND_LABELS[e.kind]}</span>
                      {e.time && (
                        <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[11.5px] font-semibold text-clay">
                          {formatTime12h(e.time)}
                        </span>
                      )}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-fg">
                        {e.statusLabel}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[13px] text-muted-fg">{e.personLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

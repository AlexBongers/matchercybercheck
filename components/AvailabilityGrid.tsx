"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface AvailabilityGridProps {
  existingSlots: Slot[];
  onToggle: (startTime: string, endTime: string, existingId?: string) => Promise<void>;
  readOnly?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0–23
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = week start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function AvailabilityGrid({ existingSlots, onToggle, readOnly = false }: AvailabilityGridProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState<string | null>(null);

  const slotMap = new Map<string, Slot>();
  for (const slot of existingSlots) {
    const key = new Date(slot.start_time).toISOString();
    slotMap.set(key, slot);
  }

  const weekDays = DAYS.map((_, i) => addDays(weekStart, i));

  const handleCellClick = async (day: Date, hour: number) => {
    if (readOnly) return;
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(45);

    const key = start.toISOString();
    const existing = slotMap.get(key);
    if (existing?.is_booked) return; // can't remove booked slots

    setLoading(key);
    try {
      await onToggle(start.toISOString(), end.toISOString(), existing?.id);
    } finally {
      setLoading(null);
    }
  };

  const isSelected = (day: Date, hour: number): boolean => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    return slotMap.has(start.toISOString());
  };

  const isBooked = (day: Date, hour: number): boolean => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    return slotMap.get(start.toISOString())?.is_booked ?? false;
  };

  const isLoadingCell = (day: Date, hour: number): boolean => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    return loading === start.toISOString();
  };

  const weekLabel = `${weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setWeekStart(w => addDays(w, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[180px] text-center">{weekLabel}</span>
        <Button variant="outline" size="icon" onClick={() => setWeekStart(w => addDays(w, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-12 text-left text-muted-foreground font-normal px-1 py-1"></th>
              {weekDays.map((day, i) => (
                <th key={i} className="text-center font-medium px-1 py-1">
                  <div>{DAYS[i]}</div>
                  <div className="text-muted-foreground font-normal">{day.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="border-t border-gray-100">
                <td className="text-muted-foreground px-1 py-0.5 text-right pr-2 align-top">
                  {String(hour).padStart(2, "0")}:00
                </td>
                {weekDays.map((day, di) => {
                  const selected = isSelected(day, hour);
                  const booked = isBooked(day, hour);
                  const spinning = isLoadingCell(day, hour);
                  return (
                    <td
                      key={di}
                      onClick={() => handleCellClick(day, hour)}
                      className={cn(
                        "border border-gray-100 h-7 cursor-pointer transition-colors",
                        booked && "bg-emerald-200 cursor-not-allowed",
                        !booked && selected && "bg-indigo-200 hover:bg-indigo-300",
                        !booked && !selected && !readOnly && "hover:bg-indigo-50",
                        readOnly && "cursor-default",
                        spinning && "opacity-50"
                      )}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-indigo-200 border border-indigo-300" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-emerald-200 border border-emerald-300" />
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-100 border" />
          Not available
        </span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ClassItem } from "./page";

export function DayTabs({ days, initial, classes }: {
  days: { day: number; label: string; count: number }[];
  initial: number;
  classes: Record<number, ClassItem[]>;
}) {
  const [day, setDay] = useState(initial);
  const list = classes[day] ?? [];
  return (
    <>
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d.day}
            onClick={() => setDay(d.day)}
            className={cn(
              "min-w-14 flex-1 border px-2 py-2 text-[13px]",
              day === d.day ? "border-ink bg-ink font-medium text-white" : "border-line bg-paper text-muted"
            )}
          >
            {d.label}
            <span className="ml-1 text-[11px] opacity-70">{d.count}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="border border-dashed border-line bg-paper px-6 py-10 text-center text-[13px] text-muted">
          No classes — free day.
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line bg-paper">
          {list.map((c) => (
            <li key={c.code + c.start} className="flex items-center justify-between gap-3 border-l-2 border-indigo-deep px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs text-muted">{c.start}–{c.end}</div>
                <div className="text-sm font-semibold text-ink">{c.code}{c.title ? ` — ${c.title}` : ""}</div>
                <div className="text-[13px] text-muted">{c.lecturer} · <strong className="text-ink">{c.room}</strong></div>
              </div>
              <StatusBadge tone={c.tag === "Elective" ? "accent" : "neutral"}>{c.tag}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

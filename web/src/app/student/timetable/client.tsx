"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, CalendarDays, DoorOpen, MoreHorizontal, Menu, Bell } from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/cn";

export interface ClassItem {
  day: number;
  start: string;
  end: string;
  code: string;
  title: string;
  room: string;
  lecturer: string;
  tag: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export function StudentTimetableClient({ classes }: { classes: ClassItem[] }) {
  const [day, setDay] = useState<string>(DAYS[0]);
  const dayNum: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  const list = classes.filter((c) => c.day === dayNum[day]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-page md:max-w-none md:bg-page">
      {/* mobile top bar */}
      <header className="flex items-center gap-3 border-b border-cardline bg-card px-4 py-3 md:hidden">
        <button aria-label="Menu" className="text-heading"><Menu size={20} /></button>
        <span className="scale-90"><Logo /></span>
        <Bell size={18} aria-label="Notifications" className="ml-auto text-body" />
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white">A</span>
      </header>

      <div className="flex-1 px-4 py-4 md:mx-auto md:w-full md:max-w-4xl md:px-8">
        <h1 className="text-xl font-bold text-heading">My Timetable</h1>

        {/* day tabs */}
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Days">
          {DAYS.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={day === d}
              onClick={() => setDay(d)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-[13px]",
                day === d ? "bg-primary font-semibold text-white" : "bg-card font-normal text-body border border-cardline"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        {/* desktop week strip */}
        <div className="mt-4 hidden gap-2 md:grid md:grid-cols-5">
          {DAYS.map((d) => {
            const items = classes.filter((c) => c.day === dayNum[d]);
            return (
              <button key={d} onClick={() => setDay(d)} className={cn("rounded-xl border p-3 text-left", day === d ? "border-primary" : "border-cardline bg-card")}>
                <span className="text-xs font-semibold text-heading">{d}</span>
                <span className="mt-2 block space-y-1.5">
                  {items.length === 0 && <span className="block text-xs text-muted">–</span>}
                  {items.slice(0, 3).map((c) => (
                    <span key={c.code + c.start} className="block truncate rounded-md bg-ok-bg px-1.5 py-1 text-[11px] font-semibold text-ok-text">{c.code}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 space-y-2.5 md:mt-4">
          {list.length === 0 && (
            <li className="rounded-xl border border-dashed border-cardline bg-card p-6 text-center text-[13px] text-muted">
              No classes — free day.
            </li>
          )}
          {list.map((c) => {
            const clash = /elect/i.test(c.title) || /elect/i.test(c.tag);
            return (
              <li
                key={c.code + c.start}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-4",
                  clash ? "border-warn-text/25 bg-warn-bg" : "border-ok-text/20 bg-ok-bg"
                )}
              >
                <div>
                  <p className="text-[12px] text-body">{c.start} – {c.end}</p>
                  <p className="mt-0.5 text-[15px] font-bold text-heading">{c.code} – {c.title}</p>
                  <p className="mt-0.5 text-[13px] text-body">{c.room}</p>
                </div>
                <span className={cn("h-5 w-5 rounded-full border-4",
                  clash ? "border-warn-text/40 bg-warn-bg" : "border-ok-text/40 bg-ok-bg")} aria-hidden />
              </li>
            );
          })}
        </ul>
      </div>

      {/* fixed mobile bottom tab bar */}
      <nav aria-label="Mobile" className="sticky bottom-0 flex border-t border-cardline bg-card md:hidden">
        {[
          { label: "Home", icon: Home, href: "/student", on: false },
          { label: "Timetable", icon: CalendarDays, href: "/student/timetable", on: true },
          { label: "Rooms", icon: DoorOpen, href: "/student/rooms", on: false },
          { label: "More", icon: MoreHorizontal, href: "/student/settings", on: false },
        ].map((n) => (
          <Link key={n.label} href={n.href}
            className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]", n.on ? "font-semibold text-primary" : "text-muted")}>
            <n.icon size={20} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

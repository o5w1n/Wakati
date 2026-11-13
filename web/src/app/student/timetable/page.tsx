"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { Download } from "lucide-react";
import { cn } from "@/lib/cn";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEK: Record<string, { t: string; code: string; title: string; room: string; lecturer: string; tag: string }[]> = {
  Mon: [{ t: "08:00–10:10", code: "CS302", title: "Algorithms", room: "L-1", lecturer: "Dr. Mensah", tag: "Core" }],
  Tue: [
    { t: "10:20–12:30", code: "CS4135", title: "Computer Security", room: "L-3", lecturer: "Prof. Yamak", tag: "Core" },
    { t: "12:40–13:40", code: "ML401", title: "Machine Learning", room: "Lab-B", lecturer: "Ms. Adjunct", tag: "Elective" },
  ],
  Wed: [{ t: "13:50–15:50", code: "CS4135", title: "Computer Security (Practical)", room: "Lab-A", lecturer: "Prof. Yamak", tag: "Practical" }],
  Thu: [{ t: "15:00–16:00", code: "CW400", title: "Career Workshop", room: "L-1", lecturer: "Dr. Mensah", tag: "Core" }],
  Fri: [],
};

export default function StudentTimetable() {
  const [day, setDay] = useState("Tue");
  const classes = WEEK[day];
  return (
    <Shell role="student" active="/student/timetable">
      <PageHeader
        title="My Timetable"
        sub="BSc CS 400 · core + your electives only"
        actions={<button className={btnSecondaryCls}><Download size={15} /> PDF / Excel</button>}
      />
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={cn(
              "min-w-14 flex-1 border px-2 py-2 text-[13px]",
              day === d ? "border-ink bg-ink font-medium text-white" : "border-line bg-paper text-muted"
            )}
          >
            {d}
            <span className="ml-1 text-[11px] opacity-70">{WEEK[d].length}</span>
          </button>
        ))}
      </div>
      {classes.length === 0 ? (
        <div className="border border-dashed border-line bg-paper px-6 py-10 text-center text-[13px] text-muted">
          No classes on {day === "Mon" ? "Monday" : day === "Tue" ? "Tuesday" : day === "Wed" ? "Wednesday" : day === "Thu" ? "Thursday" : "Friday"} — free day.
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line bg-paper">
          {classes.map((c) => (
            <li key={c.code + c.t} className="flex items-center justify-between gap-3 border-l-2 border-indigo-deep px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs text-muted">{c.t}</div>
                <div className="text-sm font-semibold text-ink">{c.code} — {c.title}</div>
                <div className="text-[13px] text-muted">{c.lecturer} · <strong className="text-ink">{c.room}</strong></div>
              </div>
              <StatusBadge tone={c.tag === "Elective" ? "accent" : "neutral"}>{c.tag}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

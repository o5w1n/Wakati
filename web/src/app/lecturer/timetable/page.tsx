"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { TimetableGrid, SAMPLE_PERIODS, type GridDay } from "@/components/timetable";
import { Download } from "lucide-react";

const MY_DAYS: GridDay[] = [
  { day: 1, label: "Monday", slots: Array(9).fill(null).map((_, i) =>
    i < 2 ? { id: "m1", courseCodes: ["CS302"], title: "Algorithms", tags: ["Theory"], lecturer: "You", room: "L-1" } : null) },
  { day: 2, label: "Tuesday", slots: Array(9).fill(null).map((_, i) =>
    i === 2 || i === 3 ? { id: "m2", courseCodes: ["AI4136", "CS4135"], title: "Computer Security", tags: ["Theory", "Elective"], lecturer: "You", room: "L-3" } : null) },
  { day: 3, label: "Wednesday", slots: Array(9).fill(null) },
  { day: 4, label: "Thursday", slots: Array(9).fill(null).map((_, i) =>
    i === 5 ? { id: "m3", courseCodes: ["CW400"], title: "Career Workshop", tags: ["Workshop"], lecturer: "You", room: "L-1" } : null) },
  { day: 5, label: "Friday", slots: Array(9).fill(null) },
];

export default function LecturerTimetable() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <Shell role="lecturer" active="/lecturer/timetable">
      <PageHeader
        title="My Timetable"
        sub="Semester 1 · 3 sessions · 7 periods/week"
        actions={<button className={btnSecondaryCls}><Download size={15} /> PDF / Excel</button>}
      />
      <div className="mb-3"><StatusBadge tone="ok">Published v7 — 12 Nov</StatusBadge></div>
      <TimetableGrid days={MY_DAYS} periods={SAMPLE_PERIODS} selectedId={sel} onSelect={setSel} />
    </Shell>
  );
}

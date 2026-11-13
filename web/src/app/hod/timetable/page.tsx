"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { TimetableGrid, SAMPLE_DAYS, SAMPLE_PERIODS, type SlotStatus } from "@/components/timetable";
import { btnSecondaryCls } from "@/components/ui";
import { Download } from "lucide-react";

const STATUSES: Record<string, SlotStatus> = { s1: "ok", s2: "ok", s3: "warn", s4: "ok" };
const REASONS: Record<string, string> = {
  s3: "Soft preference: last period of the day, outside preferred window (P1, −15).",
};

export default function HodTimetable() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <Shell role="hod" active="/hod/timetable">
      <PageHeader
        title="Department Timetable"
        sub="Computer Science · v8 draft (under review) — read-only for HoD"
        actions={<button className={btnSecondaryCls}><Download size={15} /> PDF / Excel</button>}
      />
      <div className="mb-3 flex items-center gap-2">
        <StatusBadge tone="warn">Under review</StatusBadge>
        <span className="text-[13px] text-muted">Edits go through the Registry — flag issues rather than fixing them here.</span>
      </div>
      <TimetableGrid days={SAMPLE_DAYS} periods={SAMPLE_PERIODS} statuses={STATUSES} reasons={REASONS} selectedId={sel} onSelect={setSel} />
    </Shell>
  );
}

"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { DataTable } from "@/components/datatable";

const ROWS = [
  { id: "1", name: "Dr. Ama Mensah", dept: "Computer Science", status: "Submitted", load: "18 / 45 free" },
  { id: "2", name: "Prof. Kwame Yamak", dept: "Mathematics", status: "Submitted", load: "22 / 45 free" },
  { id: "3", name: "Ms. Efua Adjunct", dept: "Computer Science", status: "Not submitted", load: "—" },
  { id: "4", name: "Dr. Kofi Owusu", dept: "Physics", status: "Tight", load: "38 / 42 free" },
];

export default function AvailabilityTracking() {
  return (
    <Shell role="registry" active="/registry/availability">
      <PageHeader
        title="Availability"
        sub="2026/27 Semester 1 · window closes Fri 20 Nov · 41 of 58 submitted"
        actions={
          <>
            <button className={btnSecondaryCls}>Remind all pending</button>
            <button className={btnPrimaryCls}>Close window</button>
          </>
        }
      />
      <div className="mb-3 h-1.5 w-full bg-canvas-2">
        <div className="h-1.5 w-[71%] bg-indigo-deep" />
      </div>
      <DataTable
        rows={ROWS}
        searchPlaceholder="Search lecturers…"
        columns={[
          { key: "name", header: "Lecturer", render: (r) => r.name },
          { key: "dept", header: "Department", render: (r) => r.dept },
          {
            key: "status", header: "Status",
            render: (r) =>
              r.status === "Submitted" ? <StatusBadge tone="ok">Submitted</StatusBadge> :
              r.status === "Tight" ? <StatusBadge tone="warn">Tight load</StatusBadge> :
              <StatusBadge tone="bad">Not submitted</StatusBadge>,
          },
          { key: "load", header: "Teaching vs free", render: (r) => <span className="text-muted">{r.load}</span> },
          {
            key: "act", header: "", className: "text-right",
            render: () => <Link href="/lecturer/availability" className="text-indigo-deep hover:underline">Enter on behalf</Link>,
          },
        ]}
      />
      <p className="mt-2 text-xs text-muted">
        Before generation, the pre-check warns when a lecturer's free periods are fewer than periods they must teach (FR-7.7).
      </p>
    </Shell>
  );
}

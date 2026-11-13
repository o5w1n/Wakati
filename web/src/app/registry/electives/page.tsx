"use client";

import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DataTable } from "@/components/datatable";

const OVERLAPS = [
  { id: "1", a: "ML401", b: "CRY402", students: "34", verdict: "Keep apart" },
  { id: "2", a: "ML401", b: "CS4135", students: "12", verdict: "Keep apart" },
  { id: "3", a: "CRY402", b: "CS4135", students: "8", verdict: "Keep apart" },
  { id: "4", a: "CS302", b: "ML401", students: "0", verdict: "No overlap" },
];

export default function ElectiveOverlap() {
  return (
    <Shell role="registry" active="/registry/electives">
      <PageHeader
        title="Elective Overlap"
        sub="Course pairs that share students. Pairs with shared enrolments must never run in parallel (H4)."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="border border-line bg-paper p-4">
          <div className="text-2xl font-semibold text-ink">3</div>
          <div className="text-[13px] text-muted">pairs must stay apart</div>
        </div>
        <div className="border border-line bg-paper p-4">
          <div className="text-2xl font-semibold text-ink">54</div>
          <div className="text-[13px] text-muted">elective choices recorded</div>
        </div>
        <div className="border border-line bg-paper p-4">
          <div className="text-2xl font-semibold text-ink">BSc CS 400</div>
          <div className="text-[13px] text-muted">cohort with the most overlap</div>
        </div>
      </div>
      <DataTable
        rows={OVERLAPS}
        searchPlaceholder="Search course pairs…"
        columns={[
          { key: "a", header: "Course A", render: (r) => <span className="font-mono text-xs">{r.a}</span> },
          { key: "b", header: "Course B", render: (r) => <span className="font-mono text-xs">{r.b}</span> },
          { key: "students", header: "Shared students", render: (r) => r.students },
          {
            key: "verdict", header: "Solver rule",
            render: (r) => r.verdict === "Keep apart"
              ? <StatusBadge tone="bad">Keep apart (H4)</StatusBadge>
              : <StatusBadge tone="neutral">No overlap</StatusBadge>,
          },
        ]}
      />
      <p className="mt-3 text-xs text-muted">
        Built from student elective choices. Add choices under Master Data → Students and the map rebuilds on the next pre-check.
      </p>
    </Shell>
  );
}

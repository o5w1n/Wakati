"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge } from "@/components/ui";
import { DataTable } from "@/components/datatable";

const INSTITUTIONS = [
  { id: "1", name: "Academic City University", code: "AC", status: "Active", members: "1,240", semesters: "3", registered: "12 Oct 2026" },
  { id: "2", name: "Ashesi University", code: "ASH", status: "Active", members: "860", semesters: "1", registered: "28 Oct 2026" },
  { id: "3", name: "Ho Technical University", code: "HTU", status: "Pending", members: "—", semesters: "0", registered: "9 Nov 2026" },
  { id: "4", name: "Valley View University", code: "VVU", status: "Suspended", members: "312", semesters: "1", registered: "3 Sep 2026" },
];

export default function Institutions() {
  return (
    <Shell role="superadmin" active="/admin">
      <PageHeader title="Institutions" sub="Every tenant on the platform. Registration is self-service; status is yours." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active" value="2" sub="serving timetables" />
        <MetricCard label="Pending review" value="1" sub="awaiting approval" />
        <MetricCard label="Suspended" value="1" sub="read-only, no solves" />
        <MetricCard label="Total members" value="2,412" sub="across all tenants" />
      </div>
      <DataTable
        rows={INSTITUTIONS}
        searchPlaceholder="Search institutions…"
        columns={[
          {
            key: "name", header: "Institution",
            render: (r) => (
              <span>
                <Link href={`/admin/${r.code.toLowerCase()}`} className="font-medium text-ink hover:text-indigo-deep">
                  {r.name}
                </Link>
                <span className="ml-2 font-mono text-xs text-muted">{r.code}</span>
              </span>
            ),
          },
          {
            key: "status", header: "Status",
            render: (r) =>
              r.status === "Active" ? <StatusBadge tone="ok">Active</StatusBadge> :
              r.status === "Pending" ? <StatusBadge tone="warn">Pending</StatusBadge> :
              <StatusBadge tone="bad">Suspended</StatusBadge>,
          },
          { key: "members", header: "Members", render: (r) => r.members },
          { key: "semesters", header: "Semesters", render: (r) => r.semesters },
          { key: "registered", header: "Registered", render: (r) => <span className="text-muted">{r.registered}</span> },
          {
            key: "act", header: "", className: "text-right",
            render: (r) => (
              <Link href={`/admin/${r.code.toLowerCase()}`} className="text-indigo-deep hover:underline">
                Manage
              </Link>
            ),
          },
        ]}
      />
    </Shell>
  );
}

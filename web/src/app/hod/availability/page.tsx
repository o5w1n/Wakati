"use client";

import { Shell } from "@/components/shell";
import { AvailabilityGrid } from "@/app/lecturer/availability/page";
import { DataTable } from "@/components/datatable";
import { StatusBadge } from "@/components/ui";

const DEPT = [
  { id: "1", name: "Dr. Mensah", submitted: true, unavailable: "4", preferred: "9" },
  { id: "2", name: "Prof. Yamak", submitted: true, unavailable: "16", preferred: "6" },
  { id: "3", name: "Ms. Adjunct", submitted: false, unavailable: "—", preferred: "—" },
  { id: "4", name: "Mr. Tetteh", submitted: false, unavailable: "—", preferred: "—" },
  { id: "5", name: "Dr. Owusu", submitted: false, unavailable: "—", preferred: "—" },
];

export default function HodAvailability() {
  return (
    <Shell role="hod" active="/hod/availability">
      <AvailabilityGrid
        heading="Availability"
        sub="Your grid as a lecturer · deadline Fri 20 Nov — click a cell to cycle Available → Preferred → Unavailable"
      />
      <section className="mt-6 border border-line bg-paper p-4">
        <div className="mb-3 text-sm font-medium text-ink">
          Department tracking <StatusBadge tone="warn">3 of 5 not submitted</StatusBadge>
        </div>
        <DataTable
          rows={DEPT}
          searchPlaceholder="Search lecturers…"
          columns={[
            { key: "name", header: "Lecturer", render: (r) => <span className="font-medium">{r.name}</span> },
            {
              key: "submitted", header: "Status",
              render: (r) => r.submitted ? <StatusBadge tone="ok">Submitted</StatusBadge> : <StatusBadge tone="bad">Not submitted</StatusBadge>,
            },
            { key: "unavailable", header: "Unavailable", render: (r) => r.unavailable },
            { key: "preferred", header: "Preferred", render: (r) => r.preferred },
          ]}
        />
      </section>
    </Shell>
  );
}

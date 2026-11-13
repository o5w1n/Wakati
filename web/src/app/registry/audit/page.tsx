"use client";

import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DataTable } from "@/components/datatable";

const ROWS = [
  { id: "1", when: "13 Nov 09:12", actor: "Registry Admin", action: "Created draft v8 from v7", detail: "12 sessions moved", kind: "version" },
  { id: "2", when: "13 Nov 08:47", actor: "Registry Admin", action: "Locked CS302 Mon P1–P2", detail: "H11 lock", kind: "edit" },
  { id: "3", when: "12 Nov 16:20", actor: "Registry Admin", action: "Overrode soft preference ML401 Wed P8–P9", detail: "Reason logged: Lab-A only free slot", kind: "override" },
  { id: "4", when: "12 Nov 15:02", actor: "System", action: "Solve job #41 finished", detail: "score 96.0, 0 hard clashes", kind: "solve" },
  { id: "5", when: "10 Nov 17:40", actor: "Registry Admin", action: "Published v7", detail: "1,170 students notified", kind: "publish" },
  { id: "6", when: "9 Nov 11:05", actor: "Dr. Yamak", action: "Updated availability", detail: "Wed P8–P9 → unavailable", kind: "availability" },
];

export default function RegistryAudit() {
  return (
    <Shell role="registry" active="/registry/audit">
      <PageHeader title="Audit Log" sub="Every change to Semester 1 2026/27, kept for at least a year. Overrides always carry a reason." />
      <DataTable
        rows={ROWS}
        searchPlaceholder="Search actor, action…"
        columns={[
          { key: "when", header: "When", render: (r) => <span className="whitespace-nowrap text-muted">{r.when}</span> },
          { key: "actor", header: "Actor", render: (r) => r.actor },
          {
            key: "action", header: "Action",
            render: (r) => (
              <span>
                {r.action}
                {r.kind === "override" && <StatusBadge tone="warn">override</StatusBadge>}
              </span>
            ),
          },
          { key: "detail", header: "Detail", render: (r) => <span className="text-muted">{r.detail}</span> },
        ]}
      />
    </Shell>
  );
}

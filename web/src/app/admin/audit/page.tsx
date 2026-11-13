"use client";

import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { DataTable } from "@/components/datatable";

const ROWS = [
  { id: "1", when: "13 Nov 09:41", actor: "platform admin", tenant: "VVU", action: "Suspended institution", reason: "Unpaid invoice Q3" },
  { id: "2", when: "12 Nov 16:02", actor: "platform admin", tenant: "AC", action: "Reassigned admin → registry@acity.edu.gh", reason: "Staff change" },
  { id: "3", when: "9 Nov 11:20", actor: "system", tenant: "HTU", action: "Institution registered (pending)", reason: "Self-service signup" },
  { id: "4", when: "28 Oct 14:55", actor: "platform admin", tenant: "ASH", action: "Approved & activated", reason: "Documents verified" },
];

export default function PlatformAudit() {
  return (
    <Shell role="superadmin" active="/admin/audit">
      <PageHeader title="Audit Log" sub="Platform-level actions. Tenant timetabling changes live in each institution's own log." />
      <DataTable
        rows={ROWS}
        searchPlaceholder="Search actor, tenant, action…"
        columns={[
          { key: "when", header: "When", render: (r) => <span className="whitespace-nowrap text-muted">{r.when}</span> },
          { key: "actor", header: "Actor", render: (r) => r.actor },
          { key: "tenant", header: "Institution", render: (r) => <span className="font-mono text-xs">{r.tenant}</span> },
          { key: "action", header: "Action", render: (r) => r.action },
          { key: "reason", header: "Reason", render: (r) => <span className="text-muted">{r.reason}</span> },
        ]}
      />
    </Shell>
  );
}

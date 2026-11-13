"use client";

import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field, EmptyState } from "@/components/ui";
import { DataTable } from "@/components/datatable";
import { inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";

const REQUESTS = [
  { id: "1", name: "Efua Mensimah", email: "efua@acity.edu.gh", role: "Lecturer", requested: "11 Nov 2026" },
  { id: "2", name: "Yaw Asante", email: "yaw.asante@acity.edu.gh", role: "Student", requested: "10 Nov 2026" },
  { id: "3", name: "Ama Boateng", email: "ama.b@acity.edu.gh", role: "HoD", requested: "8 Nov 2026" },
];

const INVITES = [
  { id: "1", email: "k.osei@acity.edu.gh", role: "Lecturer", sent: "9 Nov 2026", expires: "23 Nov 2026" },
  { id: "2", email: "admissions@acity.edu.gh", role: "Timetable admin", sent: "5 Nov 2026", expires: "19 Nov 2026" },
];

const MEMBERS = [
  { id: "1", name: "Registry Admin", email: "registry@acity.edu.gh", role: "Timetable admin", status: "Active" },
  { id: "2", name: "Dr. Yamak", email: "yamak@acity.edu.gh", role: "Lecturer", status: "Active" },
  { id: "3", name: "Dr. Mensah", email: "mensah@acity.edu.gh", role: "Lecturer", status: "Active" },
  { id: "4", name: "Kofi Asante", email: "kofi.a@acity.edu.gh", role: "Student", status: "Active" },
  { id: "5", name: "A. Doku", email: "doku@acity.edu.gh", role: "HoD", status: "Suspended" },
];

export default function Members() {
  return (
    <Shell role="registry" active="/registry/members">
      <PageHeader title="Members" sub="Invite staff, approve join requests, manage roles." />

      {REQUESTS.length > 0 && (
        <section className="mb-6 border border-line bg-paper p-4">
          <div className="mb-3 text-sm font-medium text-ink">
            Join requests <StatusBadge tone="warn">{String(REQUESTS.length)} pending</StatusBadge>
          </div>
          <DataTable
            rows={REQUESTS}
            searchPlaceholder="Search requests…"
            columns={[
              { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
              { key: "email", header: "Email", render: (r) => <span className="text-muted">{r.email}</span> },
              { key: "role", header: "Requested role", render: (r) => r.role },
              { key: "requested", header: "Requested", render: (r) => <span className="text-muted">{r.requested}</span> },
              {
                key: "act", header: "", className: "text-right",
                render: () => (
                  <span className="flex justify-end gap-2">
                    <button className={btnSecondaryCls}>Reject</button>
                    <button className={btnPrimaryCls}>Approve</button>
                  </span>
                ),
              },
            ]}
          />
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Invite by email</div>
          <div className="space-y-3">
            <Field label="Email" hint="Must match the institution domain.">
              <input placeholder="person@acity.edu.gh" className={inputCls} />
            </Field>
            <Field label="Role">
              <select className={inputCls} defaultValue="lecturer">
                <option value="lecturer">Lecturer</option>
                <option value="student">Student</option>
                <option value="hod">HoD</option>
                <option value="timetable_admin">Timetable admin</option>
              </select>
            </Field>
            <button className={btnPrimaryCls}>Send invite</button>
          </div>
          {INVITES.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Pending invites</div>
              {INVITES.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-1.5 text-[13px]">
                  <span>
                    <span className="font-medium text-ink">{i.email}</span>
                    <span className="ml-2 text-muted">{i.role} · expires {i.expires}</span>
                  </span>
                  <button className="text-indigo-deep hover:underline">Revoke</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-line bg-paper p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-ink">All members</div>
          {MEMBERS.length === 0 ? (
            <EmptyState title="No members yet" sub="Invite your first lecturer to get started." />
          ) : (
            <DataTable
              rows={MEMBERS}
              searchPlaceholder="Search members…"
              columns={[
                { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "email", header: "Email", render: (r) => <span className="text-muted">{r.email}</span> },
                { key: "role", header: "Role", render: (r) => r.role },
                {
                  key: "status", header: "Status",
                  render: (r) => r.status === "Active"
                    ? <StatusBadge tone="ok">Active</StatusBadge>
                    : <StatusBadge tone="bad">Suspended</StatusBadge>,
                },
              ]}
            />
          )}
        </section>
      </div>
    </Shell>
  );
}

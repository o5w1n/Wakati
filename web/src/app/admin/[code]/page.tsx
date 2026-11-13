import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";

const DETAIL: Record<string, { name: string; code: string; status: "Active" | "Pending" | "Suspended"; domain: string; admin: string; adminEmail: string; registered: string; members: string; lecturers: string; students: string; semesters: string; solves: string }> = {
  ac: { name: "Academic City University", code: "AC", status: "Active", domain: "acity.edu.gh", admin: "Registry Admin", adminEmail: "registry@acity.edu.gh", registered: "12 Oct 2026", members: "1,240", lecturers: "58", students: "1,170", semesters: "3", solves: "42" },
  ash: { name: "Ashesi University", code: "ASH", status: "Active", domain: "ashesi.edu.gh", admin: "E. Owusu", adminEmail: "registry@ashesi.edu.gh", registered: "28 Oct 2026", members: "860", lecturers: "44", students: "810", semesters: "1", solves: "9" },
  htu: { name: "Ho Technical University", code: "HTU", status: "Pending", domain: "htu.edu.gh", admin: "—", adminEmail: "—", registered: "9 Nov 2026", members: "—", lecturers: "—", students: "—", semesters: "0", solves: "0" },
  vvu: { name: "Valley View University", code: "VVU", status: "Suspended", domain: "vvu.edu.gh", admin: "D. Mensimah", adminEmail: "registry@vvu.edu.gh", registered: "3 Sep 2026", members: "312", lecturers: "21", students: "288", semesters: "1", solves: "6" },
};

export function generateStaticParams() {
  return Object.keys(DETAIL).map((code) => ({ code }));
}

export default async function InstitutionDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const u = DETAIL[code] ?? DETAIL.ac;
  return (
    <Shell role="superadmin" active="/admin">
      <PageHeader
        title={u.name}
        sub={`${u.code} · registered ${u.registered}`}
        actions={
          <>
            <Link href="/admin" className={btnSecondaryCls}>← All institutions</Link>
            {u.status === "Pending" ? (
              <>
                <button className={btnSecondaryCls}>Reject</button>
                <button className={btnPrimaryCls}>Approve & activate</button>
              </>
            ) : u.status === "Active" ? (
              <button className={btnSecondaryCls}>Suspend</button>
            ) : (
              <button className={btnPrimaryCls}>Reactivate</button>
            )}
          </>
        }
      />
      <div className="mb-3">
        <StatusBadge tone={u.status === "Active" ? "ok" : u.status === "Pending" ? "warn" : "bad"}>{u.status}</StatusBadge>
        {u.status === "Suspended" && (
          <span className="ml-2 text-[13px] text-muted">Tenant is read-only: sign-ins blocked, no new solves.</span>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Members" value={u.members} sub={`${u.lecturers} lecturers · ${u.students} students`} />
        <MetricCard label="Semesters" value={u.semesters} />
        <MetricCard label="Solver runs" value={u.solves} sub="all time" />
        <MetricCard label="Admin" value={u.admin} sub={u.adminEmail} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Institution settings</div>
          <div className="space-y-3">
            <Field label="Email domain" hint="Members must sign up with this domain.">
              <input defaultValue={u.domain} className={inputCls} />
            </Field>
            <Field label="Short code">
              <input defaultValue={u.code} className={`${inputCls} uppercase`} maxLength={8} />
            </Field>
            <button className={btnPrimaryCls}>Save changes</button>
          </div>
        </section>

        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Reassign admin</div>
          <div className="space-y-3">
            <Field label="New admin email" hint="Must already be a member of this institution.">
              <input placeholder="person@…edu.gh" className={inputCls} />
            </Field>
            <Field label="Reason" hint="Logged in the audit trail.">
              <input placeholder="Staff change at the Registry…" className={inputCls} />
            </Field>
            <button className={btnSecondaryCls}>Transfer admin role</button>
          </div>
          {u.status === "Suspended" && (
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Suspension is reversible and non-destructive: data is kept, placements stay published read-only.
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}

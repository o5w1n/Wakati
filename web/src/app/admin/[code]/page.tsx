import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { setInstitutionStatus, updateInstitution } from "@/app/actions/admin";

export const instant = false;

export default async function InstitutionDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const sb = await supabaseServer();
  const { data: uni } = await sb.from("universities").select("id,name,short_code,domain,status,created_at").eq("id", code).single();
  const u = uni as { id: string; name: string; short_code: string; domain: string | null; status: string; created_at: string } | null;
  if (!u) {
    return (
      <Shell role="superadmin" active="/admin">
        <PageHeader title="Not found" sub="No institution with that id." actions={<Link href="/admin" className={btnSecondaryCls}>← All institutions</Link>} />
      </Shell>
    );
  }
  const { count: members } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", u.id);
  const { count: semesters } = await sb.from("semesters").select("id", { count: "exact", head: true }).eq("university_id", u.id);
  const { data: admins } = await sb.from("profiles").select("email,full_name").eq("university_id", u.id).eq("role", "timetable_admin").limit(3);
  const adminList = (admins ?? []) as { email: string; full_name: string | null }[];

  return (
    <Shell role="superadmin" active="/admin">
      <PageHeader
        title={u.name}
        sub={`${u.short_code} · registered ${new Date(u.created_at).toLocaleDateString()}`}
        actions={
          <>
            <Link href="/admin" className={btnSecondaryCls}>← All institutions</Link>
            {u.status === "pending" ? (
              <>
                <form action={async () => { await setInstitutionStatus(u.id, "active"); }}>
                  <button className={btnPrimaryCls}>Approve & activate</button>
                </form>
                <form action={async () => { await setInstitutionStatus(u.id, "suspended"); }}>
                  <button className={btnSecondaryCls}>Reject</button>
                </form>
              </>
            ) : u.status === "active" ? (
              <form action={async () => { await setInstitutionStatus(u.id, "suspended"); }}>
                <button className={btnSecondaryCls}>Suspend</button>
              </form>
            ) : (
              <form action={async () => { await setInstitutionStatus(u.id, "active"); }}>
                <button className={btnPrimaryCls}>Reactivate</button>
              </form>
            )}
          </>
        }
      />
      <div className="mb-3">
        <StatusBadge tone={u.status === "active" ? "ok" : u.status === "pending" ? "warn" : "bad"}>{u.status}</StatusBadge>
        {u.status === "suspended" && (
          <span className="ml-2 text-[13px] text-muted">Tenant is read-only: sign-ins blocked, no new solves.</span>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Members" value={String(members ?? 0)} />
        <MetricCard label="Semesters" value={String(semesters ?? 0)} />
        <MetricCard label="Admins" value={String(adminList.length)} sub={adminList.map((a) => a.email).join(", ") || "none"} />
        <MetricCard label="Domain" value={u.domain ?? "—"} sub="signup domain lock" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Institution settings</div>
          <form action={async (f: FormData) => { await updateInstitution(f); }} className="space-y-3">
            <input type="hidden" name="id" value={u.id} />
            <Field label="Name">
              <input name="name" defaultValue={u.name} className={inputCls} />
            </Field>
            <Field label="Email domain" hint="Members must sign up with this domain.">
              <input name="domain" defaultValue={u.domain ?? ""} className={inputCls} />
            </Field>
            <button className={btnPrimaryCls}>Save changes</button>
          </form>
        </section>

        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Admins</div>
          {adminList.length === 0 ? (
            <p className="text-[13px] text-muted">No timetable_admin on record — the registering user may not have completed signup.</p>
          ) : (
            adminList.map((a) => (
              <div key={a.email} className="border-b border-line py-2 text-[13px] last:border-0">
                <span className="font-medium text-ink">{a.full_name ?? a.email}</span>
                <span className="mt-0.5 block text-muted">{a.email}</span>
              </div>
            ))
          )}
          {u.status === "suspended" && (
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Suspension is reversible and non-destructive: data is kept, placements stay published read-only.
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}

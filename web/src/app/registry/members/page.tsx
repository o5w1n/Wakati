import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field, EmptyState } from "@/components/ui";
import { DataTable } from "@/components/datatable";
import { inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { inviteMember, reviewRequest, revokeInvite } from "@/app/actions/members";

export const instant = false;

interface Req {
  id: string;
  full_name: string | null;
  email: string;
  requested_role: string;
  created_at: string;
}
interface Inv {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}
interface Mem {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export default async function Members() {
  await connection();
  const sb = await supabaseServer();
  const [{ data: requests }, { data: invites }, { data: members }] = await Promise.all([
    sb.from("join_requests").select("id,full_name,email,requested_role,created_at").eq("status", "pending").order("created_at"),
    sb.from("invites").select("id,email,role,created_at,expires_at").is("accepted_at", null).order("created_at", { ascending: false }),
    sb.from("profiles").select("id,full_name,email,role").order("email"),
  ]);
  const reqs = (requests ?? []) as Req[];
  const invs = (invites ?? []) as Inv[];
  const mems = (members ?? []) as Mem[];

  return (
    <Shell role="registry" active="/registry/members">
      <PageHeader title="Members" sub="Invite staff, approve join requests, manage roles." />

      {reqs.length > 0 && (
        <section className="mb-6 border border-line bg-paper p-4">
          <div className="mb-3 text-sm font-medium text-ink">
            Join requests <StatusBadge tone="warn">{String(reqs.length)} pending</StatusBadge>
          </div>
          <DataTable
            rows={reqs.map((r) => ({
              id: r.id,
              name: r.full_name ?? "—",
              email: r.email,
              role: r.requested_role,
              requested: new Date(r.created_at).toLocaleDateString(),
            }))}
            searchPlaceholder="Search requests…"
            columns={[
              { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
              { key: "email", header: "Email", render: (r) => <span className="text-muted">{r.email}</span> },
              { key: "role", header: "Requested role", render: (r) => r.role },
              { key: "requested", header: "Requested", render: (r) => <span className="text-muted">{r.requested}</span> },
              {
                key: "act", header: "", className: "text-right",
                render: (r) => (
                  <span className="flex justify-end gap-2">
                    <form action={async () => { await reviewRequest(r.id, false); }}>
                      <button className={btnSecondaryCls}>Reject</button>
                    </form>
                    <form action={async () => { await reviewRequest(r.id, true); }}>
                      <button className={btnPrimaryCls}>Approve</button>
                    </form>
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
          <form action={async (f: FormData) => { await inviteMember(f); }} className="space-y-3">
            <Field label="Email" hint="Must match the institution domain.">
              <input name="email" type="email" required placeholder="person@acity.edu.gh" className={inputCls} />
            </Field>
            <Field label="Role">
              <select name="role" className={inputCls} defaultValue="lecturer">
                <option value="lecturer">Lecturer</option>
                <option value="student">Student</option>
                <option value="hod">HoD</option>
                <option value="timetable_admin">Timetable admin</option>
              </select>
            </Field>
            <button className={btnPrimaryCls}>Send invite</button>
          </form>
          {invs.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Pending invites</div>
              {invs.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-1.5 text-[13px]">
                  <span>
                    <span className="font-medium text-ink">{i.email}</span>
                    <span className="ml-2 text-muted">{i.role} · expires {new Date(i.expires_at).toLocaleDateString()}</span>
                  </span>
                  <form action={async () => { await revokeInvite(i.id); }}>
                    <button className="text-indigo-deep hover:underline">Revoke</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-line bg-paper p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-ink">All members</div>
          {mems.length === 0 ? (
            <EmptyState title="No members yet" sub="Invite your first lecturer to get started." />
          ) : (
            <DataTable
              rows={mems.map((m) => ({ id: m.id, name: m.full_name ?? "—", email: m.email, role: m.role }))}
              searchPlaceholder="Search members…"
              columns={[
                { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "email", header: "Email", render: (r) => <span className="text-muted">{r.email}</span> },
                { key: "role", header: "Role", render: (r) => r.role },
              ]}
            />
          )}
        </section>
      </div>
    </Shell>
  );
}

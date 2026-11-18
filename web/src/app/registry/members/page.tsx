import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field, EmptyState } from "@/components/ui";
import { inputCls, btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { inviteMember, reviewRequest, revokeInvite } from "@/app/actions/members";
import { createAccessCode, toggleAccessCode, deleteAccessCode } from "@/app/actions/access-codes";

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
interface AccessCode {
  id: string;
  role: string;
  code: string;
  label: string | null;
  active: boolean;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

export default async function Members() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  let institutionCode = "";
  if (user) {
    const { data: me } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
    const uni = (me as { university_id: string } | null)?.university_id;
    if (uni) {
      const { data: uniRow } = await sb.from("universities").select("short_code").eq("id", uni).single();
      institutionCode = (uniRow as { short_code: string } | null)?.short_code ?? "";
    }
  }

  const [{ data: requests }, { data: invites }, { data: members }, { data: codes }] = await Promise.all([
    sb
      .from("join_requests")
      .select("id,full_name,email,requested_role,created_at")
      .eq("status", "pending")
      .order("created_at"),
    sb
      .from("invites")
      .select("id,email,role,created_at,expires_at")
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
    sb.from("profiles").select("id,full_name,email,role").order("email"),
    sb
      .from("institution_access_codes")
      .select("id,role,code,label,active,uses_count,max_uses,expires_at,created_at")
      .order("created_at", { ascending: false }),
  ]);
  const reqs = (requests ?? []) as Req[];
  const invs = (invites ?? []) as Inv[];
  const mems = (members ?? []) as Mem[];
  const accessCodes = (codes ?? []) as AccessCode[];

  return (
    <Shell role="registry" active="/registry/members">
      <PageHeader
        title="Members & Access"
        sub="Institution code, access codes for students/lecturers/HODs, invites, and join requests."
      />

      <section className="mb-6 rounded-xl border border-cardline bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-heading">Institution code</div>
            <p className="mt-1 text-[13px] text-body">
              Share this with everyone in your institution. They use it together with their role access code to create an
              account, then sign in regularly with email and password.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <div className="text-[11px] uppercase tracking-wide text-muted">Code</div>
            <div className="font-mono text-lg font-bold tracking-wider text-heading">{institutionCode || "—"}</div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-cardline bg-card p-4 shadow-sm">
        <div className="mb-3">
          <div className="text-sm font-medium text-heading">Access codes</div>
          <p className="mt-0.5 text-[13px] text-body">
            Generate codes for students, lecturers, and HODs. Each code grants that level of access when redeemed during
            account creation.
          </p>
        </div>
        <form
          action={createAccessCode}
          className="mb-4 grid gap-3 rounded-lg border border-cardline bg-page/40 p-3 sm:grid-cols-4 sm:items-end"
        >
          <Field label="Role">
            <select name="role" className={inputCls} defaultValue="student">
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="hod">HOD</option>
              <option value="timetable_admin">Timetable admin</option>
            </select>
          </Field>
          <Field label="Label (optional)" hint="e.g. CS Level 300 cohort">
            <input name="label" placeholder="Label" className={inputCls} />
          </Field>
          <Field label="Custom code (optional)" hint="Leave blank to auto-generate">
            <input name="code" placeholder="AUTO" className={`${inputCls} font-mono uppercase`} />
          </Field>
          <button className={btnPrimaryCls}>Generate code</button>
        </form>

        {accessCodes.length === 0 ? (
          <p className="text-[13px] text-muted">No access codes yet. Generate one for students, lecturers, or HODs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-[13px]">
              <thead>
                <tr className="border-b border-cardline text-left text-body">
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">Uses</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cardline">
                {accessCodes.map((c) => {
                  async function toggle() {
                    "use server";
                    await toggleAccessCode(c.id, !c.active);
                  }
                  async function remove() {
                    "use server";
                    await deleteAccessCode(c.id);
                  }
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-mono font-semibold text-heading">{c.code}</td>
                      <td className="px-3 py-2 capitalize">{c.role.replace("_", " ")}</td>
                      <td className="px-3 py-2 text-muted">{c.label || "—"}</td>
                      <td className="px-3 py-2 text-muted">
                        {c.uses_count}
                        {c.max_uses ? ` / ${c.max_uses}` : ""}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge tone={c.active ? "ok" : "bad"}>{c.active ? "active" : "inactive"}</StatusBadge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <form action={toggle}>
                            <button className={`${btnSecondaryCls} !h-8 !px-3 !text-xs`}>
                              {c.active ? "Disable" : "Enable"}
                            </button>
                          </form>
                          <form action={remove}>
                            <button className="text-xs text-bad-text hover:underline">Delete</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reqs.length > 0 && (
        <section className="mb-6 rounded-xl border border-cardline bg-card p-4">
          <div className="mb-3 text-sm font-medium text-heading">
            Join requests <StatusBadge tone="warn">{String(reqs.length)} pending</StatusBadge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-cardline text-left text-body">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Requested role</th>
                  <th className="px-3 py-2 font-medium">Requested</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cardline">
                {reqs.map((r) => {
                  async function reject() {
                    "use server";
                    await reviewRequest(r.id, false);
                  }
                  async function approve() {
                    "use server";
                    await reviewRequest(r.id, true);
                  }
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2 font-medium text-heading">{r.full_name ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{r.email}</td>
                      <td className="px-3 py-2">{r.requested_role}</td>
                      <td className="px-3 py-2 text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <form action={reject}>
                            <button className={btnSecondaryCls}>Reject</button>
                          </form>
                          <form action={approve}>
                            <button className={btnPrimaryCls}>Approve</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-cardline bg-card p-4">
          <div className="mb-4 text-sm font-medium text-heading">Invite by email</div>
          <form action={inviteMember} className="space-y-3">
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
            <div className="mt-4 border-t border-cardline pt-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Pending invites</div>
              {invs.map((i) => {
                async function revoke() {
                  "use server";
                  await revokeInvite(i.id);
                }
                return (
                  <div key={i.id} className="flex items-center justify-between py-1.5 text-[13px]">
                    <span>
                      <span className="font-medium text-heading">{i.email}</span>
                      <span className="ml-2 text-muted">
                        {i.role} · expires {new Date(i.expires_at).toLocaleDateString()}
                      </span>
                    </span>
                    <form action={revoke}>
                      <button className="text-primary hover:underline">Revoke</button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-cardline bg-card p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-heading">All members</div>
          {mems.length === 0 ? (
            <EmptyState title="No members yet" sub="Share access codes or invite your first members." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="border-b border-cardline text-left text-body">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cardline">
                  {mems.map((m) => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 font-medium text-heading">{m.full_name ?? "—"}</td>
                      <td className="px-3 py-2 text-muted">{m.email}</td>
                      <td className="px-3 py-2 capitalize">{m.role.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}

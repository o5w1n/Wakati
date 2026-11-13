import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function PlatformAudit() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="superadmin" active="/admin/audit">
        <PageHeader title="Audit Log" sub="Sign in to view." />
      </Shell>
    );
  }
  // platform view: status changes = universities.updated; show current statuses + join-request decisions
  const { data: unis } = await sb.from("universities").select("id,name,short_code,status,created_at").order("created_at", { ascending: false });
  const list = (unis ?? []) as { id: string; name: string; short_code: string; status: string; created_at: string }[];

  return (
    <Shell role="superadmin" active="/admin/audit">
      <PageHeader title="Audit Log" sub="Platform-level actions. Tenant timetabling changes live in each institution's own log." />
      {list.length === 0 ? (
        <p className="border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">No institutions yet.</p>
      ) : (
        <table className="w-full border border-line bg-paper text-[13px]">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-muted">
              <th className="px-3 py-2 font-medium">Registered</th>
              <th className="px-3 py-2 font-medium">Institution</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-muted">{new Date(u.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{u.name} <span className="font-mono text-xs text-muted">{u.short_code}</span></td>
                <td className="px-3 py-2">
                  <StatusBadge tone={u.status === "active" ? "ok" : u.status === "pending" ? "warn" : "bad"}>{u.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-xs text-muted">Full per-action platform trail (approvals, suspensions) ships with the service-role audit writer.</p>
    </Shell>
  );
}

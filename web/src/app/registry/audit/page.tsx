import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function RegistryAudit() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="registry" active="/registry/audit">
        <PageHeader title="Audit Log" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  const { data: log } = sem
    ? await sb
        .from("change_log")
        .select("id,action,reason,created_at,actor,version_id,timetable_versions(created_at)")
        .eq("university_id", uni)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };
  const rows = (log ?? []) as { id: string; action: string; reason: string | null; created_at: string; actor: string | null }[];

  return (
    <Shell role="registry" active="/registry/audit">
      <PageHeader title="Audit Log" sub={`Every change${sem ? ` to ${sem.name}` : ""}, kept for at least a year. Overrides always carry a reason.`} />
      {rows.length === 0 ? (
        <p className="border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">
          No changes logged yet. Edits in the editor write here automatically.
        </p>
      ) : (
        <table className="w-full border border-line bg-paper text-[13px]">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-muted">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-muted">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {r.action}
                  {r.action.toLowerCase().includes("override") && <StatusBadge tone="warn">override</StatusBadge>}
                </td>
                <td className="px-3 py-2 text-muted">{r.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}

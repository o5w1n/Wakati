import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
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
  // platform view: super_admin sees all tenant change_log entries (RLS permits);
  // university status changes are visible via the institutions list.
  const { data: entries } = await sb
    .from("change_log")
    .select("id,university_id,action,reason,created_at,universities(name,short_code)")
    .order("created_at", { ascending: false })
    .limit(100);
  const list = ((entries ?? []) as unknown as {
    id: string; university_id: string; action: string; reason: string | null; created_at: string;
    universities: { name: string; short_code: string } | { name: string; short_code: string }[] | null;
  }[]).map((e) => ({
    ...e,
    universities: Array.isArray(e.universities) ? (e.universities[0] ?? null) : e.universities,
  }));

  return (
    <Shell role="superadmin" active="/admin/audit">
      <PageHeader title="Audit Log" sub="Latest 100 actions across all institutions, newest first." />
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cardline bg-card p-6 text-center text-[13px] text-muted">
          No actions logged yet. Publish a version or run the solver to create entries.
        </p>
      ) : (
        <table className="w-full border border-cardline bg-card text-[13px]">
          <thead>
            <tr className="border-b border-cardline bg-page text-left text-muted">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Institution</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id} className="border-b border-cardline last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-muted">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{e.universities?.name ?? e.university_id} <span className="font-mono text-xs text-muted">{e.universities?.short_code}</span></td>
                <td className="px-3 py-2 text-heading">{e.action}</td>
                <td className="px-3 py-2 text-body">{e.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}

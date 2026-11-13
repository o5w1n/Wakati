import { connection } from "next/server";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function Institutions() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="superadmin" active="/admin">
        <PageHeader title="Institutions" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: unis } = await sb.from("universities").select("id,name,short_code,status,created_at").order("created_at", { ascending: false });
  const list = (unis ?? []) as { id: string; name: string; short_code: string; status: string; created_at: string }[];
  const active = list.filter((u) => u.status === "active").length;
  const pending = list.filter((u) => u.status === "pending").length;
  const suspended = list.filter((u) => u.status === "suspended").length;

  // member counts per institution
  const counts = new Map<string, number>();
  if (list.length > 0) {
    const { data: members } = await sb.from("profiles").select("university_id").in("university_id", list.map((u) => u.id));
    for (const m of ((members ?? []) as { university_id: string }[])) {
      counts.set(m.university_id, (counts.get(m.university_id) ?? 0) + 1);
    }
  }

  return (
    <Shell role="superadmin" active="/admin">
      <PageHeader title="Institutions" sub="Every tenant on the platform. Registration is self-service; status is yours." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active" value={String(active)} sub="serving timetables" />
        <MetricCard label="Pending review" value={String(pending)} sub="awaiting approval" />
        <MetricCard label="Suspended" value={String(suspended)} sub="read-only, no solves" />
        <MetricCard label="Total members" value={String([...counts.values()].reduce((a, b) => a + b, 0))} sub="across all tenants" />
      </div>
      {list.length === 0 ? (
        <p className="border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">No institutions yet.</p>
      ) : (
        <table className="w-full border border-line bg-paper text-[13px]">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-muted">
              <th className="px-3 py-2 font-medium">Institution</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Members</th>
              <th className="px-3 py-2 font-medium">Registered</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/admin/${u.id}`} className="font-medium text-ink hover:text-indigo-deep">{u.name}</Link>
                  <span className="ml-2 font-mono text-xs text-muted">{u.short_code}</span>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone={u.status === "active" ? "ok" : u.status === "pending" ? "warn" : "bad"}>{u.status}</StatusBadge>
                </td>
                <td className="px-3 py-2">{counts.get(u.id) ?? 0}</td>
                <td className="px-3 py-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/${u.id}`} className="text-indigo-deep hover:underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}

import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function HodAvailability() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="hod" active="/hod/availability">
        <PageHeader title="Availability" sub="Sign in first." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  if (!uni) {
    return (
      <Shell role="hod" active="/hod/availability">
        <PageHeader title="Availability" sub="No university linked." />
      </Shell>
    );
  }
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  if (!sem) {
    return (
      <Shell role="hod" active="/hod/availability">
        <PageHeader title="Availability" sub="No semester yet." />
        <EmptyState title="No semester" sub="The Registry creates the semester first." />
      </Shell>
    );
  }
  const { data: lecturers } = await sb.from("lecturers").select("id,name").eq("university_id", uni).order("name");
  const list = (lecturers ?? []) as { id: string; name: string }[];
  const { data: avail } = await sb
    .from("lecturer_availability")
    .select("lecturer_id,status")
    .eq("semester_id", sem.id);
  const byLect = new Map<string, { unavailable: number; preferred: number }>();
  for (const a of ((avail ?? []) as { lecturer_id: string; status: string }[])) {
    const e = byLect.get(a.lecturer_id) ?? { unavailable: 0, preferred: 0 };
    if (a.status === "unavailable") e.unavailable++;
    if (a.status === "preferred") e.preferred++;
    byLect.set(a.lecturer_id, e);
  }
  const missing = list.filter((l) => !byLect.has(l.id)).length;

  return (
    <Shell role="hod" active="/hod/availability">
      <PageHeader title="Availability" sub={`${sem.name} · department tracking`} />
      <section className="border border-line bg-paper p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          Department tracking
          {missing > 0 ? (
            <StatusBadge tone="warn">{missing} of {list.length} not submitted</StatusBadge>
          ) : (
            <StatusBadge tone="ok">All {list.length} submitted</StatusBadge>
          )}
        </div>
        {list.length === 0 ? (
          <p className="text-[13px] text-muted">No lecturers imported yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-2 font-medium">Lecturer</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Unavailable</th>
                <th className="py-2 font-medium">Preferred</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const e = byLect.get(l.id);
                return (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="py-2 font-medium text-ink">{l.name}</td>
                    <td className="py-2">{e ? <StatusBadge tone="ok">Submitted</StatusBadge> : <StatusBadge tone="bad">Not submitted</StatusBadge>}</td>
                    <td className="py-2">{e?.unavailable ?? "—"}</td>
                    <td className="py-2">{e?.preferred ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}

import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function AvailabilityTracking() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="registry" active="/registry/availability">
        <PageHeader title="Availability" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name,status").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string; status: string }[])[0];
  if (!sem) {
    return (
      <Shell role="registry" active="/registry/availability">
        <PageHeader title="Availability" sub="No semester yet." />
        <EmptyState title="No semester" sub="Create one under Semester settings first." />
      </Shell>
    );
  }
  const { data: lecturers } = await sb.from("lecturers").select("id,name,department").eq("university_id", uni).eq("active", true).order("name");
  const list = (lecturers ?? []) as { id: string; name: string; department: string }[];
  const { data: avail } = await sb.from("lecturer_availability").select("lecturer_id,status").eq("semester_id", sem.id);
  const byLect = new Map<string, { unavailable: number; preferred: number }>();
  for (const a of ((avail ?? []) as { lecturer_id: string; status: string }[])) {
    const e = byLect.get(a.lecturer_id) ?? { unavailable: 0, preferred: 0 };
    if (a.status === "unavailable") e.unavailable++;
    if (a.status === "preferred") e.preferred++;
    byLect.set(a.lecturer_id, e);
  }
  const submitted = byLect.size;
  const pct = list.length > 0 ? Math.round((submitted / list.length) * 100) : 0;

  return (
    <Shell role="registry" active="/registry/availability">
      <PageHeader
        title="Availability"
        sub={`${sem.name} · ${submitted} of ${list.length} submitted`}
      />
      <div className="mb-3 h-1.5 w-full bg-canvas-2">
        <div className="h-1.5 bg-indigo-deep" style={{ width: `${pct}%` }} />
      </div>
      {list.length === 0 ? (
        <EmptyState title="No lecturers" sub="Import lecturers under Master Data first." />
      ) : (
        <table className="w-full border border-line bg-paper text-[13px]">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-muted">
              <th className="px-3 py-2 font-medium">Lecturer</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Unavailable</th>
              <th className="px-3 py-2 font-medium">Preferred</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => {
              const e = byLect.get(l.id);
              return (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{l.name}</td>
                  <td className="px-3 py-2 text-muted">{l.department}</td>
                  <td className="px-3 py-2">{e ? <StatusBadge tone="ok">Submitted</StatusBadge> : <StatusBadge tone="bad">Not submitted</StatusBadge>}</td>
                  <td className="px-3 py-2">{e?.unavailable ?? "—"}</td>
                  <td className="px-3 py-2">{e?.preferred ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-xs text-muted">
        Before generation, the pre-check warns when a lecturer's free periods are fewer than periods they must teach (FR-7.7).
      </p>
    </Shell>
  );
}

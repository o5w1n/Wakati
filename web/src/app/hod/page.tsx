import { connection } from "next/server";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function HodHome() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="hod" active="/hod">
        <PageHeader title="Department" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: uni2 } = await sb.from("universities").select("name").eq("id", uni).single();
  const uniName = (uni2 as { name: string } | null)?.name ?? "";
  const { data: sems } = await sb.from("semesters").select("id,name,status").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string; status: string }[])[0];
  if (!sem) {
    return (
      <Shell role="hod" active="/hod">
        <PageHeader title={uniName} sub="No semester yet." />
        <EmptyState title="No semester" sub="The Registry creates the semester first." />
      </Shell>
    );
  }
  const { count: lectTotal } = await sb.from("lecturers").select("id", { count: "exact", head: true }).eq("university_id", uni).eq("active", true);
  const { data: av } = await sb.from("lecturer_availability").select("lecturer_id").eq("semester_id", sem.id);
  const submitted = new Set(((av ?? []) as { lecturer_id: string }[]).map((a) => a.lecturer_id)).size;
  const { count: sessCount } = await sb.from("sessions").select("id", { count: "exact", head: true }).eq("semester_id", sem.id);
  const { count: tba } = await sb.from("sessions").select("id", { count: "exact", head: true }).eq("semester_id", sem.id).is("lecturer_id", null);
  const { data: vers } = await sb.from("timetable_versions").select("id,status,quality_score").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(1);
  const ver = ((vers ?? []) as { id: string; status: string; quality_score: number | null }[])[0];
  const missing = (lectTotal ?? 0) - submitted;

  return (
    <Shell role="hod" active="/hod">
      <PageHeader title={uniName} sub={`Head of Department · ${sem.name}`} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Lecturers" value={String(lectTotal ?? 0)} sub={`${submitted} submitted availability`} />
        <MetricCard label="Sessions" value={String(sessCount ?? 0)} sub={sem.name} />
        <MetricCard label="TBA lecturers" value={String(tba ?? 0)} sub="assign before publish" />
        <MetricCard label="Version" value={ver ? ver.status : "none"} sub={ver?.quality_score != null ? `score ${ver.quality_score}` : ""} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Needs your attention</div>
          <div className="divide-y divide-line">
            <div className="flex items-center justify-between px-4 py-3 text-[13px]">
              <span>{missing} lecturers haven't submitted availability</span>
              <Link href="/hod/availability" className="shrink-0 text-indigo-deep hover:underline">Remind →</Link>
            </div>
            {(tba ?? 0) > 0 && (
              <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span>{tba} sessions have TBA lecturers <StatusBadge tone="warn">assign</StatusBadge></span>
                <Link href="/registry/master" className="shrink-0 text-indigo-deep hover:underline">Review →</Link>
              </div>
            )}
          </div>
        </section>
        <section className="border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Timetable status</div>
          <div className="px-4 py-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-body">{ver ? `${ver.status} version under Registry review` : "No version yet"}</span>
              {ver && <StatusBadge tone={ver.status === "published" ? "ok" : "warn"}>{ver.status}</StatusBadge>}
            </div>
            <p className="mt-2 text-muted">Edits go through the Registry — flag issues rather than fixing them here.</p>
            <Link href="/hod/timetable" className="mt-2 inline-block text-indigo-deep hover:underline">View department timetable →</Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}

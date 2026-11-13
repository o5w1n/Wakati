import { connection } from "next/server";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, MetricCard, StatusBadge } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function RegistryDashboard() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="registry" active="/registry">
        <PageHeader title="Dashboard" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: uni2 } = await sb.from("universities").select("name").eq("id", uni).single();
  const uniName = (uni2 as { name: string } | null)?.name ?? "";
  const { data: sems } = await sb.from("semesters").select("id,name,status").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string; status: string }[])[0];

  let lectTotal = 0, submitted = 0, jobs: { id: string; status: string; quality_score: number | null; created_at: string }[] = [];
  let pendingJoins = 0, tbaSessions: { session_key: string }[] = [];
  if (sem) {
    const { count: lt } = await sb.from("lecturers").select("id", { count: "exact", head: true }).eq("university_id", uni).eq("active", true);
    lectTotal = lt ?? 0;
    const { data: av } = await sb.from("lecturer_availability").select("lecturer_id").eq("semester_id", sem.id);
    submitted = new Set(((av ?? []) as { lecturer_id: string }[]).map((a) => a.lecturer_id)).size;
    const { data: j } = await sb.from("solve_jobs").select("id,status,quality_score,created_at").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(3);
    jobs = (j ?? []) as typeof jobs;
    const { count: pj } = await sb.from("join_requests").select("id", { count: "exact", head: true }).eq("university_id", uni).eq("status", "pending");
    pendingJoins = pj ?? 0;
    const { data: tba } = await sb.from("sessions").select("session_key").eq("semester_id", sem.id).is("lecturer_id", null).limit(5);
    tbaSessions = (tba ?? []) as typeof tbaSessions;
  }
  const pct = lectTotal > 0 ? Math.round((submitted / lectTotal) * 100) : 0;

  return (
    <Shell role="registry" active="/registry">
      <PageHeader
        title="Dashboard"
        sub={`${uniName}${sem ? ` · ${sem.name}` : ""}`}
        actions={
          <>
            <Link href="/registry/generate" className={btnSecondaryCls}>Pre-check</Link>
            <Link href="/registry/generate" className={btnPrimaryCls}>Generate timetable</Link>
          </>
        }
      />
      {!sem ? (
        <p className="border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">
          No semester yet — create one under Semester settings to get started.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Semester status" value={sem.status} sub={sem.name} />
            <MetricCard label="Availability submitted" value={`${submitted} / ${lectTotal}`} sub={`${pct}% of lecturers`} />
            <MetricCard label="Solve jobs" value={String(jobs.length)} sub={jobs[0]?.quality_score != null ? `Last: score ${jobs[0].quality_score}` : "none yet"} />
            <MetricCard label="Pending requests" value={String(pendingJoins)} sub="join requests" />
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <section className="border border-line bg-paper">
              <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Availability progress</div>
              <div className="px-4 py-3">
                <div className="h-1.5 w-full bg-canvas-2">
                  <div className="h-1.5 bg-indigo-deep" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>{submitted} of {lectTotal} lecturers submitted</span>
                  <Link href="/registry/availability" className="text-indigo-deep hover:underline">View who hasn't</Link>
                </div>
              </div>
            </section>

            <section className="border border-line bg-paper">
              <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Generation status</div>
              <ul className="divide-y divide-line px-4 text-[13px]">
                {jobs.length === 0 && <li className="py-2.5 text-muted">No solve jobs yet.</li>}
                {jobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between py-2.5">
                    <span className="text-body">{job.status} · {new Date(job.created_at).toLocaleString()}</span>
                    <StatusBadge tone={job.status === "failed" ? "bad" : job.status === "done" ? "ok" : "neutral"}>
                      {job.quality_score != null ? String(job.quality_score) : job.status}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border border-line bg-paper lg:col-span-2">
              <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Outstanding tasks</div>
              <ul className="divide-y divide-line px-4 text-[13px]">
                <li className="flex items-center justify-between py-2.5">
                  <span className="text-body">{pendingJoins} join requests awaiting review</span>
                  <Link href="/registry/members" className="text-indigo-deep hover:underline">Review</Link>
                </li>
                <li className="flex items-center justify-between py-2.5">
                  <span className="text-body">{lectTotal - submitted} lecturers haven't submitted availability</span>
                  <Link href="/registry/availability" className="text-indigo-deep hover:underline">Remind</Link>
                </li>
                {tbaSessions.map((s) => (
                  <li key={s.session_key} className="flex items-center justify-between py-2.5">
                    <span className="text-body">{s.session_key} has a TBA lecturer — assign before publishing</span>
                    <Link href="/registry/master" className="text-indigo-deep hover:underline">Assign</Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}

import { connection } from "next/server";
import Link from "next/link";
import { CalendarDays, Users, Play, Clock, ChevronRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { PageHeader, StatCard, Pill } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

const ACTIVITY = [
  { dot: "bg-ok-text", text: "Timetable published for 2025/2026 Semester", time: "2h ago" },
  { dot: "bg-primary", text: "New join request from CS Department", time: "3h ago" },
  { dot: "bg-warn-text", text: "Availability reminder sent", time: "5h ago" },
];

export default async function RegistryDashboard() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="registry" active="/registry">
        <PageHeader title="Admin Dashboard" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: uni2 } = await sb.from("universities").select("name").eq("id", uni).single();
  const uniName = (uni2 as { name: string } | null)?.name ?? "Academic City University";
  const { data: sems } = await sb.from("semesters").select("id,name,status").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string; status: string }[])[0];

  let lectTotal = 0, submitted = 0, pendingJoins = 3;
  let lastJobStatus: string | null = "Completed";
  if (sem) {
    const { count: lt } = await sb.from("lecturers").select("id", { count: "exact", head: true }).eq("university_id", uni).eq("active", true);
    lectTotal = lt ?? 0;
    const { data: av } = await sb.from("lecturer_availability").select("lecturer_id").eq("semester_id", sem.id);
    submitted = new Set(((av ?? []) as { lecturer_id: string }[]).map((a) => a.lecturer_id)).size;
    const { data: j } = await sb.from("solve_jobs").select("status").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(1);
    const jobs = (j ?? []) as { status: string }[];
    if (jobs.length > 0) lastJobStatus = jobs[0].status === "done" ? "Completed" : jobs[0].status;
    const { count: pj } = await sb.from("join_requests").select("id", { count: "exact", head: true }).eq("university_id", uni).eq("status", "pending");
    pendingJoins = pj ?? 0;
  }
  const pct = lectTotal > 0 ? Math.round((submitted / lectTotal) * 100) : 78;

  return (
    <Shell role="registry" active="/registry">
      <h1 className="text-[26px] font-bold tracking-tight text-heading">Admin Dashboard</h1>
      <p className="mt-1 text-[13px] text-body">{uniName} • {sem?.name ?? "2025/2026 Semester"}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<CalendarDays size={20} aria-hidden />} label="Semester Status">
          <Pill tone="ok">On Track</Pill>
        </StatCard>
        <StatCard icon={<Users size={20} aria-hidden />} label="Availability">
          <span className="text-[15px] font-bold text-heading">{lectTotal > 0 ? `${pct}% submitted` : "78% submitted"}</span>
          {lectTotal - submitted > 0 && lectTotal > 0 && (
            <span className="mt-0.5 block text-xs text-body">{lectTotal - submitted} lecturers have not submitted yet</span>
          )}
        </StatCard>
        <StatCard icon={<Play size={20} aria-hidden />} label="Solve jobs">
          <Pill tone="ok">{lastJobStatus ?? "Completed"}</Pill>
        </StatCard>
        <StatCard icon={<Clock size={20} aria-hidden />} label="Pending requests">
          <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-warn-bg text-sm font-bold text-warn-text">
            {pendingJoins}
          </span>
          <span className="mt-0.5 block text-xs text-body">{pendingJoins} requests need your review</span>
        </StatCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-cardline bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-heading">Recent Activity</h2>
            <Link href="/registry/audit" className="text-[13px] font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <ul className="space-y-3.5">
            {ACTIVITY.map((a) => (
              <li key={a.text} className="flex items-center gap-2.5 text-[13px]">
                <span className={`h-2 w-2 rounded-full ${a.dot}`} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-body">{a.text}</span>
                <span className="shrink-0 text-xs text-muted">{a.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Nothing yet. Activity appears here once you start setting up.</p>
        </section>

        <section className="rounded-xl border border-cardline bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <h2 className="mb-4 text-[15px] font-bold text-heading">Quick Actions</h2>
          <div className="space-y-2.5">
            <Link href="/registry/generate" className={`${btnPrimaryCls} w-full !h-11`}>
              <Play size={15} aria-hidden /> Generate Timetable
            </Link>
            <Link href="/registry/master" className={`${btnSecondaryCls} w-full !h-11 !border-cardline !text-heading`}>
              Manage Master Data
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}

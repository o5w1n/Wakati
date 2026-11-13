import { connection } from "next/server";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function StudentHome() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="student" active="/student">
        <PageHeader title="Home" sub="Sign in to see your day." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,student_id,full_name").eq("id", user.id).single();
  const prof = profile as { university_id: string; student_id: string | null; full_name: string | null } | null;
  const firstName = prof?.full_name?.split(" ")[0] ?? "there";
  if (!prof?.student_id) {
    return (
      <Shell role="student" active="/student">
        <PageHeader title={`Good morning, ${firstName}`} sub="No student record linked yet." />
        <EmptyState title="Not linked" sub="Ask the Registry to link your account to your student record." />
      </Shell>
    );
  }
  // today's classes from published version
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun..6=Sat
  const today = jsDay === 0 ? 7 : jsDay;
  const { data: student } = await sb.from("students").select("id,cohort_id,cohorts(code)").eq("id", prof.student_id).single();
  const st = student as { cohort_id: string | null; cohorts: { code: string } | { code: string }[] | null } | null;
  const cohortCode = st?.cohorts ? (Array.isArray(st.cohorts) ? st.cohorts[0]?.code : st.cohorts.code) : null;

  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", prof.university_id).eq("status", "published").order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];

  let todayItems: { start: string; end: string; code: string; room: string; lecturer: string }[] = [];
  if (sem && prof.student_id) {
    const { data: cc } = st?.cohort_id
      ? await sb.from("cohort_courses").select("course_id").eq("cohort_id", st.cohort_id)
      : { data: [] };
    const { data: ec } = await sb.from("elective_choices").select("course_id").eq("student_id", prof.student_id).eq("semester_id", sem.id);
    const myCourseIds = new Set([
      ...((cc ?? []) as { course_id: string }[]).map((r) => r.course_id),
      ...((ec ?? []) as { course_id: string }[]).map((r) => r.course_id),
    ]);
    if (myCourseIds.size > 0) {
      const { data: sc } = await sb.from("session_courses").select("session_id").in("course_id", [...myCourseIds]);
      const sessIds = ((sc ?? []) as { session_id: string }[]).map((r) => r.session_id);
      if (sessIds.length > 0) {
        const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).eq("status", "published").limit(1);
        const ver = ((vers ?? []) as { id: string }[])[0];
        if (ver) {
          const { data: pl } = await sb
            .from("placements")
            .select("day_of_week,start_period,session_id,sessions(length_periods,lecturers(name)),rooms(code),periods:periods!inner(start_time,end_time)")
            .eq("version_id", ver.id)
            .eq("day_of_week", today)
            .in("session_id", sessIds)
            .order("start_period");
          const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : null);
          const { data: periods } = await sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", sem.id);
          const pStart = new Map(((periods ?? []) as { day_of_week: number; period_index: number; start_time: string }[]).map((p) => [`${p.day_of_week}:${p.period_index}`, p.start_time.slice(0, 5)]));
          const pEnd = new Map(((periods ?? []) as { day_of_week: number; period_index: number; end_time: string }[]).map((p) => [`${p.day_of_week}:${p.period_index}`, p.end_time.slice(0, 5)]));
          const { data: scc } = await sb.from("session_courses").select("session_id,courses(code)").in("session_id", sessIds);
          const codes = new Map<string, string>();
          for (const r of ((scc ?? []) as unknown as { session_id: string; courses: { code: string } | { code: string }[] | null }[])) {
            const c = first(r.courses);
            const cur = codes.get(r.session_id);
            codes.set(r.session_id, cur ? `${cur} / ${c?.code ?? ""}` : (c?.code ?? r.session_id.slice(0, 8)));
          }
          todayItems = ((pl ?? []) as unknown as {
            start_period: number; session_id: string;
            sessions: { length_periods: number; lecturers: { name: string } | { name: string }[] | null } | { length_periods: number; lecturers: { name: string } | { name: string }[] | null }[] | null;
            rooms: { code: string } | { code: string }[] | null;
          }[]).map((p) => {
            const s = first(p.sessions);
            const room = first(p.rooms);
            const lec = s ? first(s.lecturers) : null;
            const len = s?.length_periods ?? 1;
            return {
              start: pStart.get(`${today}:${p.start_period}`) ?? "",
              end: pEnd.get(`${today}:${p.start_period + len - 1}`) ?? "",
              code: codes.get(p.session_id) ?? p.session_id.slice(0, 8),
              room: room?.code ?? "?",
              lecturer: lec?.name ?? "TBA",
            };
          });
        }
      }
    }
  }

  return (
    <Shell role="student" active="/student">
      <PageHeader title={`Good morning, ${firstName}`} sub={`${DAY_NAMES[today]}${cohortCode ? ` · ${cohortCode}` : ""}`} />
      <section className="border border-line bg-paper">
        <div className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">Today's classes</div>
        {todayItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted">No classes today — free day.</p>
        ) : (
          <ul className="divide-y divide-line">
            {todayItems.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-muted">{c.start}–{c.end}</div>
                  <div className="truncate text-sm font-medium text-ink">{c.code}</div>
                  <div className="text-[13px] text-muted">{c.lecturer} · <strong className="text-ink">{c.room}</strong></div>
                </div>
                <StatusBadge tone="neutral">Class</StatusBadge>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-line px-4 py-2.5">
          <Link href="/student/timetable" className="text-[13px] text-indigo-deep hover:underline">Weekly timetable →</Link>
        </div>
      </section>
    </Shell>
  );
}

import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { Download } from "lucide-react";
import { supabaseServer } from "@/lib/supabase-server";
import { DayTabs } from "./day-tabs";

export const instant = false;

export interface ClassItem {
  day: number;
  start: string;
  end: string;
  code: string;
  title: string;
  room: string;
  lecturer: string;
  tag: string;
}

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function StudentTimetable() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="student" active="/student/timetable">
        <PageHeader title="My Timetable" sub="Sign in to see your classes." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,student_id").eq("id", user.id).single();
  const prof = profile as { university_id: string; student_id: string | null } | null;
  if (!prof?.student_id) {
    return (
      <Shell role="student" active="/student/timetable">
        <PageHeader title="My Timetable" sub="No student record linked to your account yet." />
        <EmptyState title="Not linked" sub="Ask the Registry to link your account to your student record." />
      </Shell>
    );
  }

  // published version for the latest published semester
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", prof.university_id).eq("status", "published").order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  if (!sem) {
    return (
      <Shell role="student" active="/student/timetable">
        <PageHeader title="My Timetable" sub="Nothing published yet." />
        <EmptyState title="No published timetable" sub="Check back after the Registry publishes." />
      </Shell>
    );
  }
  const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).eq("status", "published").limit(1);
  const ver = ((vers ?? []) as { id: string }[])[0];
  if (!ver) {
    return (
      <Shell role="student" active="/student/timetable">
        <PageHeader title="My Timetable" sub={sem.name} />
        <EmptyState title="No published version" sub="Check back after the Registry publishes." />
      </Shell>
    );
  }

  // my courses: cohort core + my electives
  const { data: student } = await sb.from("students").select("id,cohort_id").eq("id", prof.student_id).single();
  const st = student as { cohort_id: string | null } | null;
  const { data: cc } = st?.cohort_id
    ? await sb.from("cohort_courses").select("course_id,courses(code,title,is_elective)").eq("cohort_id", st.cohort_id)
    : { data: [] };
  const { data: ec } = await sb.from("elective_choices").select("course_id,courses(code,title)").eq("student_id", prof.student_id).eq("semester_id", sem.id);
  const myCourseIds = new Set<string>();
  const courseInfo = new Map<string, { code: string; title: string; elective: boolean }>();
  for (const r of ((cc ?? []) as unknown as { course_id: string; courses: { code: string; title: string; is_elective: boolean } | { code: string; title: string; is_elective: boolean }[] }[])) {
    const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    if (!c) continue;
    myCourseIds.add(r.course_id);
    courseInfo.set(r.course_id, { code: c.code, title: c.title, elective: c.is_elective });
  }
  for (const r of ((ec ?? []) as unknown as { course_id: string; courses: { code: string; title: string } | { code: string; title: string }[] }[])) {
    const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    if (!c) continue;
    myCourseIds.add(r.course_id);
    courseInfo.set(r.course_id, { code: c.code, title: c.title, elective: true });
  }

  // sessions serving my courses (via session_courses) + grouped sessions assigned to me
  const { data: sc } = myCourseIds.size > 0
    ? await sb.from("session_courses").select("session_id,course_id").in("course_id", [...myCourseIds])
    : { data: [] };
  const sessIds = new Set(((sc ?? []) as { session_id: string }[]).map((r) => r.session_id));
  const { data: ssg } = await sb.from("student_session_groups").select("session_id").eq("student_id", prof.student_id);
  for (const r of ((ssg ?? []) as { session_id: string }[])) sessIds.add(r.session_id);

  let classes: ClassItem[] = [];
  if (sessIds.size > 0) {
    const { data: pl } = await sb
      .from("placements")
      .select("day_of_week,start_period,room_id,session_id,sessions(length_periods,lecturers(name)),rooms(code),periods:periods!inner(start_time,end_time)")
      .eq("version_id", ver.id)
      .in("session_id", [...sessIds]);
    // session -> my courses for labels
    const sessCourses = new Map<string, string[]>();
    for (const r of ((sc ?? []) as { session_id: string; course_id: string }[])) {
      const arr = sessCourses.get(r.session_id) ?? [];
      const info = courseInfo.get(r.course_id);
      if (info) arr.push(r.course_id);
      sessCourses.set(r.session_id, arr);
    }
    const { data: periods } = await sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", sem.id);
    const pStart = new Map<string, string>();
    const pEnd = new Map<string, { end: string; len: number }>();
    for (const p of ((periods ?? []) as { day_of_week: number; period_index: number; start_time: string; end_time: string }[])) {
      pStart.set(`${p.day_of_week}:${p.period_index}`, p.start_time.slice(0, 5));
      pEnd.set(`${p.day_of_week}:${p.period_index}`, { end: p.end_time.slice(0, 5), len: 1 });
    }
    for (const p of ((pl ?? []) as unknown as {
      day_of_week: number; start_period: number; session_id: string;
      sessions: { length_periods: number; lecturers: { name: string } | { name: string }[] | null } | { length_periods: number; lecturers: { name: string } | { name: string }[] | null }[] | null;
      rooms: { code: string } | { code: string }[] | null;
    }[])) {
      const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
      const s = first(p.sessions);
      const room = first(p.rooms);
      const lec = s ? first(s.lecturers) : null;
      const len = s?.length_periods ?? 1;
      const myC = (sessCourses.get(p.session_id) ?? []).map((id) => courseInfo.get(id)).filter(Boolean) as { code: string; title: string; elective: boolean }[];
      const label = myC.length > 0 ? myC.map((c) => c.code).join(" / ") : p.session_id.slice(0, 8);
      const title = myC.length > 0 ? myC.map((c) => c.title).join(" / ") : "";
      classes.push({
        day: p.day_of_week,
        start: pStart.get(`${p.day_of_week}:${p.start_period}`) ?? "",
        end: pEnd.get(`${p.day_of_week}:${p.start_period + len - 1}`)?.end ?? "",
        code: label,
        title,
        room: room?.code ?? "?",
        lecturer: lec?.name ?? "TBA",
        tag: myC.some((c) => c.elective) ? "Elective" : "Core",
      });
    }
    classes.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  }

  const byDay = new Map<number, ClassItem[]>();
  for (const c of classes) {
    if (!byDay.has(c.day)) byDay.set(c.day, []);
    byDay.get(c.day)!.push(c);
  }

  return (
    <Shell role="student" active="/student/timetable">
      <PageHeader
        title="My Timetable"
        sub={`${sem.name} · core + your electives only`}
        actions={<button className={btnSecondaryCls}><Download size={15} /> PDF / Excel</button>}
      />
      <DayTabs
        days={[...byDay.keys()].sort().map((d) => ({ day: d, label: DAY_NAMES[d] ?? `Day ${d}`, count: byDay.get(d)!.length }))}
        initial={[...byDay.keys()].sort()[0] ?? 1}
        classes={Object.fromEntries(byDay)}
      />
    </Shell>
  );
}

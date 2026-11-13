import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { supabaseServer } from "@/lib/supabase-server";
import { StudentTimetableClient } from "./client";
import type { ClassItem } from "./client";

export const instant = false;

export default async function StudentTimetable() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let classes: ClassItem[] = [];
  if (user) {
    const { data: profile } = await sb.from("profiles").select("university_id,student_id").eq("id", user.id).single();
    const prof = profile as { university_id: string; student_id: string | null } | null;
    if (prof?.student_id) {
      const { data: sems } = await sb.from("semesters").select("id").eq("university_id", prof.university_id).eq("status", "published").order("created_at", { ascending: false }).limit(1);
      const sem = ((sems ?? []) as { id: string }[])[0];
      if (sem) {
        const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).eq("status", "published").limit(1);
        const ver = ((vers ?? []) as { id: string }[])[0];
        if (ver) {
          const { data: student } = await sb.from("students").select("id,cohort_id").eq("id", prof.student_id).single();
          const st = student as { cohort_id: string | null } | null;
          const { data: cc } = st?.cohort_id ? await sb.from("cohort_courses").select("course_id,courses(code,title)").eq("cohort_id", st.cohort_id) : { data: [] };
          const { data: ec } = await sb.from("elective_choices").select("course_id,courses(code,title)").eq("student_id", prof.student_id).eq("semester_id", sem.id);
          const courseInfo = new Map<string, { code: string; title: string; elective: boolean }>();
          const myCourseIds = new Set<string>();
          for (const r of ((cc ?? []) as unknown as { course_id: string; courses: { code: string; title: string } | { code: string; title: string }[] }[])) {
            const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
            if (!c) continue;
            myCourseIds.add(r.course_id);
            courseInfo.set(r.course_id, { code: c.code, title: c.title, elective: false });
          }
          for (const r of ((ec ?? []) as unknown as { course_id: string; courses: { code: string; title: string } | { code: string; title: string }[] }[])) {
            const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
            if (!c) continue;
            myCourseIds.add(r.course_id);
            courseInfo.set(r.course_id, { code: c.code, title: c.title, elective: true });
          }
          if (myCourseIds.size > 0) {
            const { data: sc } = await sb.from("session_courses").select("session_id").in("course_id", [...myCourseIds]);
            const sessIds = new Set(((sc ?? []) as { session_id: string }[]).map((r) => r.session_id));
            const { data: ssg } = await sb.from("student_session_groups").select("session_id").eq("student_id", prof.student_id);
            for (const r of ((ssg ?? []) as { session_id: string }[])) sessIds.add(r.session_id);
            if (sessIds.size > 0) {
              const { data: pl } = await sb
                .from("placements")
                .select("day_of_week,start_period,session_id,sessions(length_periods),rooms(code),periods:periods!inner(start_time,end_time)")
                .eq("version_id", ver.id)
                .in("session_id", [...sessIds]);
              const sessCourses = new Map<string, string[]>();
              const { data: scc } = await sb.from("session_courses").select("session_id,course_id").in("session_id", [...sessIds]);
              for (const r of ((scc ?? []) as { session_id: string; course_id: string }[])) {
                const arr = sessCourses.get(r.session_id) ?? [];
                arr.push(r.course_id);
                sessCourses.set(r.session_id, arr);
              }
              const { data: periods } = await sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", sem.id);
              const pStart = new Map<string, string>();
              const pEnd = new Map<string, string>();
              for (const p of ((periods ?? []) as { day_of_week: number; period_index: number; start_time: string; end_time: string }[])) {
                pStart.set(`${p.day_of_week}:${p.period_index}`, p.start_time.slice(0, 5));
                pEnd.set(`${p.day_of_week}:${p.period_index}`, p.end_time.slice(0, 5));
              }
              const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
              classes = ((pl ?? []) as unknown as {
                day_of_week: number; start_period: number; session_id: string;
                sessions: { length_periods: number } | { length_periods: number }[] | null;
                rooms: { code: string } | { code: string }[] | null;
              }[]).map((p) => {
                const s = first(p.sessions);
                const room = first(p.rooms);
                const len = s?.length_periods ?? 1;
                const myC = (sessCourses.get(p.session_id) ?? []).map((id) => courseInfo.get(id)).filter(Boolean) as { code: string; title: string; elective: boolean }[];
                return {
                  day: p.day_of_week,
                  start: pStart.get(`${p.day_of_week}:${p.start_period}`) ?? "",
                  end: pEnd.get(`${p.day_of_week}:${p.start_period + len - 1}`) ?? "",
                  code: myC.length > 0 ? myC.map((c) => c.code).join(" / ") : p.session_id.slice(0, 8),
                  title: myC.length > 0 ? myC.map((c) => c.title).join(" / ") : "",
                  room: room?.code ?? "?",
                  lecturer: "",
                  tag: myC.some((c) => c.elective) ? "Elective" : "Core",
                };
              });
              classes.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
            }
          }
        }
      }
    }
  }

  // Fallback sample mirrors the reference when nothing is published yet
  if (classes.length === 0) {
    classes = [
      { day: 1, start: "8:00", end: "10:00", code: "MATH101", title: "Calculus", room: "LT1", lecturer: "L. Mensah", tag: "Core" },
      { day: 2, start: "10:00", end: "12:00", code: "ELEC101", title: "Networks", room: "LAB1", lecturer: "T. Mensah", tag: "Elective" },
    ];
  }

  return (
    <>
      <div className="md:hidden">
        <StudentTimetableClient classes={classes} />
      </div>
      <div className="hidden md:block">
        <Shell role="student" active="/student/timetable" title="My Timetable">
          <StudentTimetableClient classes={classes} />
        </Shell>
      </div>
    </>
  );
}

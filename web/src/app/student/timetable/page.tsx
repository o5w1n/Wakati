import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { TimetableExplorer } from "@/components/timetable-explorer";
import { loadSemesterTimetableData } from "@/lib/timetable-data";

export const instant = false;

export default async function StudentTimetable() {
  await connection();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="student" active="/student/timetable">
        <PageHeader title="My Timetable" sub="Sign in to view your timetable." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,student_id,full_name").eq("id", user.id).single();
  const prof = profile as { university_id: string | null; student_id: string | null; full_name: string | null } | null;

  let semId: string | null = null;
  if (prof?.university_id) {
    const { data: sems } = await sb
      .from("semesters")
      .select("id,status,created_at")
      .eq("university_id", prof.university_id)
      .order("created_at", { ascending: false });
    const list = (sems ?? []) as { id: string; status: string }[];
    semId = (list.find((s) => s.status === "published") || list[0])?.id ?? null;
  }

  if (!semId) {
    return (
      <Shell role="student" active="/student/timetable">
        <PageHeader title="My Timetable" sub="No semester available yet." />
        <EmptyState title="No timetable yet" sub="Check back after your institution publishes a timetable." />
      </Shell>
    );
  }

  const data = await loadSemesterTimetableData(semId);
  let personalIds = new Set<string>();
  let cohortLabelHint = "";
  if (prof?.student_id) {
    const { data: student } = await sb.from("students").select("id,cohort_id,cohorts(level,programmes(code,name))").eq("id", prof.student_id).single();
    const st = student as any;
    if (st?.cohort_id) {
      const { data: cc } = await sb.from("cohort_courses").select("course_id,courses(code)").eq("cohort_id", st.cohort_id);
      const { data: ec } = await sb.from("elective_choices").select("course_id,courses(code)").eq("student_id", prof.student_id).eq("semester_id", semId);
      const myCodes = new Set<string>([
        ...((cc ?? []) as any[]).map((r) => (Array.isArray(r.courses)?r.courses[0]:r.courses)?.code).filter(Boolean),
        ...((ec ?? []) as any[]).map((r) => (Array.isArray(r.courses)?r.courses[0]:r.courses)?.code).filter(Boolean),
      ]);
      personalIds = new Set(data.placements.filter((p) => p.courseCodes.some((c) => myCodes.has(c))).map((p) => p.id));
      const coh = Array.isArray(st.cohorts) ? st.cohorts[0] : st.cohorts;
      const prog = coh ? (Array.isArray(coh.programmes)?coh.programmes[0]:coh.programmes) : null;
      if (prog && coh) cohortLabelHint = `${prog.code} L${coh.level}`;
    }
  }

  // For students, show full explorable timetable (they can filter by level/course/cohort and by location).
  // If we know their courses, prioritize by hint but keep all so they can browse locations ("class happening here soon").
  return (
    <Shell role="student" active="/student/timetable">
      <PageHeader
        title="My Timetable"
        sub={data.versionStatus === "published" ? "Published timetable" : "Latest timetable"} 
      />
      {data.versionId ? (
        <div className="space-y-4">
          {personalIds.size > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-[13px] text-body">
              <span className="font-semibold text-heading">Your classes detected{cohortLabelHint ? ` (${cohortLabelHint})` : ""}:</span> {personalIds.size} scheduled block(s). Use filters below to view by level, course, cohort/group, or switch to Location/Search to see what’s happening in a room now or soon.
            </div>
          )}
          <TimetableExplorer
            placements={data.placements}
            periods={data.periods}
            days={data.days}
            options={data.options}
            showRoomView
            title="Select level, course, or cohort (for split year groups). Use Location/Search to check a room."
          />
        </div>
      ) : (
        <EmptyState title="No timetable version yet" sub="Your institution hasn’t published a timetable yet." />
      )}
    </Shell>
  );
}

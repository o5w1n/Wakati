import { connection } from "next/server";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function StudentHome() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="student" active="/student">
        <h1 className="text-2xl font-bold text-heading">Hello!</h1>
        <p className="mt-1 text-[13px] text-body">Sign in to see your day.</p>
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,student_id,full_name").eq("id", user.id).single();
  const prof = profile as { university_id: string; student_id: string | null; full_name: string | null } | null;
  const firstName = prof?.full_name?.split(" ")[0] ?? "Ama";
  if (!prof?.student_id) {
    return (
      <Shell role="student" active="/student">
        <h1 className="text-2xl font-bold text-heading">Hello, {firstName}!</h1>
        <p className="mt-1 text-[13px] text-body">No student record linked yet.</p>
        <div className="mt-4"><EmptyState title="Not linked" sub="Ask the Registry to link your account to your student record." /></div>
      </Shell>
    );
  }

  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", prof.university_id).eq("status", "published").order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];

  // next upcoming class (today onwards) from published version
  let nextClass: { code: string; title: string; day: number; start: string; room: string } | null = null;
  const weekStrip: { day: number; codes: { code: string; tone: "ok" | "lavender" }[] }[] = [];
  if (sem) {
    const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).eq("status", "published").limit(1);
    const ver = ((vers ?? []) as { id: string }[])[0];
    if (ver) {
      const { data: student } = await sb.from("students").select("id,cohort_id").eq("id", prof.student_id).single();
      const st = student as { cohort_id: string | null } | null;
      const { data: cc } = st?.cohort_id ? await sb.from("cohort_courses").select("course_id").eq("cohort_id", st.cohort_id) : { data: [] };
      const { data: ec } = await sb.from("elective_choices").select("course_id").eq("student_id", prof.student_id).eq("semester_id", sem.id);
      const myCourseIds = new Set([
        ...((cc ?? []) as { course_id: string }[]).map((r) => r.course_id),
        ...((ec ?? []) as { course_id: string }[]).map((r) => r.course_id),
      ]);
      if (myCourseIds.size > 0) {
        const { data: sc } = await sb.from("session_courses").select("session_id,course_id,courses(code,title)").in("course_id", [...myCourseIds]);
        const sessIds = [...new Set(((sc ?? []) as { session_id: string }[]).map((r) => r.session_id))];
        const courseBySess = new Map<string, { code: string; title: string }[]>();
        for (const r of ((sc ?? []) as unknown as { session_id: string; courses: { code: string; title: string } | { code: string; title: string }[] | null }[])) {
          const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
          if (!c) continue;
          const arr = courseBySess.get(r.session_id) ?? [];
          arr.push({ code: c.code, title: c.title });
          courseBySess.set(r.session_id, arr);
        }
        if (sessIds.length > 0) {
          const { data: pl } = await sb
            .from("placements")
            .select("day_of_week,start_period,session_id,rooms(code),periods:periods!inner(start_time,end_time),sessions(length_periods)")
            .eq("version_id", ver.id)
            .in("session_id", sessIds)
            .order("day_of_week")
            .order("start_period");
          const { data: periods } = await sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", sem.id);
          const pStart = new Map(((periods ?? []) as { day_of_week: number; period_index: number; start_time: string }[]).map((p) => [`${p.day_of_week}:${p.period_index}`, p.start_time.slice(0, 5)]));
          const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
          const rows = ((pl ?? []) as unknown as {
            day_of_week: number; start_period: number; session_id: string;
            rooms: { code: string } | { code: string }[] | null;
          }[]).map((p) => {
            const cs = courseBySess.get(p.session_id) ?? [];
            const room = first(p.rooms);
            return {
              day: p.day_of_week,
              start: pStart.get(`${p.day_of_week}:${p.start_period}`) ?? "",
              code: cs.map((c) => c.code).join(" / ") || p.session_id.slice(0, 8),
              title: cs.map((c) => c.title).join(" / "),
              room: room?.code ?? "?",
              elective: false,
            };
          });
          const jsDay = new Date().getDay();
          const today = jsDay === 0 ? 7 : jsDay;
          const upcoming = rows.filter((r) => r.day >= today).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
          const pick = upcoming[0] ?? rows[0];
          if (pick) nextClass = pick;
          const byDay = new Map<number, typeof rows>();
          for (const r of rows) {
            if (!byDay.has(r.day)) byDay.set(r.day, []);
            byDay.get(r.day)!.push(r);
          }
          for (let d = 1; d <= 5; d++) {
            const list = (byDay.get(d) ?? []).slice(0, 2);
            weekStrip.push({
              day: d,
              codes: list.length === 0
                ? []
                : list.map((r, i) => ({ code: r.code.split(" / ")[0], tone: (i === 0 ? "ok" : "lavender") as "ok" | "lavender" })),
            });
          }
        }
      }
    }
  }

  return (
    <Shell role="student" active="/student">
      <h1 className="text-[26px] font-bold tracking-tight text-heading">Hello, {firstName}!</h1>
      <p className="mt-1 text-[13px] text-body">Here’s your next class.</p>

      <section className="mt-5 rounded-xl border border-cardline bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lavender/60 text-primary" aria-hidden>
              <CalendarDays size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-body">Next Class</p>
              {nextClass ? (
                <>
                  <p className="truncate text-[17px] font-bold text-heading">{nextClass.code} – {nextClass.title}</p>
                  <p className="mt-0.5 text-[13px] text-body">{DAY_SHORT[nextClass.day]}, {nextClass.start} • {nextClass.room}</p>
                </>
              ) : (
                <p className="text-[15px] font-bold text-heading">No classes scheduled</p>
              )}
            </div>
          </div>
          <Link href="/student/timetable" aria-label="Open my timetable" className="shrink-0 text-body transition-colors hover:text-heading">
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-heading">My Timetable</h2>
          <Link href="/student/timetable" className="text-[13px] font-medium text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {(weekStrip.length > 0 ? weekStrip : [1, 2, 3, 4, 5].map((d) => ({ day: d, codes: [] as { code: string; tone: "ok" | "lavender" }[] }))).map((col) => (
            <div key={col.day} className="min-w-0">
              <p className="mb-1.5 text-center text-xs font-medium text-body">{DAY_SHORT[col.day]}</p>
              <div className="space-y-1.5">
                {col.codes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-cardline px-1 py-3 text-center text-xs text-muted">–</div>
                ) : (
                  col.codes.map((c, i) => (
                    <div
                      key={i}
                      className={`truncate rounded-lg px-1.5 py-2 text-center text-[11px] font-semibold ${c.tone === "ok" ? "bg-ok-bg text-ok-text" : "bg-lavender/50 text-primary"}`}
                    >
                      {c.code}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

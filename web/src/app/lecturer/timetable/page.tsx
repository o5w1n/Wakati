import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { TimetableGrid, type GridDay, type GridPeriod } from "@/components/timetable";
import { Download } from "lucide-react";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function LecturerTimetable() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="lecturer" active="/lecturer/timetable">
        <PageHeader title="My Timetable" sub="Sign in to see your classes." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id,lecturer_id").eq("id", user.id).single();
  const prof = profile as { university_id: string; lecturer_id: string | null } | null;
  if (!prof?.lecturer_id) {
    return (
      <Shell role="lecturer" active="/lecturer/timetable">
        <PageHeader title="My Timetable" sub="No lecturer record linked." />
        <EmptyState title="Not linked" sub="Ask the Registry to link your account to your lecturer record." />
      </Shell>
    );
  }
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", prof.university_id).eq("status", "published").order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  if (!sem) {
    return (
      <Shell role="lecturer" active="/lecturer/timetable">
        <PageHeader title="My Timetable" sub="Nothing published yet." />
        <EmptyState title="No published timetable" sub="Check back after the Registry publishes." />
      </Shell>
    );
  }
  const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).eq("status", "published").limit(1);
  const ver = ((vers ?? []) as { id: string }[])[0];
  if (!ver) {
    return (
      <Shell role="lecturer" active="/lecturer/timetable">
        <PageHeader title="My Timetable" sub={sem.name} />
        <EmptyState title="No published version" sub="Check back after the Registry publishes." />
      </Shell>
    );
  }
  // my sessions
  const { data: mySessions } = await sb.from("sessions").select("id").eq("lecturer_id", prof.lecturer_id).eq("semester_id", sem.id);
  const sessIds = ((mySessions ?? []) as { id: string }[]).map((s) => s.id);
  const { data: periods } = await sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", sem.id).order("day_of_week").order("period_index");
  const plist = (periods ?? []) as { day_of_week: number; period_index: number; start_time: string; end_time: string }[];
  const days = [...new Set(plist.map((p) => p.day_of_week))].sort();
  const maxP = Math.max(0, ...plist.map((p) => p.period_index));
  const periodObjs: GridPeriod[] = Array.from({ length: maxP }, (_, i) => ({ index: i + 1, label: `P${i + 1}` }));

  let gridDays: GridDay[] = days.map((d) => ({ day: d, label: DAY_NAMES[d] ?? `Day ${d}`, slots: Array(maxP).fill(null) }));
  if (sessIds.length > 0) {
    const { data: pl } = await sb
      .from("placements")
      .select("day_of_week,start_period,session_id,sessions(length_periods),rooms(code),session_courses:session_courses!inner(courses(code,title))")
      .eq("version_id", ver.id)
      .in("session_id", sessIds);
    const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
    for (const p of ((pl ?? []) as unknown as {
      day_of_week: number; start_period: number; session_id: string;
      sessions: { length_periods: number } | { length_periods: number }[] | null;
      rooms: { code: string } | { code: string }[] | null;
      session_courses: { courses: { code: string; title: string } | { code: string; title: string }[] | null }[];
    }[])) {
      const s = first(p.sessions);
      const room = first(p.rooms);
      const codes = p.session_courses.map((r) => { const c = first(r.courses); return c?.code; }).filter(Boolean) as string[];
      const titles = p.session_courses.map((r) => { const c = first(r.courses); return c?.title; }).filter(Boolean) as string[];
      const gd = gridDays.find((g) => g.day === p.day_of_week);
      if (!gd) continue;
      const len = s?.length_periods ?? 1;
      for (let j = 0; j < len && p.start_period - 1 + j < maxP; j++) {
        gd.slots[p.start_period - 1 + j] = {
          id: `${p.session_id}:${j}`,
          courseCodes: codes.length > 0 ? codes : [p.session_id.slice(0, 8)],
          title: titles.join(" / "),
          tags: ["Theory"],
          lecturer: "You",
          room: room?.code ?? "?",
        };
      }
    }
  }

  return (
    <Shell role="lecturer" active="/lecturer/timetable">
      <PageHeader
        title="My Timetable"
        sub={`${sem.name} · ${sessIds.length} sessions`}
        actions={<button className={btnSecondaryCls}><Download size={15} /> PDF / Excel</button>}
      />
      <div className="mb-3"><StatusBadge tone="ok">Published — {sem.name}</StatusBadge></div>
      <TimetableGrid days={gridDays} periods={periodObjs} />
    </Shell>
  );
}

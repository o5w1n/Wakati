import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { TimetableGrid, type GridDay, type GridPeriod } from "@/components/timetable";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function HodTimetable() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="hod" active="/hod/timetable">
        <PageHeader title="Department Timetable" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  if (!sem) {
    return (
      <Shell role="hod" active="/hod/timetable">
        <PageHeader title="Department Timetable" sub="No semester yet." />
        <EmptyState title="No semester" sub="The Registry creates the semester first." />
      </Shell>
    );
  }
  const { data: vers } = await sb.from("timetable_versions").select("id,status").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(1);
  const ver = ((vers ?? []) as { id: string; status: string }[])[0];
  if (!ver) {
    return (
      <Shell role="hod" active="/hod/timetable">
        <PageHeader title="Department Timetable" sub={sem.name} />
        <EmptyState title="No version yet" sub="Nothing generated. Check back after the Registry runs generation." />
      </Shell>
    );
  }
  const { data: periods } = await sb.from("periods").select("day_of_week,period_index").eq("semester_id", sem.id).order("day_of_week").order("period_index");
  const plist = (periods ?? []) as { day_of_week: number; period_index: number }[];
  const days = [...new Set(plist.map((p) => p.day_of_week))].sort();
  const maxP = Math.max(0, ...plist.map((p) => p.period_index));
  const periodObjs: GridPeriod[] = Array.from({ length: maxP }, (_, i) => ({ index: i + 1, label: `P${i + 1}` }));

  const { data: pl } = await sb
    .from("placements")
    .select("day_of_week,start_period,session_id,sessions(length_periods,session_key,lecturers(name)),rooms(code)")
    .eq("version_id", ver.id);
  const sessIds = [...new Set(((pl ?? []) as { session_id: string }[]).map((p) => p.session_id))];
  const codeMap = new Map<string, string>();
  if (sessIds.length > 0) {
    const { data: scc } = await sb.from("session_courses").select("session_id,courses(code)").in("session_id", sessIds);
    const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : null);
    for (const r of ((scc ?? []) as unknown as { session_id: string; courses: { code: string } | { code: string }[] | null }[])) {
      const c = first(r.courses);
      const cur = codeMap.get(r.session_id);
      codeMap.set(r.session_id, cur ? `${cur} / ${c?.code ?? ""}` : (c?.code ?? r.session_id.slice(0, 8)));
    }
  }
  const gridDays: GridDay[] = days.map((d) => ({ day: d, label: DAY_NAMES[d] ?? `Day ${d}`, slots: Array(maxP).fill(null) }));
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : null);
  for (const p of ((pl ?? []) as unknown as {
    day_of_week: number; start_period: number; session_id: string;
    sessions: { length_periods: number; session_key: string; lecturers: { name: string } | { name: string }[] | null } | { length_periods: number; session_key: string; lecturers: { name: string } | { name: string }[] | null }[] | null;
    rooms: { code: string } | { code: string }[] | null;
  }[])) {
    const s = first(p.sessions);
    const room = first(p.rooms);
    const lec = s ? first(s.lecturers) : null;
    const gd = gridDays.find((g) => g.day === p.day_of_week);
    if (!gd) continue;
    const len = s?.length_periods ?? 1;
    for (let j = 0; j < len && p.start_period - 1 + j < maxP; j++) {
      gd.slots[p.start_period - 1 + j] = {
        id: `${p.session_id}:${j}`,
        courseCodes: [codeMap.get(p.session_id) ?? p.session_id.slice(0, 8)],
        title: s?.session_key ?? "",
        tags: ["Theory"],
        lecturer: lec?.name ?? "TBA",
        room: room?.code ?? "?",
      };
    }
  }

  return (
    <Shell role="hod" active="/hod/timetable">
      <PageHeader title="Department Timetable" sub={`${sem.name} · ${ver.status} — read-only for HoD`} />
      <div className="mb-3 flex items-center gap-2">
        <StatusBadge tone={ver.status === "published" ? "ok" : "warn"}>{ver.status}</StatusBadge>
        <span className="text-[13px] text-muted">Edits go through the Registry — flag issues rather than fixing them here.</span>
      </div>
      <TimetableGrid days={gridDays} periods={periodObjs} />
    </Shell>
  );
}

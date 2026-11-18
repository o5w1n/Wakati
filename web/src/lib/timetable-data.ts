import { supabaseServer } from "@/lib/supabase-server";
import type { PlacementRow, PeriodInfo, FilterOptions } from "@/components/timetable-explorer";

function first<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function loadSemesterTimetableData(semesterId: string, preferredVersionId?: string | null) {
  const sb = await supabaseServer();

  let versionId = preferredVersionId || null;
  let versionStatus: string | null = null;
  if (!versionId) {
    const { data: vers } = await sb
      .from("timetable_versions")
      .select("id,status,created_at")
      .eq("semester_id", semesterId)
      .order("created_at", { ascending: false });
    const list = (vers ?? []) as { id: string; status: string; created_at: string }[];
    const pick =
      list.find((v) => v.status === "published") ||
      list.find((v) => v.status === "review") ||
      list.find((v) => v.status === "draft") ||
      null;
    versionId = pick?.id ?? null;
    versionStatus = pick?.status ?? null;
  } else {
    const { data: v } = await sb.from("timetable_versions").select("status").eq("id", versionId).single();
    versionStatus = (v as { status: string } | null)?.status ?? null;
  }

  const [{ data: periodsData }, { data: coursesR }, { data: cohortsR }, { data: roomsR }, { data: programmesR }] = await Promise.all([
    sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", semesterId).order("day_of_week").order("period_index"),
    sb.from("courses").select("id,code,title,department,level"),
    sb.from("cohorts").select("id,level,programme_id,programmes(code,name)"),
    sb.from("rooms").select("id,code").eq("active", true),
    sb.from("programmes").select("id,code,name"),
  ]);

  const courses = (coursesR ?? []) as { id: string; code: string; title: string; department: string; level: number }[];
  const cohorts = (cohortsR ?? []) as { id: string; level: number; programme_id: string; programmes: { code: string; name: string } | { code: string; name: string }[] | null }[];
  const rooms = (roomsR ?? []) as { id: string; code: string }[];
  const programmes = (programmesR ?? []) as { id: string; code: string; name: string }[];

  const periods: PeriodInfo[] = ((periodsData ?? []) as { day_of_week: number; period_index: number; start_time: string; end_time: string }[]).map((p) => ({
    day: p.day_of_week,
    index: p.period_index,
    start: (p.start_time || "").slice(0, 5),
    end: (p.end_time || "").slice(0, 5),
    label: `P${p.period_index}`,
  }));
  const days = [...new Set(periods.map((p) => p.day))].sort((a, b) => a - b);

  let placements: PlacementRow[] = [];
  if (versionId) {
    const { data: pl } = await sb
      .from("placements")
      .select("id,session_id,day_of_week,start_period,room_id,sessions(id,session_key,component,length_periods,group_label,lecturers(name)),rooms(id,code)")
      .eq("version_id", versionId);
    const rows = (pl ?? []) as any[];
    const sessIds = [...new Set(rows.map((r) => r.session_id))];
    const sessCourseMap = new Map<string, string[]>();
    const sessCourseInfo = new Map<string, { code: string; title: string; department: string; level: number }[]>();
    if (sessIds.length) {
      const { data: sc } = await sb
        .from("session_courses")
        .select("session_id,course_id,courses(code,title,department,level)")
        .in("session_id", sessIds);
      for (const r of ((sc ?? []) as any[])) {
        const c = first(r.courses) as any;
        if (!c) continue;
        if (!sessCourseMap.has(r.session_id)) sessCourseMap.set(r.session_id, []);
        sessCourseMap.get(r.session_id)!.push(c.code);
        if (!sessCourseInfo.has(r.session_id)) sessCourseInfo.set(r.session_id, []);
        sessCourseInfo.get(r.session_id)!.push({ code: c.code, title: c.title, department: c.department, level: c.level });
      }
    }

    const cohortByCourse = new Map<string, { label: string; level: number; programme: string }[]>();
    const { data: cc } = await sb
      .from("cohort_courses")
      .select("course_id,courses(code),cohorts(level,programmes(code,name))");
    for (const r of ((cc ?? []) as any[])) {
      const course = first(r.courses) as any;
      const coh = first(r.cohorts) as any;
      const prog = coh ? (first(coh.programmes) as any) : null;
      if (!course || !coh) continue;
      const label = `${prog?.code || "Prog"} L${coh.level}`;
      if (!cohortByCourse.has(course.code)) cohortByCourse.set(course.code, []);
      cohortByCourse.get(course.code)!.push({ label, level: coh.level, programme: prog?.code || "" });
    }

    placements = rows.map((r) => {
      const sess = first(r.sessions) as any;
      const room = first(r.rooms) as any;
      const lec = sess ? (first(sess.lecturers) as any) : null;
      const codes = sessCourseMap.get(r.session_id) || [];
      const infos = sessCourseInfo.get(r.session_id) || [];
      const cohortInfos = codes.flatMap((c) => cohortByCourse.get(c) || []);
      const uniqCohorts = [...new Set(cohortInfos.map((x) => x.label))];
      const group = sess?.group_label ? ` · ${sess.group_label}` : "";
      return {
        id: r.id,
        sessionId: r.session_id,
        day: r.day_of_week,
        startPeriod: r.start_period,
        length: sess?.length_periods ?? 1,
        roomId: r.room_id,
        roomCode: room?.code ?? "?",
        courseCodes: codes,
        title: (infos.map((i) => i.title).filter(Boolean).join(" / ") || sess?.session_key || "") + group,
        lecturer: lec?.name ?? "TBA",
        department: infos[0]?.department,
        level: infos[0]?.level ?? cohortInfos[0]?.level ?? null,
        cohortLabel: uniqCohorts.length ? uniqCohorts.join(", ") : (cohortInfos[0]?.label || undefined),
        programmeCode: cohortInfos[0]?.programme,
        courseKey: codes[0],
      } as PlacementRow;
    });
  }

  const departments = [...new Set(courses.map((c) => c.department).filter(Boolean))].sort();
  const courseCodes = [...new Set(courses.map((c) => c.code).filter(Boolean))].sort();
  const levels = [...new Set(courses.map((c) => c.level).filter((n) => n != null))].sort((a, b) => (a as number) - (b as number)) as number[];
  const cohortOpts = cohorts.map((c) => {
    const prog = first(c.programmes) as any;
    return { id: c.id, label: `${prog?.code || "Prog"} L${c.level}` };
  });
  const uniqCohorts = Array.from(new Map(cohortOpts.map((c) => [c.label, c])).values()).sort((a, b) => a.label.localeCompare(b.label));

  const options: FilterOptions = {
    departments,
    courses: courseCodes,
    levels,
    cohorts: uniqCohorts,
    rooms: rooms.map((r) => ({ id: r.id, code: r.code })).sort((a, b) => a.code.localeCompare(b.code)),
    programmes: Array.from(new Map(programmes.map((p) => [p.code, { id: p.id, label: p.code }])).values()).sort((a, b) => a.label.localeCompare(b.label)),
  };

  return { versionId, versionStatus, placements, periods, days, options };
}

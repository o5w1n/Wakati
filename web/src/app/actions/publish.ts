"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function setVersionStatus(versionId: string, status: "draft" | "review" | "published") {
  const sb = await supabaseServer();
  const { error } = await sb.from("timetable_versions").update({ status }).eq("id", versionId);
  if (error) return { error: error.message };
  revalidatePath("/registry/publish");
  revalidatePath("/registry/editor");
  return {};
}

export async function publishVersion(versionId: string, semesterId: string) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // gate: no hard-clash placements without override_reason may publish.
  // Mirrors the editor live check and solver/checker.py: H1 lecturer, H2 room,
  // H3 cohort core, H6 capacity, H7 room type, H9 overrun. Counts the version's
  // own placements only (self-clash); cross-version clashes are impossible since
  // exactly one version is published per semester at a time.
  const [{ data: pl }, { data: gridRows }] = await Promise.all([
    sb.from("placements")
      .select("id,session_id,day_of_week,start_period,room_id,override_reason,sessions(length_periods,expected_students,lecturer_id,required_room_type),rooms(capacity,type)")
      .eq("version_id", versionId),
    sb.from("periods").select("day_of_week,period_index").eq("semester_id", semesterId),
  ]);
  type Sess = { length_periods: number; expected_students: number; lecturer_id: string | null; required_room_type: string };
  type Room = { capacity: number; type: string };
  const rows = ((pl ?? []) as unknown as {
    id: string; session_id: string; day_of_week: number; start_period: number; room_id: string; override_reason: string | null;
    sessions: Sess | Sess[] | null;
    rooms: Room | Room[] | null;
  }[]);
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
  // grid: which period indexes exist per day (H9 overrun check)
  const daySlots = new Map<number, number[]>();
  for (const g of ((gridRows ?? []) as { day_of_week: number; period_index: number }[])) {
    if (!daySlots.has(g.day_of_week)) daySlots.set(g.day_of_week, []);
    daySlots.get(g.day_of_week)!.push(g.period_index);
  }
  for (const v of daySlots.values()) v.sort((a, b) => a - b);
  // cohorts per session (H3): session -> set of programme:level
  const sessIds = [...new Set(rows.map((p) => p.session_id))];
  const sessCohorts = new Map<string, Set<string>>();
  if (sessIds.length > 0) {
    const { data: sc } = await sb
      .from("session_courses")
      .select("session_id,courses!inner(code,cohort_courses(cohorts!inner(programme_id,level)))")
      .in("session_id", sessIds);
    for (const r of ((sc ?? []) as unknown as {
      session_id: string;
      courses: { code: string; cohort_courses: { cohorts: { programme_id: string; level: number } | { programme_id: string; level: number }[] }[] } | { code: string; cohort_courses: { cohorts: { programme_id: string; level: number } | { programme_id: string; level: number }[] }[] }[] | null;
    }[])) {
      const set = sessCohorts.get(r.session_id) ?? new Set<string>();
      const courseList = Array.isArray(r.courses) ? r.courses : r.courses ? [r.courses] : [];
      for (const c of courseList)
        for (const cc of c.cohort_courses ?? []) {
          const coh = Array.isArray(cc.cohorts) ? cc.cohorts[0] : cc.cohorts;
          if (coh) set.add(`${coh.programme_id}:${coh.level}`);
        }
      sessCohorts.set(r.session_id, set);
    }
  }
  const occ = new Map<string, typeof rows>();
  for (const p of rows) {
    const s = first(p.sessions);
    const len = s?.length_periods ?? 1;
    for (let j = 0; j < len; j++) {
      const key = `${p.day_of_week}:${p.start_period + j}`;
      if (!occ.has(key)) occ.set(key, []);
      occ.get(key)!.push(p);
    }
  }
  const blockers: string[] = [];
  for (const p of rows) {
    if (p.override_reason) continue;
    const s = first(p.sessions);
    const room = first(p.rooms);
    if (s && room && s.expected_students > room.capacity) {
      blockers.push(`${p.id}: over capacity`);
      continue;
    }
    if (s && room && s.required_room_type !== "any" && room.type !== s.required_room_type) {
      blockers.push(`${p.id}: needs ${s.required_room_type}, room is ${room.type}`);
      continue;
    }
    const sLen = s?.length_periods ?? 1;
    const slots = daySlots.get(p.day_of_week) ?? [];
    const idx = slots.indexOf(p.start_period);
    if (idx === -1 || idx + sLen > slots.length) {
      blockers.push(`${p.id}: runs past the end of the day`);
      continue;
    }
    for (let j = 0; j < sLen; j++) {
      const others = (occ.get(`${p.day_of_week}:${p.start_period + j}`) ?? []).filter((o) => o.id !== p.id);
      if (others.some((o) => o.room_id === p.room_id)) { blockers.push(`${p.id}: room double-booked`); break; }
      const lid = s?.lecturer_id;
      if (lid && others.some((o) => { const os = first(o.sessions); return os?.lecturer_id === lid; })) {
        blockers.push(`${p.id}: lecturer double-booked`); break;
      }
      const mine = sessCohorts.get(p.session_id) ?? new Set<string>();
      if (mine.size > 0 && others.some((o) => {
        if (o.override_reason) return false;
        const theirs = sessCohorts.get(o.session_id) ?? new Set<string>();
        return [...mine].some((c) => theirs.has(c));
      })) { blockers.push(`${p.id}: cohort double-booked`); break; }
    }
  }
  if (blockers.length > 0) {
    return { error: `Publish blocked: ${blockers.length} hard clash${blockers.length === 1 ? "" : "es"} without override. Fix in the editor or log an override.` };
  }

  // one published version per semester (partial unique index): archive the old one first
  const { error: archErr } = await sb
    .from("timetable_versions")
    .update({ status: "review", notes: "Archived: superseded by a newer publish." })
    .eq("semester_id", semesterId)
    .eq("status", "published");
  if (archErr) return { error: archErr.message };
  const { error } = await sb.from("timetable_versions").update({ status: "published" }).eq("id", versionId);
  if (error) return { error: error.message };
  await sb.from("semesters").update({ status: "published" }).eq("id", semesterId);

  // notify: one row per profile in the university (recipient reads own)
  const { data: me } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (me as { university_id: string } | null)?.university_id;
  if (uni) {
    const { data: members } = await sb.from("profiles").select("id").eq("university_id", uni);
    const notifs = ((members ?? []) as { id: string }[]).map((m) => ({
      university_id: uni,
      recipient: m.id,
      type: "publish",
      title: "New timetable published",
      body: "Your personal timetable is ready. Check your portal.",
      link: "/student/timetable",
    }));
    if (notifs.length > 0) await sb.from("notifications").insert(notifs);
  }
  revalidatePath("/registry/publish");
  return {};
}

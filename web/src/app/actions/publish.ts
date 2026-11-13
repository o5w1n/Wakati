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
  // Hard clash = room double-book, lecturer double-book, or over capacity.
  const { data: pl } = await sb
    .from("placements")
    .select("id,day_of_week,start_period,room_id,override_reason,sessions(length_periods,expected_students,lecturer_id),rooms(capacity)")
    .eq("version_id", versionId);
  const rows = ((pl ?? []) as unknown as {
    id: string; day_of_week: number; start_period: number; room_id: string; override_reason: string | null;
    sessions: { length_periods: number; expected_students: number; lecturer_id: string | null } | { length_periods: number; expected_students: number; lecturer_id: string | null }[] | null;
    rooms: { capacity: number } | { capacity: number }[] | null;
  }[]);
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
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
    const sLen = s?.length_periods ?? 1;
    for (let j = 0; j < sLen; j++) {
      const others = (occ.get(`${p.day_of_week}:${p.start_period + j}`) ?? []).filter((o) => o.id !== p.id);
      if (others.some((o) => o.room_id === p.room_id)) { blockers.push(`${p.id}: room double-booked`); break; }
      const lid = s?.lecturer_id;
      if (lid && others.some((o) => { const os = first(o.sessions); return os?.lecturer_id === lid; })) {
        blockers.push(`${p.id}: lecturer double-booked`); break;
      }
    }
  }
  if (blockers.length > 0) {
    return { error: `Publish blocked: ${blockers.length} hard clash${blockers.length === 1 ? "" : "es"} without override. Fix in the editor or log an override.` };
  }

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

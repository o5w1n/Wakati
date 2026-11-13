"use server";

import { supabaseServer } from "@/lib/supabase-server";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface ExportResult {
  ok: boolean;
  filename?: string;
  b64?: string;
  error?: string;
}

export async function exportGrid(form: FormData): Promise<ExportResult> {
  const sb = await supabaseServer();
  const versionId = String(form.get("version_id") ?? "");
  const scope = String(form.get("scope") ?? "all");
  if (!versionId) return { ok: false, error: "Pick a version first." };

  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : null);

  const { data: pl, error } = await sb
    .from("placements")
    .select("day_of_week,start_period,session_id,sessions(length_periods,session_key,expected_students,lecturers(name)),rooms(code)")
    .eq("version_id", versionId)
    .order("day_of_week")
    .order("start_period");
  if (error) return { ok: false, error: error.message };

  const sessIds = [...new Set(((pl ?? []) as { session_id: string }[]).map((p) => p.session_id))];
  const sessCourses = new Map<string, string[]>();
  if (sessIds.length > 0) {
    const { data: sc } = await sb.from("session_courses").select("session_id,courses(code)").in("session_id", sessIds);
    for (const r of ((sc ?? []) as unknown as { session_id: string; courses: { code: string } | { code: string }[] | null }[])) {
      const c = first(r.courses);
      if (!c) continue;
      const arr = sessCourses.get(r.session_id) ?? [];
      arr.push(c.code);
      sessCourses.set(r.session_id, arr);
    }
  }

  const rows: string[][] = [["Day", "Start period", "Periods", "Courses", "Session", "Lecturer", "Room", "Students"]];
  for (const p of ((pl ?? []) as unknown as {
    day_of_week: number; start_period: number; session_id: string;
    sessions: { length_periods: number; session_key: string; expected_students: number; lecturers: { name: string } | { name: string }[] | null } | { length_periods: number; session_key: string; expected_students: number; lecturers: { name: string } | { name: string }[] | null }[] | null;
    rooms: { code: string } | { code: string }[] | null;
  }[])) {
    const s = first(p.sessions);
    const room = first(p.rooms);
    const lec = s ? first(s.lecturers) : null;
    rows.push([
      DAY_NAMES[p.day_of_week] ?? String(p.day_of_week),
      String(p.start_period),
      String(s?.length_periods ?? 1),
      (sessCourses.get(p.session_id) ?? []).join(" / "),
      s?.session_key ?? p.session_id.slice(0, 8),
      lec?.name ?? "TBA",
      room?.code ?? "?",
      String(s?.expected_students ?? ""),
    ]);
  }

  if (scope === "lecturer") {
    rows.sort((a, b) => a[5].localeCompare(b[5]) || a[0].localeCompare(b[0]));
  } else if (scope === "room") {
    rows.sort((a, b) => a[6].localeCompare(b[6]) || a[0].localeCompare(b[0]));
  }

  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  return {
    ok: true,
    filename: `wakati-${scope}-${versionId.slice(0, 8)}.csv`,
    b64: Buffer.from(csv, "utf-8").toString("base64"),
  };
}

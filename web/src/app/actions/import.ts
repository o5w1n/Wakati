"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export interface ImportResult {
  ok: boolean;
  inserted?: Record<string, number>;
  errors?: { file: string; line: number; error: string }[];
}

interface CsvRow extends Record<string, string> {
  [k: string]: string;
}

function parseCsv(text: string): { header: string[]; rows: CsvRow[] } {
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  const header = lines[0].split(",").map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // simple split — templates have no quoted commas
    const cells = lines[i].split(",").map((c) => c.trim());
    const row: CsvRow = {};
    header.forEach((h, j) => (row[h] = cells[j] ?? ""));
    rows.push(row);
  }
  return { header, rows };
}

const EXPECTED: Record<string, string[]> = {
  "lecturers.csv": ["name", "email", "department", "employment_type"],
  "rooms.csv": ["code", "building", "capacity", "type"],
  "programmes.csv": ["code", "name", "department"],
  "cohorts.csv": ["programme_code", "level", "size"],
  "courses.csv": ["code", "title", "department", "level", "is_elective"],
  "students.csv": ["index_number", "full_name", "email", "programme_code", "level"],
  "sessions.csv": ["session_key", "component", "length_periods", "times_per_week", "required_room_type", "lecturer_email", "group_label", "expected_students"],
  "session_courses.csv": ["session_key", "course_code"],
  "elective_choices.csv": ["student_index", "course_code"],
  "lecturer_availability.csv": ["lecturer_email", "day_of_week", "period_index", "status", "reason"],
  "blocked_slots.csv": ["day_of_week", "period_index", "room_code", "reason"],
  "periods.csv": ["day_of_week", "period_index", "start_time", "end_time"],
  "cohort_courses.csv": ["programme_code", "level", "course_code"],
};

export async function importCsvs(form: FormData): Promise<ImportResult> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, errors: [{ file: "", line: 0, error: "Not signed in." }] };
  const { data: me } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (me as { university_id: string } | null)?.university_id;
  if (!uni) return { ok: false, errors: [{ file: "", line: 0, error: "No institution linked to your account." }] };

  const semesterId = String(form.get("semester_id") ?? "").trim() || null;
  const errors: ImportResult["errors"] = [];
  const parsed: Record<string, CsvRow[]> = {};

  for (const [fname, cols] of Object.entries(EXPECTED)) {
    const file = form.get(fname);
    if (!(file instanceof File) || file.size === 0) continue;
    const text = await file.text();
    const { header, rows } = parseCsv(text);
    if (JSON.stringify(header) !== JSON.stringify(cols)) {
      errors.push({ file: fname, line: 1, error: `Bad header. Expected: ${cols.join(",")}` });
      continue;
    }
    parsed[fname] = rows;
  }
  if (Object.keys(parsed).length === 0) {
    return { ok: false, errors: [{ file: "", line: 0, error: "Upload at least one CSV." }] };
  }

  const inserted: Record<string, number> = {};
  const ins = async (table: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;
    const { error } = await sb.from(table).insert(rows);
    if (error) errors.push({ file: table, line: 0, error: error.message });
    else inserted[table] = (inserted[table] ?? 0) + rows.length;
  };

  // reference lookups
  const { data: progs } = await sb.from("programmes").select("id,code").eq("university_id", uni);
  const progByCode = new Map(((progs ?? []) as { id: string; code: string }[]).map((p) => [p.code, p.id]));
  const { data: lecs } = await sb.from("lecturers").select("id,email").eq("university_id", uni);
  const lecByEmail = new Map(((lecs ?? []) as { id: string; email: string | null }[]).map((l) => [(l.email ?? "").toLowerCase(), l.id]));
  const { data: crs } = await sb.from("courses").select("id,code").eq("university_id", uni);
  const courseByCode = new Map(((crs ?? []) as { id: string; code: string }[]).map((c) => [c.code, c.id]));
  const { data: rms } = await sb.from("rooms").select("id,code").eq("university_id", uni);
  const roomByCode = new Map(((rms ?? []) as { id: string; code: string }[]).map((r) => [r.code, r.id]));
  const { data: cohs } = await sb.from("cohorts").select("id,programme_id,level").eq("university_id", uni);
  const cohByKey = new Map(((cohs ?? []) as { id: string; programme_id: string; level: number }[]).map((c) => [`${c.programme_id}:${c.level}`, c.id]));
  const { data: studs } = await sb.from("students").select("id,index_number").eq("university_id", uni);
  const studByIndex = new Map(((studs ?? []) as { id: string; index_number: string }[]).map((s) => [s.index_number, s.id]));
  const { data: sess } = await sb.from("sessions").select("id,session_key,semester_id").eq("university_id", uni);
  const sessByKey = new Map(
    ((sess ?? []) as { id: string; session_key: string; semester_id: string }[]).map((s) => [`${s.semester_id}:${s.session_key}`, s.id])
  );

  if (parsed["programmes.csv"]) {
    await ins("programmes", parsed["programmes.csv"].map((r) => ({
      university_id: uni, code: r.code, name: r.name, department: r.department,
    })));
    const { data: p2 } = await sb.from("programmes").select("id,code").eq("university_id", uni);
    (p2 as { id: string; code: string }[] | null)?.forEach((p) => progByCode.set(p.code, p.id));
  }
  if (parsed["lecturers.csv"]) {
    await ins("lecturers", parsed["lecturers.csv"].map((r) => ({
      university_id: uni, name: r.name, email: r.email || null,
      department: r.department, employment_type: r.employment_type || "full-time",
    })));
    const { data: l2 } = await sb.from("lecturers").select("id,email").eq("university_id", uni);
    (l2 as { id: string; email: string | null }[] | null)?.forEach((l) => lecByEmail.set((l.email ?? "").toLowerCase(), l.id));
  }
  if (parsed["rooms.csv"]) {
    await ins("rooms", parsed["rooms.csv"].map((r) => ({
      university_id: uni, code: r.code, building: r.building || null,
      capacity: parseInt(r.capacity, 10), type: r.type || "lecture",
    })));
    const { data: r2 } = await sb.from("rooms").select("id,code").eq("university_id", uni);
    (r2 as { id: string; code: string }[] | null)?.forEach((r) => roomByCode.set(r.code, r.id));
  }
  if (parsed["courses.csv"]) {
    await ins("courses", parsed["courses.csv"].map((r) => ({
      university_id: uni, code: r.code, title: r.title, department: r.department,
      level: parseInt(r.level, 10), is_elective: ["true", "1", "yes"].includes(r.is_elective.toLowerCase()),
    })));
    const { data: c2 } = await sb.from("courses").select("id,code").eq("university_id", uni);
    (c2 as { id: string; code: string }[] | null)?.forEach((c) => courseByCode.set(c.code, c.id));
  }
  if (parsed["cohorts.csv"]) {
    const rows = parsed["cohorts.csv"].map((r, i) => {
      const pid = progByCode.get(r.programme_code);
      if (!pid) errors.push({ file: "cohorts.csv", line: i + 2, error: `Unknown programme_code ${r.programme_code}` });
      return { university_id: uni, programme_id: pid!, level: parseInt(r.level, 10), size: parseInt(r.size, 10) || 0 };
    }).filter((r) => r.programme_id);
    await ins("cohorts", rows);
    const { data: c2 } = await sb.from("cohorts").select("id,programme_id,level").eq("university_id", uni);
    (c2 as { id: string; programme_id: string; level: number }[] | null)?.forEach((c) => cohByKey.set(`${c.programme_id}:${c.level}`, c.id));
  }
  if (parsed["cohort_courses.csv"]) {
    const rows = parsed["cohort_courses.csv"].map((r, i) => {
      const pid = progByCode.get(r.programme_code);
      const cid = courseByCode.get(r.course_code);
      const cohid = pid ? cohByKey.get(`${pid}:${parseInt(r.level, 10)}`) : undefined;
      if (!cohid || !cid) errors.push({ file: "cohort_courses.csv", line: i + 2, error: `Unknown programme/level or course` });
      return { university_id: uni, cohort_id: cohid!, course_id: cid! };
    }).filter((r) => r.cohort_id && r.course_id);
    await ins("cohort_courses", rows);
  }
  if (parsed["students.csv"]) {
    const rows = parsed["students.csv"].map((r, i) => {
      const pid = progByCode.get(r.programme_code);
      const cohid = pid ? cohByKey.get(`${pid}:${parseInt(r.level, 10)}`) : undefined;
      if (!cohid) errors.push({ file: "students.csv", line: i + 2, error: `Unknown programme/level for ${r.index_number}` });
      return { university_id: uni, index_number: r.index_number, full_name: r.full_name, email: r.email || null, cohort_id: cohid ?? null };
    });
    await ins("students", rows);
    const { data: s2 } = await sb.from("students").select("id,index_number").eq("university_id", uni);
    (s2 as { id: string; index_number: string }[] | null)?.forEach((s) => studByIndex.set(s.index_number, s.id));
  }
  if (parsed["sessions.csv"]) {
    if (!semesterId) errors.push({ file: "sessions.csv", line: 0, error: "Sessions need a semester — create one in Settings first." });
    else {
      const rows = parsed["sessions.csv"].map((r) => ({
        university_id: uni, semester_id: semesterId, session_key: r.session_key,
        component: r.component || "theory", length_periods: parseInt(r.length_periods, 10) || 1,
        times_per_week: parseInt(r.times_per_week, 10) || 1,
        required_room_type: r.required_room_type || "lecture",
        lecturer_id: r.lecturer_email ? lecByEmail.get(r.lecturer_email.toLowerCase()) ?? null : null,
        group_label: r.group_label || null, expected_students: parseInt(r.expected_students, 10) || 0,
      }));
      await ins("sessions", rows);
      const { data: s2 } = await sb.from("sessions").select("id,session_key,semester_id").eq("university_id", uni);
      (s2 as { id: string; session_key: string; semester_id: string }[] | null)?.forEach((s) => sessByKey.set(`${s.semester_id}:${s.session_key}`, s.id));
    }
  }
  if (parsed["session_courses.csv"] && semesterId) {
    const rows = parsed["session_courses.csv"].map((r, i) => {
      const sid = sessByKey.get(`${semesterId}:${r.session_key}`);
      const cid = courseByCode.get(r.course_code);
      if (!sid || !cid) errors.push({ file: "session_courses.csv", line: i + 2, error: `Unknown session or course` });
      return { university_id: uni, session_id: sid!, course_id: cid! };
    }).filter((r) => r.session_id && r.course_id);
    await ins("session_courses", rows);
  }
  if (parsed["elective_choices.csv"] && semesterId) {
    const rows = parsed["elective_choices.csv"].map((r, i) => {
      const sid = studByIndex.get(r.student_index);
      const cid = courseByCode.get(r.course_code);
      if (!sid || !cid) errors.push({ file: "elective_choices.csv", line: i + 2, error: `Unknown student or course` });
      return { university_id: uni, semester_id: semesterId, student_id: sid!, course_id: cid! };
    }).filter((r) => r.student_id && r.course_id);
    await ins("elective_choices", rows);
  }
  if (parsed["periods.csv"] && semesterId) {
    const rows = parsed["periods.csv"].map((r) => ({
      university_id: uni, semester_id: semesterId,
      day_of_week: parseInt(r.day_of_week, 10), period_index: parseInt(r.period_index, 10),
      start_time: r.start_time, end_time: r.end_time,
    }));
    await ins("periods", rows);
  }
  if (parsed["lecturer_availability.csv"] && semesterId) {
    const rows = parsed["lecturer_availability.csv"].map((r, i) => {
      const lid = lecByEmail.get(r.lecturer_email.toLowerCase());
      if (!lid) errors.push({ file: "lecturer_availability.csv", line: i + 2, error: `Unknown lecturer ${r.lecturer_email}` });
      return {
        university_id: uni, semester_id: semesterId, lecturer_id: lid!,
        day_of_week: parseInt(r.day_of_week, 10), period_index: parseInt(r.period_index, 10),
        status: r.status, reason: r.reason || null,
      };
    }).filter((r) => r.lecturer_id);
    await ins("lecturer_availability", rows);
  }
  if (parsed["blocked_slots.csv"] && semesterId) {
    const rows = parsed["blocked_slots.csv"].map((r) => ({
      university_id: uni, semester_id: semesterId,
      day_of_week: parseInt(r.day_of_week, 10), period_index: parseInt(r.period_index, 10),
      room_id: r.room_code ? roomByCode.get(r.room_code) ?? null : null, reason: r.reason,
    }));
    await ins("blocked_slots", rows);
  }

  revalidatePath("/registry/master");
  return { ok: errors.length === 0, inserted, errors };
}

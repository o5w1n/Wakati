"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function createSemester(form: FormData) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: me } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (me as { university_id: string } | null)?.university_id;
  if (!uni) return { error: "No institution linked." };

  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Semester name is required." };
  const { data: sem, error } = await sb
    .from("semesters")
    .insert({ university_id: uni, name, status: "setup" })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // seed default grid + rules
  const semId = (sem as { id: string }).id;
  const { error: gridErr } = await sb.rpc("seed_periods", { p_semester_id: semId });
  if (gridErr) return { error: `Semester created but grid failed: ${gridErr.message}` };
  const { error: ruleErr } = await sb.rpc("seed_default_rules", { p_semester_id: semId });
  if (ruleErr) return { error: `Semester created but rules failed: ${ruleErr.message}` };

  revalidatePath("/registry/settings");
  return {};
}

const TRANSITIONS: Record<string, string[]> = {
  setup: ["availability"],
  availability: ["setup", "solving"],
  solving: ["review", "availability"],
  review: ["solving", "published", "availability"],
  published: ["review"],
  closed: [],
};

export async function setSemesterStatus(semesterId: string, status: string) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  const { data: cur } = await sb.from("semesters").select("status").eq("id", semesterId).single();
  const from = (cur as { status: string } | null)?.status;
  if (!from || !(TRANSITIONS[from] ?? []).includes(status)) return;
  // published -> review reopens editing; the published version stays archived-safe
  // because publishVersion() archives the old published row before promoting a new one
  await sb.from("semesters").update({ status }).eq("id", semesterId);
  revalidatePath("/registry/settings");
  revalidatePath("/registry/generate");
}

const RULE_NAMES: Record<string, string> = {
  H1: "Lecturer clash", H2: "Room clash", H3: "Cohort clash", H4: "Elective overlap",
  H5: "Session hours", H6: "Room capacity", H7: "Room type", H8: "Lecturer availability",
  H9: "Consecutive periods", H10: "Sessions per week", H11: "Level grouping", H12: "Blocked slots",
  P1: "Preferred windows", P2: "Morning preference", P3: "Spread across week",
  P4: "Room stability", P5: "Max periods per day", P6: "Max consecutive blocks",
  P7: "Free day", P8: "Back-to-back", P9: "Department clustering",
};

export async function setRuleEnabled(semesterId: string, ruleId: string, enabled: boolean): Promise<void> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  if (!RULE_NAMES[ruleId]) return;
  if (ruleId.startsWith("H") && !enabled) return; // hard rules stay on
  await sb.from("semester_rules").update({ enabled }).eq("semester_id", semesterId).eq("rule_id", ruleId);
  revalidatePath("/registry/settings");
}

export async function setRuleWeight(semesterId: string, ruleId: string, weight: number): Promise<void> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !ruleId.startsWith("P")) return;
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) return;
  await sb.from("semester_rules").update({ weight: Math.round(weight) }).eq("semester_id", semesterId).eq("rule_id", ruleId);
  revalidatePath("/registry/settings");
}

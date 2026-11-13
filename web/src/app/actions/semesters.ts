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

export async function setSemesterStatus(semesterId: string, status: string) {
  const sb = await supabaseServer();
  const { error } = await sb.from("semesters").update({ status }).eq("id", semesterId);
  if (error) return { error: error.message };
  revalidatePath("/registry/settings");
  revalidatePath("/registry/generate");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function createAccessCode(form: FormData) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: me } = await sb.from("profiles").select("university_id,role").eq("id", user.id).single();
  const uni = (me as { university_id: string | null } | null)?.university_id;
  if (!uni) return { error: "No institution linked." };

  const role = String(form.get("role") ?? "").trim();
  const label = String(form.get("label") ?? "").trim() || null;
  const custom = String(form.get("code") ?? "").trim().toUpperCase();
  if (!["student", "lecturer", "hod", "timetable_admin"].includes(role)) return { error: "Invalid role." };

  let code = custom;
  if (!code) {
    const { data: gen, error: genErr } = await sb.rpc("generate_access_code", { p_len: 8 });
    if (genErr) return { error: genErr.message };
    code = String(gen ?? "").toUpperCase();
  }
  // prefix for clarity
  if (!custom) {
    const prefix = role === "student" ? "STU" : role === "lecturer" ? "LEC" : role === "hod" ? "HOD" : "ADM";
    code = `${prefix}-${code}`;
  }

  const { error } = await sb.from("institution_access_codes").insert({
    university_id: uni,
    role,
    code,
    label,
    active: true,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/registry/members");
  revalidatePath("/registry/settings");
  return { code };
}

export async function toggleAccessCode(id: string, active: boolean) {
  const sb = await supabaseServer();
  const { error } = await sb.from("institution_access_codes").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/registry/members");
  return {};
}

export async function deleteAccessCode(id: string) {
  const sb = await supabaseServer();
  const { error } = await sb.from("institution_access_codes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/registry/members");
  return {};
}

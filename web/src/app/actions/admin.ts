"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

async function isSuperAdmin(): Promise<boolean> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return (data as { role: string } | null)?.role === "super_admin";
}

export async function setInstitutionStatus(id: string, status: "pending" | "active" | "suspended") {
  if (!(await isSuperAdmin())) return { error: "Super-admin only." };
  const sb = await supabaseServer();
  const { error } = await sb.from("universities").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  return {};
}

export async function updateInstitution(form: FormData) {
  if (!(await isSuperAdmin())) return { error: "Super-admin only." };
  const sb = await supabaseServer();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const domain = String(form.get("domain") ?? "").trim().toLowerCase();
  if (!id || !name) return { error: "Name is required." };
  const { error } = await sb.from("universities").update({ name, domain: domain || null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}

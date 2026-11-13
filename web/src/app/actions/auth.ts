"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export async function signIn(form: FormData) {
  const sb = await supabaseServer();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/post-login");
}

export async function signUp(form: FormData) {
  const sb = await supabaseServer();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const fullName = String(form.get("full_name") ?? "").trim();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };
  redirect("/signup/pending");
}

export async function requestPasswordReset(form: FormData) {
  const sb = await supabaseServer();
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) return { error: error.message };
  return { sent: true as const };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}

export async function registerUniversity(form: FormData) {
  const sb = await supabaseServer();
  const name = String(form.get("name") ?? "").trim();
  const shortCode = String(form.get("short_code") ?? "").trim();
  const domain = String(form.get("domain") ?? "").trim() || null;
  const adminName = String(form.get("admin_name") ?? "").trim() || null;
  if (!name || !shortCode) return { error: "Institution name and short code are required." };
  const { error } = await sb.rpc("register_university", {
    p_name: name,
    p_short_code: shortCode,
    p_domain: domain,
    p_admin_full_name: adminName,
  });
  if (error) return { error: error.message };
  redirect("/registry");
}

export async function acceptInvite(form: FormData) {
  const sb = await supabaseServer();
  const token = String(form.get("token") ?? "").trim();
  if (!token) return { error: "Paste your invite token." };
  const { error } = await sb.rpc("accept_invite", { p_token: token });
  if (error) return { error: error.message };
  redirect("/post-login");
}

export async function requestJoin(form: FormData) {
  const sb = await supabaseServer();
  const universityId = String(form.get("university_id") ?? "").trim();
  const role = String(form.get("role") ?? "").trim();
  const fullName = String(form.get("full_name") ?? "").trim() || null;
  if (!universityId || !role) return { error: "Choose an institution and a role." };
  const { error } = await sb.rpc("request_join", {
    p_university_id: universityId,
    p_role: role,
    p_full_name: fullName,
  });
  if (error) return { error: error.message };
  redirect("/signup/pending");
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function inviteMember(form: FormData) {
  const sb = await supabaseServer();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role") ?? "").trim();
  if (!email || !role) return { error: "Email and role are required." };
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data: me } = await sb.from("profiles").select("university_id").eq("id", user!.id).single();
  const { error } = await sb.from("invites").insert({
    university_id: (me as { university_id: string }).university_id,
    email,
    role,
    invited_by: user!.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/registry/members");
  return {};
}

export async function reviewRequest(requestId: string, approve: boolean) {
  const sb = await supabaseServer();
  const { error } = await sb.rpc("review_join_request", {
    p_request_id: requestId,
    p_approve: approve,
  });
  if (error) return { error: error.message };
  revalidatePath("/registry/members");
  return {};
}

export async function revokeInvite(inviteId: string) {
  const sb = await supabaseServer();
  const { error } = await sb.from("invites").delete().eq("id", inviteId);
  if (error) return { error: error.message };
  revalidatePath("/registry/members");
  return {};
}

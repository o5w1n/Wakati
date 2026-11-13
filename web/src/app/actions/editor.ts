"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function createDraftVersion(semesterId: string) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: me } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (me as { university_id: string } | null)?.university_id;
  if (!uni) return { error: "No institution linked." };
  const { data: v, error } = await sb
    .from("timetable_versions")
    .insert({ university_id: uni, semester_id: semesterId, status: "draft", created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/registry/editor");
  return { versionId: (v as { id: string }).id };
}

export async function movePlacement(
  placementId: string,
  day: number,
  startPeriod: number,
  roomId: string,
  overrideReason?: string
) {
  const sb = await supabaseServer();
  const patch: Record<string, unknown> = {
    day_of_week: day,
    start_period: startPeriod,
    room_id: roomId,
  };
  if (overrideReason !== undefined) patch.override_reason = overrideReason || null;
  const { error } = await sb.from("placements").update(patch).eq("id", placementId);
  if (error) return { error: error.message };
  revalidatePath("/registry/editor");
  return {};
}

export async function toggleLock(placementId: string, locked: boolean) {
  const sb = await supabaseServer();
  const { error } = await sb.from("placements").update({ locked }).eq("id", placementId);
  if (error) return { error: error.message };
  revalidatePath("/registry/editor");
  return {};
}

export async function logChange(versionId: string, action: string, before: unknown, after: unknown, reason?: string) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data: me } = user ? await sb.from("profiles").select("university_id").eq("id", user.id).single() : { data: null };
  const uni = (me as { university_id: string } | null)?.university_id;
  if (!uni) return;
  await sb.from("change_log").insert({
    university_id: uni,
    version_id: versionId,
    actor: user!.id,
    action,
    before: before as object,
    after: after as object,
    reason: reason ?? null,
  });
}

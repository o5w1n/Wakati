"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function saveAvailability(semesterId: string, cells: { day: number; period: number; status: string }[]) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await sb.from("profiles").select("university_id,lecturer_id").eq("id", user.id).single();
  const prof = profile as { university_id: string; lecturer_id: string | null } | null;
  if (!prof?.lecturer_id) return { error: "No lecturer record linked to your account." };

  // replace-all for this lecturer+semester
  const { error: delErr } = await sb
    .from("lecturer_availability")
    .delete()
    .eq("semester_id", semesterId)
    .eq("lecturer_id", prof.lecturer_id);
  if (delErr) return { error: delErr.message };

  const nonDefault = cells.filter((c) => c.status !== "available");
  if (nonDefault.length > 0) {
    const { error: insErr } = await sb.from("lecturer_availability").insert(
      nonDefault.map((c) => ({
        university_id: prof.university_id,
        semester_id: semesterId,
        lecturer_id: prof.lecturer_id!,
        day_of_week: c.day,
        period_index: c.period,
        status: c.status,
      }))
    );
    if (insErr) return { error: insErr.message };
  }
  revalidatePath("/lecturer/availability");
  return { saved: nonDefault.length };
}

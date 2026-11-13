"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function queueSolveJob(semesterId: string) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: me } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (me as { university_id: string } | null)?.university_id;
  if (!uni) return { error: "No institution linked." };

  // snapshot: counts the solver worker reads
  const [sessions, rooms, periods] = await Promise.all([
    sb.from("sessions").select("id", { count: "exact", head: true }).eq("semester_id", semesterId),
    sb.from("rooms").select("id", { count: "exact", head: true }).eq("university_id", uni),
    sb.from("periods").select("id", { count: "exact", head: true }).eq("semester_id", semesterId),
  ]);
  const { data: job, error } = await sb
    .from("solve_jobs")
    .insert({
      university_id: uni,
      semester_id: semesterId,
      status: "queued",
      progress: 0,
      snapshot: {
        session_count: sessions.count ?? 0,
        room_count: rooms.count ?? 0,
        period_count: periods.count ?? 0,
      },
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await sb.from("semesters").update({ status: "solving" }).eq("id", semesterId);
  revalidatePath("/registry/generate");
  return { jobId: (job as { id: string }).id };
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function savePlatformSettings(form: FormData): Promise<void> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  const patch = {
    new_institution_status: String(form.get("new_institution_status") ?? "pending"),
    invite_expiry_days: Number(form.get("invite_expiry_days") ?? 14),
    solver_time_limit: Number(form.get("solver_time_limit") ?? 300),
    quality_gate: Number(form.get("quality_gate") ?? 85),
  };
  if (!["pending", "active"].includes(patch.new_institution_status)) return;
  if (![7, 14, 30].includes(patch.invite_expiry_days)) return;
  if (!(patch.solver_time_limit > 0)) return;
  if (!(patch.quality_gate >= 0 && patch.quality_gate <= 100)) return;

  await sb.from("platform_settings").update(patch).eq("id", "platform");
  revalidatePath("/admin/settings");
}

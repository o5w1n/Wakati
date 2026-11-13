"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function markRead(id: string) {
  const sb = await supabaseServer();
  await sb.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllRead(paths: string[] = []) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  await sb.from("notifications").update({ read: true }).eq("recipient", user.id).eq("read", false);
  for (const p of paths) revalidatePath(p);
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function updateProfileName(name: string, path: string) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await sb.from("profiles").update({ full_name: name.trim() }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath(path);
  return {};
}

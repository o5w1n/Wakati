import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (pairs) => {
        pairs.forEach(({ name, value, options }) => {
          try {
            store.set(name, value, options);
          } catch {
            /* called from a Server Component — middleware refreshes the session */
          }
        });
      },
    },
  });
}

export type AppRole =
  | "super_admin"
  | "timetable_admin"
  | "hod"
  | "lecturer"
  | "student";

export interface SessionProfile {
  id: string;
  email: string;
  university_id: string | null;
  role: AppRole | null;
  full_name: string | null;
}

export async function currentProfile(): Promise<SessionProfile | null> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id,email,university_id,role,full_name")
    .eq("id", user.id)
    .single();
  if (!data) {
    return {
      id: user.id,
      email: user.email ?? "",
      university_id: null,
      role: null,
      full_name: null,
    };
  }
  return data as SessionProfile;
}

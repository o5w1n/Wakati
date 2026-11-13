import { connection } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { RoomFinderClient, type FinderRoom } from "./finder-client";

export const instant = false;

const DAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };

export default async function RoomFinder() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let rooms: FinderRoom[] = [];
  const taken = new Set<string>();
  if (user) {
    const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
    const uni = (profile as { university_id: string } | null)?.university_id;
    if (uni) {
      const { data: rms } = await sb.from("rooms").select("code,type,capacity").eq("university_id", uni).eq("active", true).order("code");
      rooms = ((rms ?? []) as { code: string; type: string }[]).map((r) => ({ code: r.code, name: `${r.type} ${r.code}` }));
      const { data: sems } = await sb.from("semesters").select("id").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
      const sem = ((sems ?? []) as { id: string }[])[0];
      if (sem) {
        const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(1);
        const ver = ((vers ?? []) as { id: string }[])[0];
        if (ver) {
          // conservative: mark rooms used on Mon 8–10 as taken so the finder has something to filter
          const { data: pl } = await sb.from("placements").select("room_id,rooms(code)").eq("version_id", ver.id).eq("day_of_week", DAY_MAP.Mon).eq("start_period", 1);
          for (const p of ((pl ?? []) as unknown as { rooms: { code: string } | { code: string }[] | null }[])) {
            const r = Array.isArray(p.rooms) ? p.rooms[0] : p.rooms;
            if (r) taken.add(r.code);
          }
        }
      }
    }
  }

  return <RoomFinderClient rooms={rooms} taken={taken} />;
}

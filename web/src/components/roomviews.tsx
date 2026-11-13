import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field } from "@/components/ui";
import { btnPrimaryCls, inputCls } from "@/components/ui";
import { cn } from "@/lib/cn";
import { supabaseServer } from "@/lib/supabase-server";
import { RoomDay } from "./roomday";

export interface RoomRow { id: string; code: string; type: string; capacity: number }

export async function RoomViewsLive({ role, active, heading }: { role: "lecturer" | "student"; active: string; heading: string }) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role={role} active={active}>
        <PageHeader title={heading} sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name,status").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string; status: string }[])[0];
  if (!sem) {
    return (
      <Shell role={role} active={active}>
        <PageHeader title={heading} sub="No semester yet." />
      </Shell>
    );
  }
  const { data: vers } = await sb.from("timetable_versions").select("id").eq("semester_id", sem.id).eq("status", sem.status === "published" ? "published" : "draft").order("created_at", { ascending: false }).limit(1);
  const ver = ((vers ?? []) as { id: string }[])[0];

  const { data: rooms } = await sb.from("rooms").select("id,code,type,capacity").eq("university_id", uni).eq("active", true).order("code");
  const roomList = (rooms ?? []) as RoomRow[];
  const { data: periods } = await sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", sem.id).order("day_of_week").order("period_index");
  const plist = (periods ?? []) as { day_of_week: number; period_index: number; start_time: string; end_time: string }[];
  const days = [...new Set(plist.map((p) => p.day_of_week))].sort();

  // occupancy: room -> "day:period" -> course codes
  const occ = new Map<string, Map<string, string>>();
  if (ver) {
    const { data: pl } = await sb
      .from("placements")
      .select("day_of_week,start_period,room_id,session_id,sessions(length_periods)")
      .eq("version_id", ver.id);
    const sessIds = [...new Set(((pl ?? []) as { session_id: string }[]).map((p) => p.session_id))];
    const names = new Map<string, string>();
    if (sessIds.length > 0) {
      const { data: sc } = await sb.from("session_courses").select("session_id,courses(code)").in("session_id", sessIds);
      const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : null);
      for (const r of ((sc ?? []) as unknown as { session_id: string; courses: { code: string } | { code: string }[] | null }[])) {
        const c = first(r.courses);
        const arr = names.get(r.session_id);
        if (arr) names.set(r.session_id, `${arr} / ${c?.code ?? ""}`);
        else names.set(r.session_id, c?.code ?? r.session_id.slice(0, 8));
      }
    }
    const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : null);
    for (const p of ((pl ?? []) as unknown as { day_of_week: number; start_period: number; room_id: string; session_id: string; sessions: { length_periods: number } | { length_periods: number }[] | null }[])) {
      const s = first(p.sessions);
      const len = s?.length_periods ?? 1;
      const label = names.get(p.session_id) ?? p.session_id.slice(0, 8);
      for (let j = 0; j < len; j++) {
        const roomOcc = occ.get(p.room_id) ?? new Map<string, string>();
        roomOcc.set(`${p.day_of_week}:${p.start_period + j}`, label);
        occ.set(p.room_id, roomOcc);
      }
    }
  }

  const serial = Object.fromEntries([...occ.entries()].map(([k, m]) => [k, Object.fromEntries(m)])) as Record<string, Record<string, string>>;

  return (
    <Shell role={role} active={active}>
      <PageHeader title={heading} sub={`${sem.name} · ${ver ? (sem.status === "published" ? "published" : "latest draft") : "nothing placed yet"}`} />
      <RoomDay
        role={role}
        rooms={roomList}
        days={days}
        maxPeriod={Math.max(0, ...plist.map((p) => p.period_index))}
        occ={serial}
      />
    </Shell>
  );
}

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { RoomFinderClient } from "@/app/rooms/finder-client";

export const instant = false;

/** Student "Room Views" tab renders the Room Finder to match the reference. */
export default async function StudentRooms() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  let rooms: { code: string; name: string }[] = [];
  if (uni) {
    const { data: rms } = await sb.from("rooms").select("code,type").eq("university_id", uni).eq("active", true).order("code");
    rooms = ((rms ?? []) as { code: string; type: string }[]).map((r) => ({ code: r.code, name: `${r.type} ${r.code}` }));
  }
  return (
    <div className="mx-auto w-full max-w-2xl">
      <RoomFinderClient rooms={rooms} taken={new Set()} />
    </div>
  );
}

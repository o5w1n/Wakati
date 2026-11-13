import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { EditorClient } from "./editor-client";
import { createDraftVersion } from "@/app/actions/editor";
import { btnPrimaryCls } from "@/components/ui";

export const instant = false;

export interface EditorPlacement {
  id: string;
  sessionId: string;
  sessionKey: string;
  title: string;
  component: string;
  length: number;
  lecturer: string;
  expected: number;
  courses: string[];
  day: number;
  startPeriod: number;
  roomId: string;
  roomCode: string;
  roomCap: number;
  locked: boolean;
  overrideReason: string | null;
}

export default async function EditorPage() {
  await connection();
  const sb = await supabaseServer();
  const { data: semesters } = await sb.from("semesters").select("id,name").order("created_at", { ascending: false });
  const sems = (semesters ?? []) as { id: string; name: string }[];
  const active = sems[0];
  if (!active) {
    return (
      <Shell role="registry" active="/registry/editor">
        <PageHeader title="Editor" sub="No semester yet." />
        <EmptyState title="No semester" sub="Create a semester in Settings first." />
      </Shell>
    );
  }

  const [{ data: versions }, { data: periods }] = await Promise.all([
    sb.from("timetable_versions").select("id,status,quality_score,created_at").eq("semester_id", active.id).order("created_at", { ascending: false }),
    sb.from("periods").select("day_of_week,period_index,start_time,end_time").eq("semester_id", active.id).order("day_of_week").order("period_index"),
  ]);
  const vers = (versions ?? []) as { id: string; status: string; quality_score: number | null; created_at: string }[];
  const draft = vers.find((v) => v.status === "draft") ?? vers[0];

  let placements: EditorPlacement[] = [];
  if (draft) {
    const { data: pl } = await sb
      .from("placements")
      .select("id,session_id,day_of_week,start_period,room_id,locked,override_reason,sessions(id,session_key,component,length_periods,expected_students,lecturers(name)),rooms(id,code,capacity),session_courses:session_id(course_id)")
      .eq("version_id", draft.id);
    // courses per session
    const sessIds = [...new Set(((pl ?? []) as { session_id: string }[]).map((p) => p.session_id))];
    const courseMap = new Map<string, string[]>();
    if (sessIds.length > 0) {
      const { data: sc } = await sb.from("session_courses").select("session_id,courses(code,title)").in("session_id", sessIds);
      for (const r of ((sc ?? []) as unknown as { session_id: string; courses: { code: string; title: string } | { code: string; title: string }[] | null }[])) {
        const arr = courseMap.get(r.session_id) ?? [];
        const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
        if (c) arr.push(c.code);
        courseMap.set(r.session_id, arr);
      }
    }
    const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
    placements = (((pl ?? []) as unknown) as {
      id: string; session_id: string; day_of_week: number; start_period: number; room_id: string;
      locked: boolean; override_reason: string | null;
      sessions: { session_key: string; component: string; length_periods: number; expected_students: number; lecturers: { name: string } | { name: string }[] | null } | { session_key: string; component: string; length_periods: number; expected_students: number; lecturers: { name: string } | { name: string }[] | null }[] | null;
      rooms: { id: string; code: string; capacity: number } | { id: string; code: string; capacity: number }[] | null;
    }[]).map((p) => {
      const sess = first(p.sessions);
      const room = first(p.rooms);
      const lec = sess ? first(sess.lecturers) : null;
      return {
        id: p.id,
        sessionId: p.session_id,
        sessionKey: sess?.session_key ?? "?",
        title: (courseMap.get(p.session_id) ?? []).join(" / ") || sess?.session_key || "?",
        component: sess?.component ?? "",
        length: sess?.length_periods ?? 1,
        lecturer: lec?.name ?? "TBA",
        expected: sess?.expected_students ?? 0,
        courses: courseMap.get(p.session_id) ?? [],
        day: p.day_of_week,
        startPeriod: p.start_period,
        roomId: p.room_id,
        roomCode: room?.code ?? "?",
        roomCap: room?.capacity ?? 0,
        locked: p.locked,
        overrideReason: p.override_reason,
      };
    });
  }

  const grid = (periods ?? []) as { day_of_week: number; period_index: number; start_time: string; end_time: string }[];
  const days = [...new Set(grid.map((p) => p.day_of_week))].sort();
  const periodLabels = new Map<string, string>();
  for (const p of grid) periodLabels.set(`${p.day_of_week}:${p.period_index}`, `${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)}`);

  return (
    <Shell role="registry" active="/registry/editor">
      <PageHeader
        title="Editor"
        sub={`${active.name} · ${draft ? `${draft.status} · score ${draft.quality_score ?? "—"}` : "no version yet"}`}
        actions={
          !draft ? (
            <form action={async () => { await createDraftVersion(active.id); }}>
              <button className={btnPrimaryCls}>New draft</button>
            </form>
          ) : undefined
        }
      />
      {!draft ? (
        <EmptyState title="No draft yet" sub="Generate a timetable first, or start an empty draft." />
      ) : (
        <EditorClient
          versionId={draft.id}
          versionStatus={draft.status}
          placements={placements}
          days={days}
          periodLabels={Object.fromEntries(periodLabels)}
        />
      )}
      {vers.length > 1 && (
        <p className="mt-3 text-xs text-muted">
          Other versions: {vers.slice(1).map((v) => `${v.status} (${new Date(v.created_at).toLocaleDateString()})`).join(" · ")}
          {" — "}compare and restore from Review &amp; Publish.
        </p>
      )}
      {draft && <StatusBadge tone="warn">Unplaced sessions never publish silently</StatusBadge>}
    </Shell>
  );
}

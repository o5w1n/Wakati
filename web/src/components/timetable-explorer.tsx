"use client";

import { useMemo, useState } from "react";
import { TimetableGrid, type GridDay, type GridPeriod } from "@/components/timetable";
import { inputCls, btnSecondaryCls } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface PlacementRow {
  id: string;
  sessionId: string;
  day: number;
  startPeriod: number;
  length: number;
  roomId: string;
  roomCode: string;
  courseCodes: string[];
  title: string;
  lecturer: string;
  department?: string;
  level?: number | null;
  cohortLabel?: string;
  programmeCode?: string;
  courseKey?: string;
}

export interface FilterOptions {
  departments: string[];
  courses: string[];
  levels: number[];
  cohorts: { id: string; label: string }[];
  rooms: { id: string; code: string }[];
  programmes: { id: string; label: string }[];
}

export interface PeriodInfo { day: number; index: number; start: string; end: string; label: string }

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function buildGrid(rows: PlacementRow[], days: number[], periods: GridPeriod[], by: "time" | "room" = "time") {
  // returns days x periods grid slots; handles span by marking covered
  const gridDays: GridDay[] = days.map((d) => ({ day: d, label: DAY_NAMES[d] ?? `Day ${d}`, slots: Array(periods.length).fill(null) }));
  const idxByPeriod = new Map(periods.map((p, i) => [p.index, i]));
  for (const r of rows) {
    const gd = gridDays.find((g) => g.day === r.day);
    if (!gd) continue;
    const pi = idxByPeriod.get(r.startPeriod);
    if (pi == null) continue;
    const span = Math.max(1, Math.min(r.length, periods.length - pi));
    gd.slots[pi] = {
      id: r.id,
      courseCodes: r.courseCodes.length ? r.courseCodes : [r.sessionId.slice(0, 8)],
      title: r.title || "",
      lecturer: r.lecturer || "",
      room: r.roomCode,
      span,
    } as any;
    for (let j = 1; j < span; j++) {
      if (pi + j < gd.slots.length) gd.slots[pi + j] = { __covered: true } as any;
    }
  }
  return gridDays;
}

export function TimetableExplorer({
  placements,
  periods,
  days,
  options,
  showRoomView = true,
  title,
}: {
  placements: PlacementRow[];
  periods: PeriodInfo[];
  days: number[];
  options: FilterOptions;
  showRoomView?: boolean;
  title?: string;
}) {
  const [view, setView] = useState<"grid" | "location" | "search">("grid");
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [cohort, setCohort] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [programme, setProgramme] = useState("");

  const gridPeriods: GridPeriod[] = useMemo(() => {
    // unique by index using first day's labels if available
    const map = new Map<number, GridPeriod>();
    for (const p of periods) {
      if (!map.has(p.index)) map.set(p.index, { index: p.index, label: p.label || `P${p.index}`, start: p.start, end: p.end });
    }
    return [...map.values()].sort((a, b) => a.index - b.index);
  }, [periods]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const t = time.trim();
    return placements.filter((p) => {
      if (department && (p.department || "") !== department) return false;
      if (course && !(p.courseCodes || []).includes(course) && p.courseKey !== course) return false;
      if (level && String(p.level ?? "") !== level) return false;
      if (cohort && p.cohortLabel !== cohort) return false;
      if (programme && p.programmeCode !== programme) return false;
      if (room && p.roomCode !== room && p.roomId !== room) return false;
      if (day && String(p.day) !== day) return false;
      if (t) {
        // match if any period of this placement overlaps requested time label/start
        const pPeriods = periods.filter((x) => x.day === p.day && x.index >= p.startPeriod && x.index < p.startPeriod + p.length);
        const match = pPeriods.some((x) => (x.start || "").startsWith(t) || (x.label || "").toLowerCase().includes(t.toLowerCase()) || `${x.start}-${x.end}`.includes(t));
        if (!match) return false;
      }
      if (ql) {
        const hay = [p.title, p.lecturer, p.roomCode, p.department, p.cohortLabel, p.programmeCode, ...(p.courseCodes||[])].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [placements, department, course, level, cohort, room, day, time, q, programme, periods]);

  const grid = useMemo(() => buildGrid(filtered, days, gridPeriods), [filtered, days, gridPeriods]);

  const byRoom = useMemo(() => {
    const m = new Map<string, PlacementRow[]>();
    for (const p of filtered) {
      const k = p.roomCode || "Unknown";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    for (const v of m.values()) v.sort((a,b)=>a.day-b.day || a.startPeriod-b.startPeriod);
    return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  }, [filtered]);

  const searchResults = useMemo(() => {
    return [...filtered].sort((a,b)=>a.day-b.day || a.startPeriod-b.startPeriod || a.roomCode.localeCompare(b.roomCode));
  }, [filtered]);

  function periodLabelFor(p: PlacementRow) {
    const slots = periods.filter((x)=>x.day===p.day && x.index>=p.startPeriod && x.index < p.startPeriod + p.length);
    if (!slots.length) return `P${p.startPeriod}`;
    const s = slots[0]; const e = slots[slots.length-1];
    return `${DAY_NAMES[p.day]} ${s.start || s.label}–${e.end || ""}`;
  }

  const nowHint = (() => {
    // for "what's happening here soon" convenience: not exact real-time mapping, but show controls tip
    return "Tip: pick a room/location and day/time to see what’s scheduled there.";
  })();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cardline bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title ? <div className="text-sm font-medium text-heading">{title}</div> : null}
            <p className="text-[13px] text-body">Filter by course, department, level/year group, cohort, room, day/time or search.</p>
          </div>
          <div className="flex rounded-lg border border-cardline bg-page p-1 text-[13px]">
            {(["grid","location","search"] as const).map((v) => (
              <button key={v} onClick={()=>setView(v)} className={cn("rounded-md px-3 py-1.5 capitalize", view===v?"bg-card font-semibold text-heading shadow-sm":"text-body hover:text-heading")}>{v}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search course, lecturer, room…" className={inputCls} />
          <select value={department} onChange={(e)=>setDepartment(e.target.value)} className={inputCls}>
            <option value="">All departments</option>
            {options.departments.map((d)=><option key={d} value={d}>{d}</option>)}
          </select>
          <select value={programme} onChange={(e)=>setProgramme(e.target.value)} className={inputCls}>
            <option value="">All programmes</option>
            {options.programmes.map((p)=><option key={p.id} value={p.label}>{p.label}</option>)}
          </select>
          <select value={level} onChange={(e)=>setLevel(e.target.value)} className={inputCls}>
            <option value="">All levels / year groups</option>
            {options.levels.map((l)=><option key={l} value={String(l)}>Level {l}</option>)}
          </select>
          <select value={course} onChange={(e)=>setCourse(e.target.value)} className={inputCls}>
            <option value="">All courses</option>
            {options.courses.map((c)=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={cohort} onChange={(e)=>setCohort(e.target.value)} className={inputCls}>
            <option value="">All cohorts/groups</option>
            {options.cohorts.map((c)=><option key={c.id} value={c.label}>{c.label}</option>)}
          </select>
          <select value={room} onChange={(e)=>setRoom(e.target.value)} className={inputCls}>
            <option value="">All locations/rooms</option>
            {options.rooms.map((r)=><option key={r.id} value={r.code}>{r.code}</option>)}
          </select>
          <select value={day} onChange={(e)=>setDay(e.target.value)} className={inputCls}>
            <option value="">Any day</option>
            {days.map((d)=><option key={d} value={String(d)}>{DAY_NAMES[d] ?? `Day ${d}`}</option>)}
          </select>
          <input value={time} onChange={(e)=>setTime(e.target.value)} placeholder="Time (e.g. 08:00 or P1)" className={inputCls} />
          <button onClick={()=>{setQ("");setDepartment("");setCourse("");setLevel("");setCohort("");setRoom("");setDay("");setTime("");setProgramme("");}} className={btnSecondaryCls}>Clear filters</button>
        </div>
        <p className="mt-2 text-xs text-muted">{nowHint}</p>
      </div>

      {view === "grid" && (
        <div className="space-y-2">
          <div className="text-[13px] text-body"><span className="font-semibold text-heading">{filtered.length}</span> scheduled blocks match.</div>
          <TimetableGrid days={grid} periods={gridPeriods} />
        </div>
      )}

      {view === "location" && showRoomView && (
        <div className="space-y-3">
          <div className="text-[13px] text-body">Timetable by location/room. {byRoom.length} room(s) shown.</div>
          {byRoom.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cardline bg-card p-8 text-center text-[13px] text-muted">No matching classes for the selected filters.</div>
          ) : byRoom.map(([roomCode, list]) => (
            <section key={roomCode} className="rounded-xl border border-cardline bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-heading">{roomCode}</h3>
                <span className="text-xs text-muted">{list.length} class(es)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead><tr className="border-b border-cardline text-left text-body"><th className="py-2 pr-3 font-medium">When</th><th className="py-2 pr-3 font-medium">Course</th><th className="py-2 pr-3 font-medium">Title</th><th className="py-2 pr-3 font-medium">Lecturer</th><th className="py-2 pr-3 font-medium">Cohort/Level</th></tr></thead>
                  <tbody className="divide-y divide-cardline">
                    {list.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-3 font-medium text-heading whitespace-nowrap">{periodLabelFor(p)}</td>
                        <td className="py-2 pr-3">{(p.courseCodes||[]).join(" / ")}</td>
                        <td className="py-2 pr-3 text-body">{p.title}</td>
                        <td className="py-2 pr-3 text-body">{p.lecturer || "TBA"}</td>
                        <td className="py-2 pr-3 text-muted">{p.cohortLabel || (p.level ? `Level ${p.level}` : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {view === "search" && (
        <div className="rounded-xl border border-cardline bg-card p-4 shadow-sm">
          <div className="mb-2 text-[13px] text-body">Search results: <span className="font-semibold text-heading">{searchResults.length}</span> classes. Use room/day/time filters to answer “what class happens at what location at what time?”.</div>
          {searchResults.length === 0 ? (
            <div className="rounded-lg border border-dashed border-cardline p-6 text-center text-[13px] text-muted">No classes match.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead><tr className="border-b border-cardline text-left text-body"><th className="py-2 pr-3 font-medium">When</th><th className="py-2 pr-3 font-medium">Location</th><th className="py-2 pr-3 font-medium">Course</th><th className="py-2 pr-3 font-medium">Lecturer</th><th className="py-2 pr-3 font-medium">Dept</th><th className="py-2 pr-3 font-medium">Level/Cohort</th></tr></thead>
                <tbody className="divide-y divide-cardline">
                  {searchResults.map((p)=>(
                    <tr key={p.id}>
                      <td className="py-2 pr-3 whitespace-nowrap font-medium text-heading">{periodLabelFor(p)}</td>
                      <td className="py-2 pr-3 font-semibold text-primary">{p.roomCode}</td>
                      <td className="py-2 pr-3">{(p.courseCodes||[]).join(" / ")} <span className="text-muted">{p.title ? `— ${p.title}` : ""}</span></td>
                      <td className="py-2 pr-3">{p.lecturer || "TBA"}</td>
                      <td className="py-2 pr-3 text-muted">{p.department || "—"}</td>
                      <td className="py-2 pr-3 text-muted">{p.cohortLabel || (p.level ? `Level ${p.level}` : "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

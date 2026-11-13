"use client";

import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { Pill } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { TimetableCell, ClashPopover, type SlotStatus } from "@/components/timetable";
import { cn } from "@/lib/cn";
import { movePlacement, toggleLock, logChange } from "@/app/actions/editor";
import type { EditorPlacement } from "./page";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Props {
  versionId: string;
  versionStatus: string;
  placements: EditorPlacement[];
  days: number[];
  periodLabels: Record<string, string>;
}

export function EditorClient({ versionId, placements: initial, days, periodLabels }: Props) {
  const [items, setItems] = useState<EditorPlacement[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("Mon – Fri");
  const [prog, setProg] = useState("All Programmes");
  const [level, setLevel] = useState("All Levels");
  const [dept, setDept] = useState("All Departments");
  const [showElectives, setShowElectives] = useState(true);
  const [showPractical, setShowPractical] = useState(true);
  const [showGroups, setShowGroups] = useState(true);
  const [saving, setSaving] = useState(false);

  const periodIndexes = useMemo(() => {
    const per = new Map<number, number[]>();
    for (const key of Object.keys(periodLabels)) {
      const [d, p] = key.split(":").map(Number);
      if (!per.has(d)) per.set(d, []);
      per.get(d)!.push(p);
    }
    for (const v of per.values()) v.sort((a, b) => a - b);
    return per;
  }, [periodLabels]);

  // live clash check
  const { statuses, reasons } = useMemo(() => {
    const st: Record<string, SlotStatus> = {};
    const rs: Record<string, string> = {};
    const occ = new Map<string, EditorPlacement[]>();
    for (const p of items) {
      for (let j = 0; j < p.length; j++) {
        const key = `${p.day}:${p.startPeriod + j}`;
        if (!occ.has(key)) occ.set(key, []);
        occ.get(key)!.push(p);
      }
    }
    for (const p of items) {
      let status: SlotStatus = "ok";
      let reason = "";
      if (p.expected > p.roomCap) {
        status = "bad";
        reason = `${p.sessionKey} needs ${p.expected} seats but ${p.roomCode} seats ${p.roomCap}.`;
      } else {
        for (let j = 0; j < p.length; j++) {
          const others = (occ.get(`${p.day}:${p.startPeriod + j}`) ?? []).filter((o) => o.id !== p.id);
          const roomClash = others.find((o) => o.roomId === p.roomId);
          if (roomClash) {
            status = "bad";
            reason = `${p.sessionKey} is already scheduled in this slot.`;
            break;
          }
          const lecClash = p.lecturer !== "TBA" && others.find((o) => o.lecturer === p.lecturer);
          if (lecClash) {
            status = "bad";
            reason = `${p.lecturer} teaches ${lecClash.sessionKey} at the same time.`;
            break;
          }
        }
      }
      if (status === "ok" && p.overrideReason) {
        status = "warn";
        reason = p.overrideReason;
      }
      st[p.id] = status;
      if (reason) rs[p.id] = reason;
    }
    return { statuses: st, reasons: rs };
  }, [items]);

  const gridPeriods = useMemo(() => {
    const first = days[0];
    const idxs = periodIndexes.get(first ?? 1) ?? [];
    return idxs.map((pi) => ({ index: pi, label: periodLabels[`${first}:${pi}`] ?? `P${pi}` }));
  }, [days, periodIndexes, periodLabels]);

  const visible = (p: EditorPlacement) => {
    if (search && !`${p.sessionKey} ${p.title} ${p.lecturer} ${p.roomCode}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (!showElectives && p.component.toLowerCase().includes("elect")) return false;
    if (!showPractical && p.component.toLowerCase().includes("pract")) return false;
    if (!showGroups && p.component.toLowerCase().includes("group")) return false;
    return true;
  };

  function placementAt(day: number, period: number) {
    return items.find((p) => p.day === day && p.startPeriod === period && visible(p)) ?? null;
  }
  function coveredBy(day: number, period: number) {
    return items.find((p) => p.day === day && p.startPeriod < period && period < p.startPeriod + p.length && visible(p)) ?? null;
  }

  async function dropOn(day: number, period: number) {
    if (!dragId) return;
    const p = items.find((i) => i.id === dragId);
    if (!p || p.locked) return;
    const before = { ...p };
    setItems((prev) => prev.map((i) => (i.id === dragId ? { ...i, day, startPeriod: period } : i)));
    setDragId(null);
    setSaving(true);
    const res = await movePlacement(dragId, day, period, p.roomId);
    if (!res.error) await logChange(versionId, "move", before, { ...before, day, startPeriod: period });
    setSaving(false);
  }

  async function toggleSelectedLock() {
    const sel = items.find((i) => i.id === selectedId);
    if (!sel) return;
    await toggleLock(sel.id, !sel.locked);
    setItems((prev) => prev.map((i) => (i.id === sel.id ? { ...i, locked: !i.locked } : i)));
  }

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const badCount = Object.values(statuses).filter((s) => s === "bad").length;

  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} className="flex items-center justify-between py-1 text-[13px] text-heading" aria-pressed={on}>
      <span>{label}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-primary" : "bg-cardline")} aria-hidden>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );

  return (
    <div className="-m-6 md:-m-8">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cardline bg-card px-6 py-3">
        <h1 className="mr-4 text-[17px] font-bold text-heading">Timetable Editor</h1>
        <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Day range"
          className="h-9 rounded-lg border border-cardline bg-card px-2.5 text-[13px] text-heading outline-none focus:border-primary">
          <option>Mon – Fri</option>
          <option>Mon – Sat</option>
        </select>
        <div className="relative">
          <Search size={15} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="h-9 w-44 rounded-lg border border-cardline bg-card py-2 pl-8 pr-2.5 text-[13px] text-heading outline-none placeholder:text-muted focus:border-primary" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {saving && <span className="text-xs text-muted">Saving…</span>}
          {badCount > 0 && <Pill tone="bad">{badCount} clash{badCount === 1 ? "" : "es"}</Pill>}
          <button onClick={toggleSelectedLock} className={`${btnSecondaryCls} !h-9 !border-cardline !text-heading`} disabled={!selected}>
            <Lock size={14} aria-hidden /> Lock
          </button>
          <button className={`${btnPrimaryCls} !h-9`} onClick={() => setSaving(false)}>Save</button>
        </div>
      </div>

      <div className="flex gap-4 p-6">
        {/* filter panel */}
        <aside className="hidden w-52 shrink-0 rounded-xl border border-cardline bg-card p-4 lg:block">
          <label className="mb-1 block text-xs font-medium text-heading">Programme</label>
          <select value={prog} onChange={(e) => setProg(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-cardline bg-card px-2 text-[13px] text-heading outline-none focus:border-primary">
            <option>All Programmes</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-heading">Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-cardline bg-card px-2 text-[13px] text-heading outline-none focus:border-primary">
            <option>All Levels</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-heading">Department</label>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-cardline bg-card px-2 text-[13px] text-heading outline-none focus:border-primary">
            <option>All Departments</option>
          </select>
          <div className="mt-1 space-y-0.5 border-t border-cardline pt-2">
            <Toggle on={showElectives} onClick={() => setShowElectives((v) => !v)} label="Show Electives" />
            <Toggle on={showPractical} onClick={() => setShowPractical((v) => !v)} label="Show Practical" />
            <Toggle on={showGroups} onClick={() => setShowGroups((v) => !v)} label="Show Groups" />
          </div>
          <button className={`${btnSecondaryCls} mt-4 w-full !border-cardline !text-heading`}>
            <Search size={14} aria-hidden /> Find a Slot
          </button>
        </aside>

        {/* grid */}
        <div className="min-w-0 flex-1">
          <div className="tt-scroll overflow-auto rounded-xl border border-cardline bg-card">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className="w-28 px-3 py-2.5" />
                  {days.map((d) => (
                    <th key={d} className="px-2 py-2.5 text-left text-[13px] font-semibold text-heading">
                      {DAY_NAMES[d] ?? `Day ${d}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridPeriods.map((gp) => (
                  <tr key={gp.index}>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-[12px] font-medium text-body">{gp.label}</td>
                    {days.map((d) => {
                      if (coveredBy(d, gp.index)) return null;
                      const p = placementAt(d, gp.index);
                      if (!p) {
                        return (
                          <td key={d} className={cn("p-1 align-top", dragId && "bg-primary/5")}
                            onDragOver={(e) => { if (dragId) e.preventDefault(); }}
                            onDrop={() => dropOn(d, gp.index)}>
                            <div className="flex min-h-[88px] items-center justify-center text-muted"><span aria-hidden>–</span></div>
                          </td>
                        );
                      }
                      const st = statuses[p.id] ?? "ok";
                      const rowspan = Math.min(p.length, gridPeriods.length - gridPeriods.findIndex((g) => g.index === gp.index));
                      const gs = {
                        id: p.id,
                        courseCodes: p.courses.length ? p.courses : [p.sessionKey],
                        title: p.title, lecturer: p.lecturer, room: p.roomCode, locked: p.locked,
                      };
                      const hov = hoverId === p.id && (st === "bad" || st === "warn");
                      return (
                        <td key={d} rowSpan={rowspan > 1 ? rowspan : undefined} className="relative p-1 align-top"
                          onDragOver={(e) => { if (dragId) e.preventDefault(); }}
                          onDrop={() => dropOn(d, gp.index)}>
                          <div draggable={!p.locked}
                            onDragStart={() => setDragId(p.id)} onDragEnd={() => setDragId(null)}
                            onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId((h) => (h === p.id ? null : h))}
                            className={dragId === p.id ? "opacity-60" : "cursor-grab"}>
                            <TimetableCell session={gs} status={st} reason={reasons[p.id]} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />
                          </div>
                          {hov && (
                            <ClashPopover tone={st === "bad" ? "bad" : "warn"} title={st === "bad" ? "Hard clash" : "Preference"} reason={reasons[p.id] ?? ""} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 hidden text-xs text-muted lg:block">{DAY_FULL[days[0]]}–{DAY_FULL[days[days.length - 1]]} · {range} · drag a block to move it, hover a red cell for the reason.</p>
        </div>
      </div>
    </div>
  );
}

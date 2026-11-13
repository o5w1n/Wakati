"use client";

import { useMemo, useState } from "react";
import { Lock, Unlock, RotateCcw } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { TimetableCell, type GridDay, type GridPeriod, type GridSession, type SlotStatus } from "@/components/timetable";
import { cn } from "@/lib/cn";
import { movePlacement, toggleLock, logChange } from "@/app/actions/editor";
import type { EditorPlacement } from "./page";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Props {
  versionId: string;
  versionStatus: string;
  placements: EditorPlacement[];
  days: number[];
  periodLabels: Record<string, string>;
}

export function EditorClient({ versionId, versionStatus, placements: initial, days, periodLabels }: Props) {
  const [items, setItems] = useState<EditorPlacement[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
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

  const maxPeriods = Math.max(1, ...[...periodIndexes.values()].flat());

  // live clash check: room double-book, capacity, lecturer double-book
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
        reason = `Hard clash: ${p.roomCode} seats ${p.roomCap} but ${p.expected} students enrolled (H6). Needs override to save.`;
      } else {
        for (let j = 0; j < p.length; j++) {
          const others = (occ.get(`${p.day}:${p.startPeriod + j}`) ?? []).filter((o) => o.id !== p.id);
          const roomClash = others.find((o) => o.roomId === p.roomId);
          if (roomClash) {
            status = "bad";
            reason = `Hard clash: ${p.roomCode} double-booked with ${roomClash.sessionKey} (H2).`;
            break;
          }
          const lecClash = p.lecturer !== "TBA" && others.find((o) => o.lecturer === p.lecturer);
          if (lecClash) {
            status = "bad";
            reason = `Hard clash: ${p.lecturer} teaches ${lecClash.sessionKey} at the same time (H1).`;
            break;
          }
        }
      }
      if (status === "ok" && p.overrideReason) {
        status = "warn";
        reason = `Override logged: ${p.overrideReason}`;
      }
      st[p.id] = status;
      if (reason) rs[p.id] = reason;
    }
    return { statuses: st, reasons: rs };
  }, [items]);

  const gridDays: GridDay[] = useMemo(() => {
    return days.map((d) => {
      const idxs = periodIndexes.get(d) ?? [];
      const slots: (GridSession | null)[] = Array(maxPeriods).fill(null);
      for (const p of items) {
        if (p.day !== d) continue;
        if (filter && !`${p.sessionKey} ${p.title} ${p.lecturer} ${p.roomCode}`.toLowerCase().includes(filter.toLowerCase())) continue;
        const gs: GridSession = {
          id: p.id, courseCodes: p.courses.length ? p.courses : [p.sessionKey],
          title: p.title, tags: [p.component], lecturer: p.lecturer, room: p.roomCode,
          locked: p.locked, span: p.length,
        };
        for (let j = 0; j < p.length; j++) {
          const pos = (periodIndexes.get(d) ?? []).indexOf(p.startPeriod + j);
          if (pos >= 0) slots[pos] = gs;
        }
      }
      return { day: d, label: DAY_NAMES[d] ?? `Day ${d}`, slots };
    });
  }, [items, days, periodIndexes, maxPeriods, filter]);

  const gridPeriods: GridPeriod[] = useMemo(() => {
    const first = days[0];
    const idxs = periodIndexes.get(first ?? 1) ?? [];
    return idxs.map((pi) => ({ index: pi, label: periodLabels[`${first}:${pi}`] ?? `P${pi}` }));
  }, [days, periodIndexes, periodLabels]);

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

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const badCount = Object.values(statuses).filter((s) => s === "bad").length;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter programme, level, lecturer, room…"
          className="h-9 w-72 border border-line bg-paper px-3 text-[13px] outline-none placeholder:text-muted focus:border-indigo-deep"
        />
        <span className="ml-auto flex items-center gap-3 text-xs text-muted">
          {saving && <span>Saving…</span>}
          {badCount > 0 && <StatusBadge tone="bad">{badCount} clash{badCount === 1 ? "" : "es"}</StatusBadge>}
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 bg-ok-text" /> valid</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 bg-warn-text" /> preference</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 bg-bad-text" /> clash</span>
        </span>
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="tt-scroll overflow-auto border border-line bg-paper">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-[1] w-24 border-b border-r border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-muted">Time</th>
                  {gridDays.map((d) => (
                    <th key={d.day} className="border-b border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-ink">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridPeriods.map((p, pi) => (
                  <tr key={p.index}>
                    <td className="sticky left-0 border-b border-r border-line bg-canvas-2 px-2 py-1 align-top text-[11px] text-muted">{p.label}</td>
                    {gridDays.map((d) => {
                      const s = d.slots[pi] ?? null;
                      const st = (s && statuses[s.id]) || "empty";
                      const isDrop = !!dragId;
                      return (
                        <td
                          key={d.day}
                          className={cn("border-b border-line p-0 align-top", isDrop && !s && "bg-indigo-deep/5")}
                          onDragOver={(e) => { if (dragId) e.preventDefault(); }}
                          onDrop={() => dropOn(d.day, p.index)}
                        >
                          {s ? (
                            <div draggable={!items.find((i) => i.id === s.id)?.locked} onDragStart={() => setDragId(s.id)} onDragEnd={() => setDragId(null)} className="cursor-grab">
                              <TimetableCell session={s} status={s ? st : "empty"} reason={s ? reasons[s.id] : undefined} selected={selectedId === s.id} onClick={() => setSelectedId(s.id)} />
                            </div>
                          ) : (
                            <div className="h-full min-h-[64px] bg-paper" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="hidden w-72 shrink-0 border border-line bg-paper lg:block">
          {selected ? (
            <div>
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="text-sm font-medium text-ink">Session</span>
                <form action={async () => {
                  await toggleLock(selected.id, !selected.locked);
                  setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, locked: !i.locked } : i)));
                }}>
                  <button className="flex items-center gap-1 text-xs text-muted hover:text-ink">
                    {selected.locked ? <><Unlock size={13} /> Unlock</> : <><Lock size={13} /> Lock</>}
                  </button>
                </form>
              </div>
              <div className="space-y-3 px-4 py-3 text-[13px]">
                <div>
                  <div className="font-semibold text-ink">{selected.title}</div>
                  <div className="mt-0.5 text-muted">{selected.component} · {selected.length} periods · {selected.expected} students</div>
                  <div className="mt-0.5 text-muted">{selected.lecturer} · {selected.roomCode}</div>
                </div>
                {statuses[selected.id] === "bad" && (
                  <>
                    <StatusBadge tone="bad">Hard clash</StatusBadge>
                    <p className="text-muted">{reasons[selected.id]}</p>
                  </>
                )}
                {statuses[selected.id] === "warn" && (
                  <>
                    <StatusBadge tone="warn">Override logged</StatusBadge>
                    <p className="text-muted">{reasons[selected.id]}</p>
                  </>
                )}
                {statuses[selected.id] === "ok" && <StatusBadge tone="ok">Valid</StatusBadge>}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No session selected" sub="Click a cell to inspect, lock, or reassign it." />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

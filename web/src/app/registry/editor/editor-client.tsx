"use client";

import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { Pill } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import {
  TimetableCell,
  ClashPopover,
  type SlotStatus,
} from "@/components/timetable";
import { cn } from "@/lib/cn";
import { movePlacement, toggleLock, logChange } from "@/app/actions/editor";
import type { EditorPlacement } from "./page";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface Props {
  versionId: string;
  versionStatus: string;
  placements: EditorPlacement[];
  days: number[];
  periodLabels: Record<string, string>;
}

export function EditorClient({
  versionId,
  placements: initial,
  days,
  periodLabels,
}: Props) {
  const [items, setItems] = useState<EditorPlacement[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
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
  const [savedTick, setSavedTick] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  function flashSaved() {
    setSavedTick(true);
    window.setTimeout(() => setSavedTick(false), 2000);
  }

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

  // live clash check — mirrors solver/checker.py hard rules H2/H1/H3/H6/H7/H9.
  // Anything this flags red, the publish gate will also block. Overrides downgrade to warn.
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
    const dayPeriods = new Map<number, number[]>();
    for (const key of Object.keys(periodLabels)) {
      const [d, pi] = key.split(":").map(Number);
      if (!dayPeriods.has(d)) dayPeriods.set(d, []);
      dayPeriods.get(d)!.push(pi);
    }
    for (const v of dayPeriods.values()) v.sort((a, b) => a - b);
    for (const p of items) {
      let status: SlotStatus = "ok";
      let reason = "";
      const fail = (r: string) => {
        status = "bad";
        reason = r;
      };
      // H6 capacity + H7 room type + H9 overrun: per-placement, checked first
      if (p.expected > p.roomCap) {
        fail(
          `${p.expected} students do not fit in ${p.roomCode} (capacity ${p.roomCap}).`,
        );
      } else if (
        p.requiredRoomType !== "any" &&
        p.roomType !== p.requiredRoomType
      ) {
        fail(
          `${p.sessionKey} needs a ${p.requiredRoomType.replace(/_/g, " ")}, but ${p.roomCode} is a ${p.roomType.replace(/_/g, " ")}.`,
        );
      } else {
        const slots = dayPeriods.get(p.day) ?? [];
        const idx = slots.indexOf(p.startPeriod);
        if (idx === -1 || idx + p.length > slots.length) {
          fail(
            `${p.sessionKey} needs ${p.length} consecutive periods but the day ends here.`,
          );
        } else {
          for (let j = 0; j < p.length; j++) {
            const others = (
              occ.get(`${p.day}:${p.startPeriod + j}`) ?? []
            ).filter((o) => o.id !== p.id);
            const roomClash = others.find((o) => o.roomId === p.roomId);
            if (roomClash) {
              fail(
                `${p.roomCode} is already booked by ${roomClash.sessionKey} at this time.`,
              );
              break;
            }
            const lecClash =
              p.lecturer !== "TBA" &&
              others.find((o) => o.lecturer === p.lecturer);
            if (lecClash) {
              fail(
                `${p.lecturer} teaches ${lecClash.sessionKey} at this time.`,
              );
              break;
            }
            if (!p.isElective) {
              const cohortClash = others.find(
                (o) =>
                  !o.isElective && o.cohorts.some((c) => p.cohorts.includes(c)),
              );
              if (cohortClash) {
                fail(
                  `${p.sessionKey} and ${cohortClash.sessionKey} share students who cannot be in two places.`,
                );
                break;
              }
            }
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
  }, [items, periodLabels]);

  const gridPeriods = useMemo(() => {
    const first = days[0];
    const idxs = periodIndexes.get(first ?? 1) ?? [];
    return idxs.map((pi) => ({
      index: pi,
      label: periodLabels[`${first}:${pi}`] ?? `P${pi}`,
    }));
  }, [days, periodIndexes, periodLabels]);

  const visible = (p: EditorPlacement) => {
    if (
      search &&
      !`${p.sessionKey} ${p.title} ${p.lecturer} ${p.roomCode}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    if (!showElectives && p.component.toLowerCase().includes("elect"))
      return false;
    if (!showPractical && p.component.toLowerCase().includes("pract"))
      return false;
    if (!showGroups && p.component.toLowerCase().includes("group"))
      return false;
    return true;
  };

  function placementAt(day: number, period: number) {
    return (
      items.find(
        (p) => p.day === day && p.startPeriod === period && visible(p),
      ) ?? null
    );
  }
  function coveredBy(day: number, period: number) {
    return (
      items.find(
        (p) =>
          p.day === day &&
          p.startPeriod < period &&
          period < p.startPeriod + p.length &&
          visible(p),
      ) ?? null
    );
  }

  async function dropOn(day: number, period: number) {
    if (!dragId) return;
    const p = items.find((i) => i.id === dragId);
    if (!p || p.locked) return;
    const before = { ...p };
    setItems((prev) =>
      prev.map((i) =>
        i.id === dragId ? { ...i, day, startPeriod: period } : i,
      ),
    );
    setDragId(null);
    setSaving(true);
    const res = await movePlacement(dragId, day, period, p.roomId);
    if (!res.error)
      await logChange(versionId, "move", before, {
        ...before,
        day,
        startPeriod: period,
      });
    setSaving(false);
  }

  async function toggleSelectedLock() {
    const sel = items.find((i) => i.id === selectedId);
    if (!sel) return;
    await toggleLock(sel.id, !sel.locked);
    setItems((prev) =>
      prev.map((i) => (i.id === sel.id ? { ...i, locked: !i.locked } : i)),
    );
  }

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const badCount = Object.values(statuses).filter((s) => s === "bad").length;

  const Toggle = ({
    on,
    onClick,
    label,
  }: {
    on: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between py-1 text-[13px] text-heading"
      aria-pressed={on}
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-150 ease",
          on ? "bg-primary" : "bg-cardline",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-[160ms] ease-[var(--ease-out)] motion-reduce:transition-none",
            on ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );

  return (
    <div className="-m-6 md:-m-8">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cardline bg-card px-6 py-3">
        <h1 className="mr-4 text-[17px] font-bold text-heading">
          Timetable Editor
        </h1>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          aria-label="Day range"
          className="h-9 rounded-lg border border-cardline bg-card px-2.5 text-[13px] text-heading outline-none focus:border-primary"
        >
          <option>Mon – Fri</option>
          <option>Mon – Sat</option>
        </select>
        <div className="relative">
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-9 w-44 rounded-lg border border-cardline bg-card py-2 pl-8 pr-2.5 text-[13px] text-heading outline-none placeholder:text-muted focus:border-primary"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {saving && (
            <span className="text-xs text-muted" role="status">
              Saving…
            </span>
          )}
          {savedTick && (
            <span className="text-xs font-medium text-ok-text" role="status">
              Saved.
            </span>
          )}
          {badCount > 0 && (
            <Pill tone="bad">
              {badCount} clash{badCount === 1 ? "" : "es"}
            </Pill>
          )}
          <button
            onClick={toggleSelectedLock}
            className={`${btnSecondaryCls} !h-9 !border-cardline !text-heading`}
            disabled={!selected}
          >
            <Lock size={14} aria-hidden /> Lock
          </button>
          <button
            className={`${btnPrimaryCls} !h-9`}
            disabled={badCount > 0 && !overrideOpen}
            title={
              badCount > 0 ?
                "This move breaks a rule, so it cannot be saved. You can override it, but you will need to give a reason."
              : undefined
            }
            onClick={() => {
              if (badCount > 0) setOverrideOpen(true);
              else flashSaved();
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-6">
        {/* filter panel */}
        <aside className="hidden w-52 shrink-0 rounded-xl border border-cardline bg-card p-4 lg:block">
          <label className="mb-1 block text-xs font-medium text-heading">
            Programme
          </label>
          <select
            value={prog}
            onChange={(e) => setProg(e.target.value)}
            className="mb-3 h-9 w-full rounded-lg border border-cardline bg-card px-2 text-[13px] text-heading outline-none focus:border-primary"
          >
            <option>All Programmes</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-heading">
            Level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mb-3 h-9 w-full rounded-lg border border-cardline bg-card px-2 text-[13px] text-heading outline-none focus:border-primary"
          >
            <option>All Levels</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-heading">
            Department
          </label>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="mb-3 h-9 w-full rounded-lg border border-cardline bg-card px-2 text-[13px] text-heading outline-none focus:border-primary"
          >
            <option>All Departments</option>
          </select>
          <div className="mt-1 space-y-0.5 border-t border-cardline pt-2">
            <Toggle
              on={showElectives}
              onClick={() => setShowElectives((v) => !v)}
              label="Show Electives"
            />
            <Toggle
              on={showPractical}
              onClick={() => setShowPractical((v) => !v)}
              label="Show Practical"
            />
            <Toggle
              on={showGroups}
              onClick={() => setShowGroups((v) => !v)}
              label="Show Groups"
            />
          </div>
          <button
            className={`${btnSecondaryCls} mt-4 w-full !border-cardline !text-heading`}
          >
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
                    <th
                      key={d}
                      className="px-2 py-2.5 text-left text-[13px] font-semibold text-heading"
                    >
                      {DAY_NAMES[d] ?? `Day ${d}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridPeriods.map((gp) => (
                  <tr key={gp.index}>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-[12px] font-medium text-body">
                      {gp.label}
                    </td>
                    {days.map((d) => {
                      if (coveredBy(d, gp.index)) return null;
                      const p = placementAt(d, gp.index);
                      if (!p) {
                        return (
                          <td
                            key={d}
                            className={cn(
                              "p-1 align-top",
                              dragId && "bg-primary/5",
                            )}
                            onDragOver={(e) => {
                              if (dragId) e.preventDefault();
                            }}
                            onDrop={() => dropOn(d, gp.index)}
                          >
                            <div className="flex min-h-[88px] items-center justify-center text-muted">
                              <span aria-hidden>–</span>
                            </div>
                          </td>
                        );
                      }
                      const st = statuses[p.id] ?? "ok";
                      const rowspan = Math.min(
                        p.length,
                        gridPeriods.length -
                          gridPeriods.findIndex((g) => g.index === gp.index),
                      );
                      const gs = {
                        id: p.id,
                        courseCodes:
                          p.courses.length ? p.courses : [p.sessionKey],
                        title: p.title,
                        lecturer: p.lecturer,
                        room: p.roomCode,
                        locked: p.locked,
                      };
                      const hov =
                        hoverId === p.id && (st === "bad" || st === "warn");
                      return (
                        <td
                          key={d}
                          rowSpan={rowspan > 1 ? rowspan : undefined}
                          className="relative p-1 align-top"
                          onDragOver={(e) => {
                            if (dragId) e.preventDefault();
                          }}
                          onDrop={() => dropOn(d, gp.index)}
                        >
                          <div
                            draggable={!p.locked}
                            onDragStart={() => setDragId(p.id)}
                            onDragEnd={() => setDragId(null)}
                            onMouseEnter={() => setHoverId(p.id)}
                            onMouseLeave={() =>
                              setHoverId((h) => (h === p.id ? null : h))
                            }
                            className={
                              dragId === p.id ? "opacity-60" : "cursor-grab"
                            }
                          >
                            <TimetableCell
                              session={gs}
                              status={st}
                              reason={reasons[p.id]}
                              selected={selectedId === p.id}
                              onClick={() => setSelectedId(p.id)}
                            />
                          </div>
                          {hov && (
                            <ClashPopover
                              tone={st === "bad" ? "bad" : "warn"}
                              title={
                                st === "bad" ? "Hard clash" : "Fits, but check"
                              }
                              reason={reasons[p.id] ?? ""}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 hidden text-xs text-muted lg:block">
            {DAY_FULL[days[0]]}–{DAY_FULL[days[days.length - 1]]} · {range} ·
            drag a block to move it, hover a red cell for the reason.
          </p>
        </div>
      </div>
      {overrideOpen && selected && (
        <div
          className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOverrideOpen(false)}
        >
          <div
            className="modal-panel w-full max-w-md rounded-xl border border-cardline bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-heading">
              Override a rule
            </h2>
            <p className="mt-1 text-[13px] text-body">
              This move breaks a rule: {reasons[selected.id]}. You can override
              it, but you will need to give a reason.
            </p>
            <label
              className="mt-4 block text-[13px] font-medium text-heading"
              htmlFor="override-reason"
            >
              Reason for overriding (required)
            </label>
            <textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-cardline bg-card px-3 py-2 text-[13px] text-heading outline-none focus:border-primary"
              placeholder="e.g. LT2 projector fixed after week 3"
            />
            <p className="mt-1 text-xs text-muted">
              This is saved in the change log.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className={`${btnSecondaryCls} !border-cardline !text-heading`}
                onClick={() => setOverrideOpen(false)}
              >
                Cancel
              </button>
              <button
                className={btnPrimaryCls}
                disabled={!overrideReason.trim()}
                onClick={async () => {
                  const p = items.find((i) => i.id === selected.id);
                  if (p) {
                    await logChange(
                      versionId,
                      `override: ${overrideReason.trim()}`,
                      p,
                      p,
                    );
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === p.id ?
                          { ...i, overrideReason: overrideReason.trim() }
                        : i,
                      ),
                    );
                  }
                  setOverrideOpen(false);
                  setOverrideReason("");
                  flashSaved();
                }}
              >
                Override and save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

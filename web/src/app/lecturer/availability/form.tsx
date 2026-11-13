"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/ui";
import { btnPrimaryCls } from "@/components/ui";
import { cn } from "@/lib/cn";
import { saveAvailability } from "@/app/actions/availability";

type Cell = "available" | "preferred" | "unavailable";
const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const cellCls: Record<Cell, string> = {
  available: "bg-paper hover:bg-canvas",
  preferred: "bg-indigo-deep/10 hover:bg-indigo-deep/20",
  unavailable: "bg-ink text-white hover:bg-body",
};

export function AvailabilityForm({ semesterId, semesterName, days, maxPeriod, initial }: {
  semesterId: string;
  semesterName: string;
  days: number[];
  maxPeriod: number;
  initial: Record<string, string>;
}) {
  const [grid, setGrid] = useState<Record<string, Cell>>(() => {
    const g: Record<string, Cell> = {};
    for (const d of days) for (let p = 1; p <= maxPeriod; p++) {
      g[`${d}:${p}`] = (initial[`${d}:${p}`] as Cell) ?? "available";
    }
    return g;
  });
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const cycle = (d: number, p: number) => {
    const order: Cell[] = ["available", "preferred", "unavailable"];
    const k = `${d}:${p}`;
    setGrid((g) => ({ ...g, [k]: order[(order.indexOf(g[k]) + 1) % 3] }));
  };
  const setDay = (d: number, v: Cell) =>
    setGrid((g) => {
      const next = { ...g };
      for (let p = 1; p <= maxPeriod; p++) next[`${d}:${p}`] = v;
      return next;
    });

  const counts = {
    unavailable: Object.values(grid).filter((c) => c === "unavailable").length,
    preferred: Object.values(grid).filter((c) => c === "preferred").length,
  };

  const submit = () =>
    start(async () => {
      const cells = Object.entries(grid).map(([k, status]) => {
        const [day, period] = k.split(":").map(Number);
        return { day, period, status };
      });
      const r = await saveAvailability(semesterId, cells);
      setMsg(r.error ?? `Saved — ${r.saved ?? 0} non-default cells.`);
    });

  return (
    <>
      <PageHeader
        title="Availability"
        sub={`${semesterName} · click a cell to cycle Available → Preferred → Unavailable`}
        actions={<button className={btnPrimaryCls} disabled={pending} onClick={submit}>{pending ? "Saving…" : "Submit availability"}</button>}
      />
      {msg && <div className="mb-3 border border-line bg-paper p-3 text-[13px]">{msg}</div>}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 border border-line bg-paper" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 bg-indigo-deep/20" /> Preferred</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 bg-ink" /> Unavailable</span>
        <span className="ml-auto">{counts.unavailable} unavailable · {counts.preferred} preferred</span>
      </div>
      <div className="tt-scroll overflow-auto border border-line bg-paper">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr>
              <th className="w-20 border-b border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-muted" />
              {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
                <th key={p} className="border-b border-l border-line bg-canvas-2 px-1 py-2 text-center text-[11px] font-medium text-muted">P{p}</th>
              ))}
              <th className="w-40 border-b border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-muted">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d}>
                <td className="border-b border-line bg-canvas-2 px-2 py-2 text-xs font-medium text-ink">{DAY_NAMES[d] ?? `Day ${d}`}</td>
                {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
                  <td key={p} className="border-b border-l border-line p-0">
                    <button
                      onClick={() => cycle(d, p)}
                      title={`${DAY_NAMES[d]} P${p} — ${grid[`${d}:${p}`]}`}
                      className={cn("block h-9 w-full text-[10px] font-medium transition-colors", cellCls[grid[`${d}:${p}`]])}
                    >
                      {grid[`${d}:${p}`] === "unavailable" ? "✕" : grid[`${d}:${p}`] === "preferred" ? "★" : ""}
                    </button>
                  </td>
                ))}
                <td className="border-b border-line px-2 py-1">
                  <div className="flex gap-1">
                    <button onClick={() => setDay(d, "unavailable")} className="border border-line px-1.5 py-1 text-[11px] text-muted hover:text-ink">Day off</button>
                    <button onClick={() => setDay(d, "available")} className="border border-line px-1.5 py-1 text-[11px] text-muted hover:text-ink">Clear</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Unavailable periods are a hard rule (H8); preferred feeds P1.</p>
    </>
  );
}

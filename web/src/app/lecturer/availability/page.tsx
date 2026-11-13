"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { btnPrimaryCls } from "@/components/ui";
import { SAMPLE_PERIODS } from "@/components/timetable";
import { cn } from "@/lib/cn";

type Cell = "available" | "preferred" | "unavailable";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const cellCls: Record<Cell, string> = {
  available: "bg-paper hover:bg-canvas",
  preferred: "bg-indigo-deep/10 hover:bg-indigo-deep/20",
  unavailable: "bg-ink text-white hover:bg-body",
};

export function AvailabilityGrid({ heading, sub }: { heading: string; sub: string }) {
  const [grid, setGrid] = useState<Cell[][]>(
    DAYS.map(() => SAMPLE_PERIODS.map(() => "available" as Cell))
  );
  const cycle = (d: number, p: number) => {
    const order: Cell[] = ["available", "preferred", "unavailable"];
    setGrid((g) => {
      const next = g.map((row) => [...row]);
      next[d][p] = order[(order.indexOf(g[d][p]) + 1) % 3];
      return next;
    });
  };
  const setDay = (d: number, v: Cell) =>
    setGrid((g) => g.map((row, i) => (i === d ? row.map(() => v) : row)));

  const counts = {
    unavailable: grid.flat().filter((c) => c === "unavailable").length,
    preferred: grid.flat().filter((c) => c === "preferred").length,
  };

  return (
    <>
      <PageHeader
        title={heading}
        sub={sub}
        actions={<button className={btnPrimaryCls}>Submit availability</button>}
      />
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
              {SAMPLE_PERIODS.map((p) => (
                <th key={p.index} className="border-b border-l border-line bg-canvas-2 px-1 py-2 text-center text-[11px] font-medium text-muted">
                  P{p.index}
                </th>
              ))}
              <th className="w-40 border-b border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-muted">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, d) => (
              <tr key={day}>
                <td className="border-b border-line bg-canvas-2 px-2 py-2 text-xs font-medium text-ink">{day}</td>
                {SAMPLE_PERIODS.map((p, pi) => (
                  <td key={p.index} className="border-b border-l border-line p-0">
                    <button
                      onClick={() => cycle(d, pi)}
                      title={`${day} P${p.index} — ${grid[d][pi]}`}
                      className={cn("block h-9 w-full text-[10px] font-medium transition-colors", cellCls[grid[d][pi]])}
                    >
                      {grid[d][pi] === "unavailable" ? "✕" : grid[d][pi] === "preferred" ? "★" : ""}
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
      <p className="mt-2 text-xs text-muted">Unavailable periods are a hard rule (H8); preferred feeds P1. Add a reason for multi-day blocks — visible to admins only.</p>
    </>
  );
}

export default function LecturerAvailability() {
  return (
    <Shell role="lecturer" active="/lecturer/availability">
      <AvailabilityGrid
        heading="Availability"
        sub="2026/27 Semester 1 · deadline Fri 20 Nov — click a cell to cycle Available → Preferred → Unavailable"
      />
    </Shell>
  );
}

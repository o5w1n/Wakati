"use client";

import { useState } from "react";
import { StatusBadge, Field } from "@/components/ui";
import { btnPrimaryCls, inputCls } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { RoomRow } from "./roomviews";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RoomDay({ role, rooms, days, maxPeriod, occ }: {
  role: "lecturer" | "student";
  rooms: RoomRow[];
  days: number[];
  maxPeriod: number;
  occ: Record<string, Record<string, string>>;
}) {
  const [day, setDay] = useState(days[0] ?? 1);
  const [fDay, setFDay] = useState(days[0] ?? 1);
  const [fPeriod, setFPeriod] = useState(1);
  const [fCap, setFCap] = useState(30);
  const [searched, setSearched] = useState(false);

  const code = (roomId: string, d: number, p: number) => occ[roomId]?.[`${d}:${p}`] ?? null;
  const free = rooms.filter((r) => r.capacity >= fCap && !code(r.id, fDay, fPeriod));

  return (
    <>
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={cn(
              "min-w-14 flex-1 border px-2 py-2 text-[13px]",
              day === d ? "border-ink bg-ink font-medium text-white" : "border-line bg-paper text-muted"
            )}
          >
            {DAY_NAMES[d] ?? `Day ${d}`}
          </button>
        ))}
      </div>
      {rooms.length === 0 ? (
        <p className="mb-6 border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">
          No rooms imported yet.
        </p>
      ) : (
        <div className="tt-scroll mb-6 overflow-auto border border-line bg-paper">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 border-b border-r border-line bg-canvas-2 px-3 py-2 text-left text-xs font-medium text-muted">Room</th>
                {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
                  <th key={p} className="border-b border-line bg-canvas-2 px-2 py-2 text-center text-[11px] font-medium text-muted">P{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td className="sticky left-0 border-b border-r border-line bg-paper px-3 py-2">
                    <span className="font-semibold text-ink">{r.code}</span>
                    <span className="ml-2 text-xs text-muted">{r.type} · {r.capacity}</span>
                  </td>
                  {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => {
                    const c = code(r.id, day, p);
                    return (
                      <td key={p} className="border-b border-line px-1 py-1 text-center" title={c ?? `Free`}>
                        {c ? (
                          <span className="inline-block bg-canvas-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">{c}</span>
                        ) : (
                          <span className="text-muted">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="border border-line bg-paper p-4">
        <div className="mb-3 text-sm font-medium text-ink">Free-room finder</div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Day">
            <select value={fDay} onChange={(e) => setFDay(Number(e.target.value))} className={inputCls}>
              {days.map((d) => <option key={d} value={d}>{DAY_NAMES[d] ?? `Day ${d}`}</option>)}
            </select>
          </Field>
          <Field label="Period">
            <select value={fPeriod} onChange={(e) => setFPeriod(Number(e.target.value))} className={inputCls}>
              {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p}</option>)}
            </select>
          </Field>
          <Field label="Min seats">
            <input type="number" value={fCap} min={1} onChange={(e) => setFCap(Number(e.target.value))} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <button className={btnPrimaryCls} onClick={() => setSearched(true)}>Find rooms</button>
          </div>
        </div>
        {searched && (
          <div className="mt-3 border-t border-line pt-3">
            {free.length === 0 ? (
              <p className="text-[13px] text-muted">
                No room seats {fCap}+ free on {DAY_NAMES[fDay]} P{fPeriod}. Try a smaller group or another period.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {free.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-[13px]">
                    <span><strong className="text-ink">{r.code}</strong> <span className="text-muted">· {r.type} · seats {r.capacity}</span></span>
                    <StatusBadge tone="ok">Free {DAY_NAMES[fDay]} P{fPeriod}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted">
              {role === "lecturer"
                ? "Suggestions only — bookings go through the Registry."
                : "Suggestions only — ask your lecturer or Registry to book a room."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}

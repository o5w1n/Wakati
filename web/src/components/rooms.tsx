"use client";

import { useState } from "react";
import { PageHeader, StatusBadge, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";
import { SAMPLE_PERIODS } from "@/components/timetable";
import { cn } from "@/lib/cn";

export const ROOMS = [
  { id: "L-1", capacity: 120, type: "Lecture hall" },
  { id: "L-3", capacity: 80, type: "Lecture hall" },
  { id: "Lab-A", capacity: 45, type: "Computer lab" },
  { id: "Lab-B", capacity: 45, type: "Computer lab" },
  { id: "SR-2", capacity: 30, type: "Seminar room" },
];

// sparse occupancy: "room|day(1-5)|period(1-9)" -> course code
const OCC: Record<string, string> = {
  "L-1|1|1": "CS302", "L-1|1|2": "CS302", "L-1|4|6": "CW400",
  "L-1|2|3": "CS4135", "L-1|2|4": "CS4135",
  "L-3|2|3": "CS4135", "L-3|2|4": "CS4135", "L-3|3|2": "ML401",
  "Lab-A|3|5": "ML401", "Lab-A|3|6": "ML401", "Lab-A|1|4": "CS302",
  "Lab-B|3|5": "ML401", "Lab-B|4|3": "CRY402",
  "SR-2|5|2": "CW400",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const occ = (room: string, day: number, period: number) => OCC[`${room}|${day}|${period}`] ?? null;

export function RoomViews({ role, heading, sub }: { role: "lecturer" | "student"; heading: string; sub: string }) {
  const [day, setDay] = useState(2);
  const [fDay, setFDay] = useState(3);
  const [fPeriod, setFPeriod] = useState(5);
  const [fCap, setFCap] = useState(30);
  const [searched, setSearched] = useState(false);

  const free = ROOMS.filter((r) => r.capacity >= fCap && !occ(r.id, fDay, fPeriod));

  return (
    <>
      <PageHeader title={heading} sub={sub} />
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setDay(i + 1)}
            className={cn(
              "min-w-14 flex-1 border px-2 py-2 text-[13px]",
              day === i + 1 ? "border-ink bg-ink font-medium text-white" : "border-line bg-paper text-muted"
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="tt-scroll mb-6 overflow-auto border border-line bg-paper">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-r border-line bg-canvas-2 px-3 py-2 text-left text-xs font-medium text-muted">Room</th>
              {SAMPLE_PERIODS.map((p) => (
                <th key={p.index} className="border-b border-line bg-canvas-2 px-2 py-2 text-center text-[11px] font-medium text-muted">
                  P{p.index}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOMS.map((r) => (
              <tr key={r.id}>
                <td className="sticky left-0 border-b border-r border-line bg-paper px-3 py-2">
                  <span className="font-semibold text-ink">{r.id}</span>
                  <span className="ml-2 text-xs text-muted">{r.type} · {r.capacity}</span>
                </td>
                {SAMPLE_PERIODS.map((p) => {
                  const code = occ(r.id, day, p.index);
                  return (
                    <td key={p.index} className="border-b border-line px-1 py-1 text-center" title={code ? `${code} · ${p.label}` : `Free · ${p.label}`}>
                      {code ? (
                        <span className="inline-block bg-canvas-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">{code}</span>
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

      <section className="border border-line bg-paper p-4">
        <div className="mb-3 text-sm font-medium text-ink">Free-room finder</div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Day">
            <select value={fDay} onChange={(e) => setFDay(Number(e.target.value))} className={inputCls}>
              {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </Field>
          <Field label="Period">
            <select value={fPeriod} onChange={(e) => setFPeriod(Number(e.target.value))} className={inputCls}>
              {SAMPLE_PERIODS.map((p) => <option key={p.index} value={p.index}>P{p.index} · {p.label}</option>)}
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
                No room seats {fCap}+ free on {DAYS[fDay - 1]} P{fPeriod}. Try a smaller group or another period.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {free.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-[13px]">
                    <span><strong className="text-ink">{r.id}</strong> <span className="text-muted">· {r.type} · seats {r.capacity}</span></span>
                    <StatusBadge tone="ok">Free {DAYS[fDay - 1]} P{fPeriod}</StatusBadge>
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

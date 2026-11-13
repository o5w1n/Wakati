"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Pill, btnPrimaryCls, inputCls } from "@/components/ui";

export interface FinderRoom { code: string; name: string }

const SAMPLE: FinderRoom[] = [
  { code: "LT1", name: "Lecture Theatre 1" },
  { code: "LT2", name: "Lecture Theatre 2" },
  { code: "LT3", name: "Lecture Theatre 3" },
  { code: "LAB1", name: "Computer Lab 1" },
  { code: "LAB2", name: "Computer Lab 2" },
];

export function RoomFinderClient({ rooms, taken }: { rooms: FinderRoom[]; taken: Set<string> }) {
  const [day, setDay] = useState("Mon, 13 Oct 2025");
  const [period, setPeriod] = useState("8:00 – 10:00");
  const [ran, setRan] = useState(true);

  const list = (rooms.length > 0 ? rooms : SAMPLE).filter((r) => !taken.has(r.code));

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-page px-6 py-6">
      <div className="flex items-center gap-2">
        <Link href="/student" aria-label="Back" className="text-heading transition-colors hover:text-primary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-heading">Room Finder</h1>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-36 flex-1">
          <label htmlFor="rf-day" className="mb-1 block text-xs font-medium text-heading">Date</label>
          <select id="rf-day" value={day} onChange={(e) => setDay(e.target.value)} className={inputCls}>
            <option>Mon, 13 Oct 2025</option>
            <option>Tue, 14 Oct 2025</option>
            <option>Wed, 15 Oct 2025</option>
          </select>
        </div>
        <div className="min-w-36 flex-1">
          <label htmlFor="rf-period" className="mb-1 block text-xs font-medium text-heading">Period</label>
          <select id="rf-period" value={period} onChange={(e) => setPeriod(e.target.value)} className={inputCls}>
            <option>8:00 – 10:00</option>
            <option>10:00 – 12:00</option>
            <option>12:00 – 2:00</option>
          </select>
        </div>
        <button onClick={() => setRan(true)} className={btnPrimaryCls}>
          <Search size={14} aria-hidden /> Find Rooms
        </button>
      </div>

      {ran && (
        <>
          <h2 className="mt-6 text-[15px] font-bold text-heading">Available Rooms ({list.length})</h2>
          {list.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-cardline bg-card p-6 text-center text-[13px] text-muted">
              Nothing free in this slot — try another period.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-cardline rounded-xl border border-cardline bg-card">
              {list.map((r) => (
                <li key={r.code} className="flex items-center gap-2.5 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-ok-text" aria-label="Free" />
                  <span className="text-[13px] font-bold text-heading">{r.code}</span>
                  <span className="text-[13px] text-body">• {r.name}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">Rooms are shown as free per the timetable; they cannot be booked here.</p>
          <Pill tone="neutral">
            {day} · {period}
          </Pill>
        </>
      )}
    </div>
  );
}

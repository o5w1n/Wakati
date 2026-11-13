"use client";

import { useState } from "react";
import { Lock, Unlock, RotateCcw, RotateCw, Search, PanelRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { TimetableGrid, SAMPLE_DAYS, SAMPLE_PERIODS, type SlotStatus } from "@/components/timetable";
import { cn } from "@/lib/cn";

export default function EditorPage() {
  const [selected, setSelected] = useState<string | null>("s2");
  const [filter, setFilter] = useState("");

  // demo statuses: s2 amber (preference), s3 red (hard clash) with plain-language reasons
  const statuses: Record<string, SlotStatus> = { s1: "ok", s2: "warn", s3: "bad", s4: "ok" };
  const reasons: Record<string, string> = {
    s2: "Last period of the day — outside Dr. Yamak's preferred window (P1, −15).",
    s3: "Hard clash: Lab-B seats 45 but 78 students enrolled (H6). Needs override to save.",
  };

  return (
    <Shell role="registry" active="/registry/editor">
      <PageHeader
        title="Editor"
        sub="Draft v3 · score 94.2 · 2 unplaced — drag a session, slots colour live"
        actions={
          <>
            <button className={btnSecondaryCls}><RotateCcw size={15} /> Undo</button>
            <button className={btnSecondaryCls}><RotateCw size={15} /> Redo</button>
            <button className={btnPrimaryCls}>Publish</button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter programme, level, lecturer, room…"
            className="h-9 w-72 border border-line bg-paper pl-8 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-indigo-deep"
          />
        </div>
        {["All levels", "100", "200", "300", "400"].map((l, i) => (
          <button
            key={l}
            className={cn(
              "h-9 border px-3 text-[13px]",
              i === 0 ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted hover:text-ink"
            )}
          >
            {l}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 bg-ok-text" /> valid</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 bg-warn-text" /> preference</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 bg-bad-text" /> clash</span>
        </span>
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <TimetableGrid
            days={SAMPLE_DAYS}
            periods={SAMPLE_PERIODS}
            statuses={statuses}
            reasons={reasons}
            selectedId={selected}
            onSelect={setSelected}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>2 unplaced: <button className="text-indigo-deep hover:underline">PH301-P1 — no lab free when CS300 + Dr. Owusu are free</button></span>
            <StatusBadge tone="warn">Unplaced sessions never publish silently</StatusBadge>
          </div>
        </div>

        <aside className="hidden w-72 shrink-0 border border-line bg-paper lg:block">
          {selected ? (
            <div>
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="text-sm font-medium text-ink">Session</span>
                <button className="flex items-center gap-1 text-xs text-muted hover:text-ink">
                  <Lock size={13} /> Lock
                </button>
              </div>
              <div className="space-y-3 px-4 py-3 text-[13px]">
                <div>
                  <div className="font-semibold text-ink">AI4136 / CS4135 — Computer Security</div>
                  <div className="mt-0.5 text-muted">Theory · 2 periods · 1×/week · 80 students</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="warn">Amber — preference</StatusBadge>
                </div>
                <p className="text-muted">Last period of the day, outside the lecturer's preferred window (P1, −15). Valid — no override needed.</p>
                <div className="flex gap-2 pt-1">
                  <button className={btnPrimaryCls}>Find a slot</button>
                  <button className={btnSecondaryCls}><Unlock size={14} /> Swap</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No session selected" sub="Click a cell to inspect, lock, or reassign it." />
            </div>
          )}
          <div className="hidden"><PanelRight size={0} /></div>
        </aside>
      </div>
    </Shell>
  );
}

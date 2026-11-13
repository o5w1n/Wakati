"use client";

import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls, inputCls } from "@/components/ui";
import { TimetableGrid, SAMPLE_DAYS, SAMPLE_PERIODS, type SlotStatus } from "@/components/timetable";

const V8_STATUSES: Record<string, SlotStatus> = { s1: "ok", s2: "ok", s3: "warn", s4: "ok" };
const V8_REASONS: Record<string, string> = {
  s3: "Soft preference: last period of the day, outside preferred window (P1, −15).",
};

const VERSIONS = [
  { v: "v8 (draft)", when: "13 Nov 09:12", by: "Registry Admin", score: "96", hard: "1", status: "Draft" },
  { v: "v7", when: "10 Nov 17:40", by: "Registry Admin", score: "100", hard: "0", status: "Published" },
  { v: "v6", when: "7 Nov 15:02", by: "Registry Admin", score: "91", hard: "0", status: "Archived" },
];

export default function Publish() {
  const [phase, setPhase] = useState<"draft" | "review" | "published">("draft");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <Shell role="registry" active="/registry/publish">
      <PageHeader
        title="Review & Publish"
        sub="Semester 1 2026/27 · BSc programmes"
        actions={
          phase === "draft" ? (
            <button className={btnPrimaryCls} onClick={() => setPhase("review")}>Submit for review →</button>
          ) : phase === "review" ? (
            <>
              <button className={btnSecondaryCls} onClick={() => setPhase("draft")}>Back to draft</button>
              <Link href="/registry/editor" className={btnSecondaryCls}>Open in editor</Link>
              <button className={btnPrimaryCls} onClick={() => setPhase("published")}>Publish v8</button>
            </>
          ) : null
        }
      />

      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-0 text-[13px]">
        {(["Draft", "Under review", "Published"] as const).map((s, i) => {
          const idx = phase === "draft" ? 0 : phase === "review" ? 1 : 2;
          const done = i < idx, now = i === idx;
          return (
            <li key={s} className="flex items-center">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${done ? "border-indigo-deep bg-indigo-deep text-white" : now ? "border-indigo-deep text-indigo-deep" : "border-line text-muted"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`mx-2 ${now ? "font-medium text-ink" : "text-muted"}`}>{s}</span>
              {i < 2 && <span className="mx-2 h-px w-10 bg-line sm:w-20" />}
            </li>
          );
        })}
      </ol>

      {phase === "published" && (
        <div className="mb-4 border border-line border-l-4 border-l-indigo-deep bg-paper p-4 text-[13px]">
          <span className="font-medium">v8 is live.</span> Lecturers and 1,170 students can now see their
          personal timetables. Previous version v7 is archived and restorable.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="border border-line bg-paper p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-ink">Version comparison — v8 draft vs v7 published</div>
            <StatusBadge tone="ok">−0 hard clashes</StatusBadge>
          </div>
          <TimetableGrid days={SAMPLE_DAYS} periods={SAMPLE_PERIODS} statuses={V8_STATUSES} reasons={V8_REASONS} />
          <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
            <div className="border border-line p-3"><div className="font-medium">12 sessions moved</div><div className="text-muted">vs v7, mostly Lab-A reshuffle</div></div>
            <div className="border border-line p-3"><div className="font-medium">Score 96 → 100</div><div className="text-muted">soft-penalty sum fell</div></div>
            <div className="border border-line p-3">
              <div className="font-medium">1 soft preference left</div>
              <div className="text-muted">ML401 last-period slot</div>
              <button className="mt-1 text-indigo-deep hover:underline" onClick={() => setOverrideOpen(true)}>Override with reason…</button>
            </div>
          </div>
        </section>

        <section className="border border-line bg-paper p-4">
          <div className="mb-3 text-sm font-medium text-ink">Version history</div>
          {VERSIONS.map((v) => (
            <div key={v.v} className="border-b border-line py-2.5 text-[13px] last:border-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{v.v}</span>
                <StatusBadge tone={v.status === "Published" ? "ok" : v.status === "Draft" ? "warn" : "neutral"}>{v.status}</StatusBadge>
              </div>
              <div className="mt-0.5 text-muted">{v.when} · {v.by} · score {v.score} · {v.hard} hard</div>
            </div>
          ))}
        </section>
      </div>

      {overrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md border border-line bg-paper p-5">
            <div className="mb-1 text-sm font-medium text-ink">Override with reason</div>
            <p className="mb-4 text-[13px] text-muted">
              Overrides are for soft preferences only — hard clashes can never be overridden into a published
              version. The reason is stored on the placement and shown to anyone who hovers the slot.
            </p>
            <Field label="Reason (required)">
              <input placeholder="e.g. Lab-A only free at last period on Wednesdays…" className={inputCls} />
            </Field>
            <label className="mt-3 flex items-start gap-2 text-[13px]">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
              I accept responsibility for publishing this soft preference, logged under my name.
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button className={btnSecondaryCls} onClick={() => setOverrideOpen(false)}>Cancel</button>
              <button className={btnPrimaryCls} disabled={!accepted} onClick={() => setOverrideOpen(false)}>Log override</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

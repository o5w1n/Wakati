"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { importCsvs } from "@/app/actions/import";
import { supabaseBrowser } from "@/lib/supabase-client";

const FILES = [
  "programmes.csv", "lecturers.csv", "rooms.csv", "courses.csv",
  "cohorts.csv", "cohort_courses.csv", "students.csv", "periods.csv",
  "sessions.csv", "session_courses.csv", "elective_choices.csv",
  "lecturer_availability.csv", "blocked_slots.csv",
];

import type { ImportResult } from "@/app/actions/import";

const initial: ImportResult = { ok: false };

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(
    async (_: typeof initial, form: FormData) => await importCsvs(form),
    initial
  );
  const [semesters, setSemesters] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabaseBrowser().from("semesters").select("id,name").order("created_at", { ascending: false })
      .then(({ data }) => setSemesters((data as { id: string; name: string }[] | null) ?? []));
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Import CSVs</h2>
          <button onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          Upload any of the 13 template files. Headers are validated; rows link by code, not by id.
        </p>
        <form action={action} className="mt-4 space-y-3">
          <label className="block text-[13px]">
            <span className="mb-1 block font-medium text-ink">Semester (required for sessions, periods, availability)</span>
            <select name="semester_id" className="h-9 w-full border border-line bg-paper px-2 text-[13px]">
              <option value="">Master data only (no semester files)</option>
              {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <div className="grid gap-2">
            {FILES.map((f) => (
              <label key={f} className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-[13px]">
                <span className="font-mono text-ink">{f}</span>
                <input type="file" name={f} accept=".csv" className="max-w-[220px] text-xs text-muted" />
              </label>
            ))}
          </div>
          {state?.errors && state.errors.length > 0 && (
            <ul className="max-h-40 overflow-y-auto border border-line p-2 text-[12px] text-bad-text">
              {state.errors.map((e, i) => <li key={i}>{e.file || "general"}:{e.line} — {e.error}</li>)}
            </ul>
          )}
          {state?.ok && state.inserted && (
            <p className="text-[13px] text-ok-text">
              Imported: {Object.entries(state.inserted).map(([t, n]) => `${t} ×${n}`).join(", ")}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={btnSecondaryCls}>Close</button>
            <button type="submit" disabled={pending} className={btnPrimaryCls}>
              <Upload size={15} /> {pending ? "Importing…" : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

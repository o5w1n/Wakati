"use client";

import { useActionState, useEffect } from "react";
import { Field } from "@/components/ui";
import { btnSecondaryCls, inputCls } from "@/components/ui";
import { FileText, FileSpreadsheet } from "lucide-react";
import { exportGrid, type ExportResult } from "@/app/actions/export-grid";

const initial: ExportResult = { ok: false };

async function runExport(_prev: ExportResult, form: FormData): Promise<ExportResult> {
  return exportGrid(form);
}

export function ExportForm({ versions }: { versions: { id: string; status: string; created_at: string }[] }) {
  const [result, action, pending] = useActionState(runExport, initial);

  useEffect(() => {
    if (result.ok && result.b64 && result.filename) {
      const bytes = Uint8Array.from(atob(result.b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [result]);

  return (
    <form action={action} className="grid gap-3">
      {result.error && <div className="border border-line bg-paper p-3 text-[13px] text-red-800">{result.error}</div>}
      {result.ok && <div className="border border-line border-l-4 border-l-indigo-deep bg-paper p-3 text-[13px]"><span className="font-medium">{result.filename}</span> is ready — check your downloads.</div>}
      <Field label="Version">
        <select name="version_id" className={inputCls} defaultValue={versions[0]?.id ?? ""}>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.status}{v.status === "draft" ? " (watermarked)" : ""} · {new Date(v.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Scope">
        <select name="scope" className={inputCls} defaultValue="all">
          <option value="all">Whole institution</option>
          <option value="lecturer">Per-lecturer sheets</option>
          <option value="room">Room utilisation</option>
        </select>
      </Field>
      <div className="flex flex-wrap gap-2">
        <button className={btnSecondaryCls} disabled={pending}><FileText size={15} /> {pending ? "Building…" : "Master grid (CSV)"}</button>
        <button className={btnSecondaryCls} disabled={pending}><FileSpreadsheet size={15} /> Sorted export (CSV)</button>
      </div>
      <p className="text-xs text-muted">CSV opens in Excel. PDF layouts arrive with the print styles pass.</p>
    </form>
  );
}

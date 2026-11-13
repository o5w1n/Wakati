"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field } from "@/components/ui";
import { btnSecondaryCls, inputCls } from "@/components/ui";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

const HISTORY = [
  { id: "1", what: "Full grid — v7 (PDF)", by: "Registry Admin", when: "10 Nov 17:52", size: "184 KB" },
  { id: "2", what: "Per-lecturer sheets — v7 (Excel)", by: "Registry Admin", when: "10 Nov 17:53", size: "96 KB" },
  { id: "3", what: "Room utilisation — v7 (PDF)", by: "Registry Admin", when: "8 Nov 10:14", size: "72 KB" },
];

export default function Exports() {
  const [done, setDone] = useState<string | null>(null);
  const run = (label: string) => setDone(label);
  return (
    <Shell role="registry" active="/registry/exports">
      <PageHeader title="Exports" sub="Published version v7. Drafts export with a DRAFT watermark." />
      {done && (
        <div className="mb-4 border border-line border-l-4 border-l-indigo-deep bg-paper p-3 text-[13px]">
          <span className="font-medium">{done}</span> is ready — check your downloads.
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">New export</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Version">
              <select className={inputCls} defaultValue="v7">
                <option>v8 (draft — watermarked)</option>
                <option>v7 (published)</option>
                <option>v6 (archived)</option>
              </select>
            </Field>
            <Field label="Scope">
              <select className={inputCls} defaultValue="all">
                <option value="all">Whole institution</option>
                <option value="cohort">One cohort…</option>
                <option value="lecturer">One lecturer…</option>
                <option value="room">One room…</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={btnSecondaryCls} onClick={() => run("Master grid (PDF)")}>
              <FileText size={15} /> Master grid (PDF)
            </button>
            <button className={btnSecondaryCls} onClick={() => run("Per-lecturer sheets (Excel)")}>
              <FileSpreadsheet size={15} /> Per-lecturer (Excel)
            </button>
            <button className={btnSecondaryCls} onClick={() => run("Per-cohort sheets (Excel)")}>
              <FileSpreadsheet size={15} /> Per-cohort (Excel)
            </button>
            <button className={btnSecondaryCls} onClick={() => run("Room utilisation (PDF)")}>
              <FileText size={15} /> Room utilisation (PDF)
            </button>
          </div>
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-3 text-sm font-medium text-ink">Recent exports</div>
          {HISTORY.map((h) => (
            <div key={h.id} className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0">
              <span>
                <span className="font-medium text-ink">{h.what}</span>
                <span className="mt-0.5 block text-muted">{h.by} · {h.when} · {h.size}</span>
              </span>
              <button className="flex items-center gap-1 text-indigo-deep hover:underline">
                <Download size={14} /> Again
              </button>
            </div>
          ))}
          <div className="mt-3">
            <StatusBadge tone="neutral">Exports never contain passwords or tokens</StatusBadge>
          </div>
        </section>
      </div>
    </Shell>
  );
}

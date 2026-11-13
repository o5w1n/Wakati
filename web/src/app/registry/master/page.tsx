"use client";

import { useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { DataTable } from "@/components/datatable";
import { cn } from "@/lib/cn";
import { supabaseBrowser } from "@/lib/supabase-client";
import { ImportDialog } from "./import-dialog";

const TABS = ["Lecturers", "Rooms", "Programmes", "Cohorts", "Courses", "Sessions", "Students"] as const;
type Tab = (typeof TABS)[number];
type Row = { id: string; [k: string]: string };

const QUERIES: Record<Tab, { table: string; select: string }> = {
  Lecturers: { table: "lecturers", select: "id,name,email,department,employment_type" },
  Rooms: { table: "rooms", select: "id,code,building,capacity,type" },
  Programmes: { table: "programmes", select: "id,code,name,department" },
  Cohorts: { table: "cohorts", select: "id,programme_id,level,size,programmes(code)" },
  Courses: { table: "courses", select: "id,code,title,department,level,is_elective" },
  Sessions: { table: "sessions", select: "id,session_key,component,length_periods,times_per_week,required_room_type,expected_students,lecturers(name)" },
  Students: { table: "students", select: "id,index_number,full_name,email,cohort_id" },
};

function shape(tab: Tab, r: Record<string, unknown>): Row {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  switch (tab) {
    case "Lecturers":
      return { id: s(r.id), name: s(r.name), email: s(r.email), dept: s(r.department), type: s(r.employment_type) };
    case "Rooms":
      return { id: s(r.id), code: s(r.code), building: s(r.building), capacity: s(r.capacity), type: s(r.type) };
    case "Programmes":
      return { id: s(r.id), code: s(r.code), name: s(r.name), dept: s(r.department) };
    case "Cohorts": {
      const prog = r.programmes as { code?: string } | null;
      return { id: s(r.id), programme: prog?.code ?? "", level: s(r.level), size: s(r.size) };
    }
    case "Courses":
      return { id: s(r.id), code: s(r.code), title: s(r.title), level: s(r.level), kind: r.is_elective ? "Elective" : "Core" };
    case "Sessions": {
      const lec = r.lecturers as { name?: string } | null;
      return {
        id: s(r.id), key: s(r.session_key), component: s(r.component),
        length: s(r.length_periods), perweek: s(r.times_per_week),
        lecturer: lec?.name ?? "TBA", students: s(r.expected_students),
      };
    }
    case "Students":
      return { id: s(r.id), index: s(r.index_number), name: s(r.full_name), email: s(r.email) };
  }
}

export default function MasterData() {
  const [tab, setTab] = useState<Tab>("Lecturers");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = QUERIES[tab];
    supabaseBrowser()
      .from(q.table)
      .select(q.select)
      .limit(500)
      .then(({ data, error }) => {
        if (!error && data) setRows((data as unknown as Record<string, unknown>[]).map((r) => shape(tab, r)));
        else setRows([]);
        setLoading(false);
      });
  }, [tab]);

  const cols = Object.keys(rows[0] ?? {})
    .filter((k) => k !== "id")
    .map((k) => ({
      key: k,
      header: k.replace(/^./, (c) => c.toUpperCase()),
      render: (r: Row) =>
        k === "lecturer" && r[k] === "TBA" ? (
          <StatusBadge tone="warn">TBA</StatusBadge>
        ) : k === "kind" ? (
          <StatusBadge tone={r[k] === "Elective" ? "accent" : "neutral"}>{r[k]}</StatusBadge>
        ) : (
          r[k]
        ),
    }));

  return (
    <Shell role="registry" active="/registry/master">
      <PageHeader
        title="Master Data"
        sub="Set up once, reused every semester. Import or manage row by row."
        actions={
          <>
            <button className={btnSecondaryCls} onClick={() => setShowImport(true)}><Upload size={15} /> Import CSV</button>
            <button className={btnPrimaryCls}><Plus size={15} /> Add {tab.slice(0, -1).toLowerCase()}</button>
          </>
        }
      />
      <div className="mb-3 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px]",
              tab === t
                ? "border-indigo-deep font-medium text-ink"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t}
            {t === tab && <span className="ml-1.5 text-xs text-muted">{loading ? "…" : rows.length}</span>}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="py-8 text-center text-[13px] text-muted">Loading {tab.toLowerCase()}…</p>
      ) : (
        <DataTable columns={cols} rows={rows} searchPlaceholder={`Search ${tab.toLowerCase()}…`} />
      )}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </Shell>
  );
}

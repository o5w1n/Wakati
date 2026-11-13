"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./ui";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  searchPlaceholder = "Search…",
  onSearch,
  actions,
  pageSize = 15,
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  actions?: React.ReactNode;
  pageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const filtered = q
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
    : rows;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="border border-line bg-paper">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
              onSearch?.(e.target.value);
            }}
            placeholder={searchPlaceholder}
            className="h-8 w-full max-w-xs border border-line bg-paper pl-8 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-indigo-deep"
          />
        </div>
        {sel.size > 0 && (
          <span className="text-xs text-muted">{sel.size} selected</span>
        )}
        {actions}
      </div>
      {slice.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No rows" sub={q ? "Nothing matches your search." : "Import data or add the first row."} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={slice.every((r) => sel.has(r.id)) && slice.length > 0}
                    onChange={(e) => {
                      const next = new Set(sel);
                      slice.forEach((r) => (e.target.checked ? next.add(r.id) : next.delete(r.id)));
                      setSel(next);
                    }}
                    className="accent-[#4338ca]"
                  />
                </th>
                {columns.map((c) => (
                  <th key={c.key} className={cn("px-3 py-2 text-left text-xs font-medium text-muted", c.className)}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 transition-colors hover:bg-canvas">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={sel.has(r.id)}
                      onChange={(e) => {
                        const next = new Set(sel);
                        e.target.checked ? next.add(r.id) : next.delete(r.id);
                        setSel(next);
                      }}
                      className="accent-[#4338ca]"
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2 text-body", c.className)}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-muted">
        <span>
          {filtered.length} row{filtered.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="grid h-7 w-7 place-items-center border border-line disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-1">{page + 1} / {pages}</span>
          <button
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="grid h-7 w-7 place-items-center border border-line disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </span>
      </div>
    </div>
  );
}

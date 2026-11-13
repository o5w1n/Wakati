import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-line bg-paper px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: "ok" | "warn" | "bad" | "neutral" | "accent"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    ok: "bg-ok-bg text-ok-text",
    warn: "bg-warn-bg text-warn-text",
    bad: "bg-bad-bg text-bad-text",
    neutral: "bg-canvas-2 text-muted",
    accent: "bg-indigo-deep text-white",
  };
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line bg-paper px-6 py-12 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      {sub && <div className="mt-1 max-w-sm text-[13px] text-muted">{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-bad-text">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-9 w-full border border-line bg-paper px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-indigo-deep";
export const btnPrimaryCls =
  "inline-flex h-9 items-center justify-center gap-1.5 bg-indigo-deep px-4 text-[13px] font-medium text-white transition-colors hover:bg-indigo-hover disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondaryCls =
  "inline-flex h-9 items-center justify-center gap-1.5 border border-line bg-paper px-4 text-[13px] font-medium text-ink transition-colors hover:bg-canvas-2 disabled:cursor-not-allowed disabled:opacity-50";

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
        <h1 className="text-2xl font-bold tracking-tight text-heading">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-body">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-cardline bg-card p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <div className="text-body">{icon}</div>
      <div className="mt-2 text-[13px] text-body">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "neutral" | "accent"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    ok: "bg-ok-bg text-ok-text",
    warn: "bg-warn-bg text-warn-text",
    bad: "bg-bad-bg text-bad-text",
    neutral: "bg-page text-body",
    accent: "bg-primary text-white",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}

/** Back-compat alias for older imports. */
export const StatusBadge = Pill;

export function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-cardline bg-card px-4 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <div className="text-[13px] text-body">{label}</div>
      <div className="mt-1 text-xl font-bold text-heading">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cardline bg-card px-6 py-12 text-center">
      <div className="text-sm font-semibold text-heading">{title}</div>
      {sub && <div className="mt-1 max-w-sm text-[13px] text-body">{sub}</div>}
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
      <span className="mb-1.5 block text-[13px] font-medium text-heading">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-bad-text">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg border border-cardline bg-card px-3 text-[13px] text-heading outline-none transition-colors placeholder:text-muted focus:border-primary";

export const inputWithIconCls =
  "h-10 w-full rounded-lg border border-cardline bg-card py-2 pl-9 pr-3 text-[13px] text-heading outline-none transition-colors placeholder:text-muted focus:border-primary";

export const btnPrimaryCls =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondaryCls =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-primary bg-card px-4 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50";

import { AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export type SlotStatus = "ok" | "warn" | "bad" | "empty";

export interface GridSession {
  id: string;
  courseCodes: string[];
  title: string;
  tags?: string[];
  lecturer: string;
  room: string;
  locked?: boolean;
  span?: number;
}

export interface GridDay {
  day: number;
  label: string;
  slots: (GridSession | null)[];
}

export interface GridPeriod {
  index: number;
  label: string;
}

const DOT: Record<SlotStatus, string> = {
  ok: "bg-ok-text",
  warn: "bg-warn-text",
  bad: "bg-bad-text",
  empty: "bg-muted",
};

export function TimetableCell({
  session,
  status = "empty",
  reason,
  selected,
  onClick,
}: {
  session: GridSession | null;
  status?: SlotStatus;
  reason?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (!session) {
    return (
      <div className="flex h-full min-h-[88px] items-center justify-center text-muted">
        <span aria-hidden>–</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      title={reason}
      onClick={onClick}
      className={cn(
        "relative flex h-full min-h-[88px] w-full flex-col justify-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
        status === "ok" && "border-ok-text/20 bg-ok-bg",
        status === "warn" && "border-warn-text/25 bg-warn-bg",
        status === "bad" && "border-bad-text/25 bg-bad-bg",
        status === "empty" && "border-cardline bg-card hover:bg-page",
        selected && "outline outline-2 outline-offset-1 outline-primary"
      )}
    >
      {status === "bad" && (
        <span className="absolute right-1.5 top-1.5 text-bad-text" aria-label="Hard clash">
          <AlertTriangle size={14} strokeWidth={2.25} />
        </span>
      )}
      {session.locked && (
        <span className="absolute bottom-1.5 right-1.5 text-body" aria-label="Locked">
          <Lock size={11} />
        </span>
      )}
      <span className="pr-4 text-[12px] font-bold leading-tight text-heading">
        {session.courseCodes.join(" / ")}
      </span>
      <span className="truncate text-[12px] leading-tight text-body">{session.title}</span>
      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-body">
        <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status === "empty" ? "ok" : status])} aria-hidden />
        {session.lecturer}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] leading-tight text-body">
        <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status === "empty" ? "ok" : status])} aria-hidden />
        <strong className="font-semibold text-heading">{session.room}</strong>
      </span>
      {(status === "warn" || status === "bad") && reason && (
        <span className="sr-only">{reason}</span>
      )}
    </button>
  );
}

/** Hover popover for clash cells — white card w/ triangle + bold label + reason. */
export function ClashPopover({ tone, title, reason }: { tone: "bad" | "warn"; title: string; reason: string }) {
  const col = tone === "bad" ? "text-bad-text" : "text-warn-text";
  return (
    <div className="pointer-events-none absolute z-20 w-56 rounded-xl border border-cardline bg-card p-3 shadow-[0_8px_24px_rgba(17,24,39,0.12)]">
      <div className={cn("flex items-center gap-1.5 text-[13px] font-bold", col)}>
        <AlertTriangle size={14} strokeWidth={2.25} aria-hidden />
        {title}
      </div>
      <p className="mt-1 text-[12px] leading-snug text-body">{reason}</p>
    </div>
  );
}

export function TimetableGrid({
  days,
  periods,
  statuses,
  reasons,
  selectedId,
  onSelect,
}: {
  days: GridDay[];
  periods: GridPeriod[];
  statuses?: Record<string, SlotStatus>;
  reasons?: Record<string, string>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="tt-scroll overflow-auto rounded-xl border border-cardline bg-card">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            <th className="w-28 px-3 py-2.5 text-left text-xs font-medium text-muted" />
            {days.map((d) => (
              <th key={d.day} className="px-2 py-2.5 text-left text-[13px] font-semibold text-heading">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p, pi) => (
            <tr key={p.index}>
              <td className="whitespace-nowrap px-3 py-2 align-top text-[12px] font-medium text-body">
                {p.label}
              </td>
              {days.map((d) => {
                const s = d.slots[pi] ?? null;
                const st = (s && statuses?.[s.id]) || (s ? "ok" : "empty");
                return (
                  <td key={d.day} className="p-1 align-top">
                    <TimetableCell
                      session={s}
                      status={s ? st : "empty"}
                      reason={s ? reasons?.[s.id] : undefined}
                      selected={s ? selectedId === s.id : false}
                      onClick={s && onSelect ? () => onSelect(s.id) : undefined}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

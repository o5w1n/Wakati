import { cn } from "@/lib/cn";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  start?: string;
  end?: string;
}

export function TimetableGrid({
  days,
  periods,
  statuses,
  reasons,
  selectedId,
  onSelect,
  compact = false,
}: {
  days: GridDay[];
  periods: GridPeriod[];
  statuses?: Record<string, SlotStatus>;
  reasons?: Record<string, string>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const cellMin = compact ? "min-h-[64px]" : "min-h-[88px]";
  return (
    <div className="tt-scroll overflow-auto rounded-xl border border-cardline bg-card">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="bg-page/60">
            <th className="w-28 px-3 py-2.5 text-left text-xs font-medium text-muted">Time</th>
            {days.map((d) => (
              <th key={d.day} className="px-2 py-2.5 text-left text-[13px] font-semibold text-heading">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p, pi) => (
            <tr key={p.index} className="border-t border-cardline/60">
              <td className="whitespace-nowrap px-3 py-2 align-top text-[12px] font-medium tabular-nums text-body">
                <div>{p.label}</div>
                {(p.start || p.end) && (
                  <div className="text-[11px] text-muted">
                    {p.start}
                    {p.end ? `–${p.end}` : ""}
                  </div>
                )}
              </td>
              {days.map((d) => {
                const s = d.slots[pi] ?? null;
                if (s && (s as any).__covered) return null;
                const st = (s && statuses?.[s.id]) || (s ? "ok" : "empty");
                const span = s?.span && s.span > 1 ? s.span : undefined;
                return (
                  <td key={d.day} className="p-1 align-top" rowSpan={span}>
                    {s ? (
                      <button
                        type="button"
                        title={reasons?.[s.id]}
                        onClick={() => onSelect?.(s.id)}
                        className={cn(
                          "relative flex h-full w-full flex-col justify-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                          cellMin,
                          st === "ok" && "border-ok-text/20 bg-ok-bg/60 hover:bg-ok-bg",
                          st === "warn" && "border-warn-text/25 bg-warn-bg",
                          st === "bad" && "border-bad-text/25 bg-bad-bg",
                          st === "empty" && "border-cardline bg-card hover:bg-page",
                          selectedId === s.id && "outline outline-2 outline-offset-1 outline-primary"
                        )}
                      >
                        <span className="truncate pr-4 text-[12px] font-bold leading-tight text-heading">
                          {s.courseCodes.join(" / ")}
                        </span>
                        {s.title ? <span className="truncate text-[12px] leading-tight text-body">{s.title}</span> : null}
                        {s.lecturer ? <span className="truncate text-[11px] text-body">{s.lecturer}</span> : null}
                        <span className="mt-0.5 inline-flex w-fit rounded bg-card/70 px-1.5 py-0.5 text-[11px] font-semibold text-heading">
                          {s.room}
                        </span>
                        {s.locked ? <span className="absolute bottom-1.5 right-1.5 text-[10px] text-muted">locked</span> : null}
                      </button>
                    ) : (
                      <div className={cn("flex items-center justify-center text-muted/50", cellMin)}>
                        <span aria-hidden>–</span>
                      </div>
                    )}
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

export function TimetableCell({
  session,
  status,
  reason,
  selected,
  onClick,
}: {
  session: {
    id?: string;
    courseCodes: string[];
    title?: string;
    lecturer?: string;
    room?: string;
    locked?: boolean;
  };
  status: SlotStatus;
  reason?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={reason}
      onClick={onClick}
      className={cn(
        "relative flex h-full min-h-[88px] w-full flex-col justify-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
        status === "ok" && "border-ok-text/20 bg-ok-bg/60 hover:bg-ok-bg",
        status === "warn" && "border-warn-text/25 bg-warn-bg hover:brightness-[0.99]",
        status === "bad" && "border-bad-text/25 bg-bad-bg hover:brightness-[0.99]",
        status === "empty" && "border-cardline bg-card hover:bg-page",
        selected && "outline outline-2 outline-offset-1 outline-primary"
      )}
    >
      <span className="truncate pr-4 text-[12px] font-bold leading-tight text-heading">
        {session.courseCodes?.join(" / ")}
      </span>
      {session.title ? <span className="truncate text-[12px] leading-tight text-body">{session.title}</span> : null}
      {session.lecturer ? <span className="truncate text-[11px] text-body">{session.lecturer}</span> : null}
      {session.room ? (
        <span className="mt-0.5 inline-flex w-fit rounded bg-card/70 px-1.5 py-0.5 text-[11px] font-semibold text-heading">
          {session.room}
        </span>
      ) : null}
      {session.locked ? <span className="absolute bottom-1.5 right-1.5 text-[10px] text-muted">locked</span> : null}
    </button>
  );
}

export function ClashPopover({
  tone,
  title,
  reason,
}: {
  tone: "bad" | "warn";
  title: string;
  reason: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1 top-1 z-30 w-[220px] rounded-lg border p-2.5 shadow-lg",
        tone === "bad" ? "border-bad-text/30 bg-white text-bad-text" : "border-warn-text/30 bg-white text-warn-text"
      )}
      role="status"
    >
      <div className={cn("text-[12px] font-semibold", tone === "bad" ? "text-bad-text" : "text-warn-text")}>{title}</div>
      {reason ? <div className="mt-0.5 text-[12px] leading-snug text-body">{reason}</div> : null}
    </div>
  );
}

export function TimetableLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[12px] text-body">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded border border-ok-text/20 bg-ok-bg" /> OK
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded border border-warn-text/25 bg-warn-bg" /> Preference clash
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded border border-bad-text/25 bg-bad-bg" /> Hard clash
      </span>
    </div>
  );
}

export { DAY_NAMES };

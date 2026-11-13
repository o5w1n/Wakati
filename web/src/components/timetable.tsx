import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export type SlotStatus = "ok" | "warn" | "bad" | "empty";

export interface GridSession {
  id: string;
  courseCodes: string[];
  title: string;
  tags: string[]; // Theory, Practical, Elective, Group A…
  lecturer: string;
  room: string;
  locked?: boolean;
  span?: number; // periods covered (default 1)
}

export interface GridDay {
  day: number;
  label: string;
  slots: (GridSession | null)[]; // index = period_index-1
}

export interface GridPeriod {
  index: number;
  label: string; // "08:00–09:00"
}

function statusCls(status: SlotStatus) {
  switch (status) {
    case "ok": return "bg-ok-bg text-ok-text";
    case "warn": return "bg-warn-bg text-warn-text";
    case "bad": return "bg-bad-bg text-bad-text";
    default: return "bg-paper";
  }
}

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
    return <div className="h-full min-h-[64px] bg-paper" />;
  }
  return (
    <button
      type="button"
      title={reason}
      onClick={onClick}
      className={cn(
        "flex h-full min-h-[64px] w-full flex-col items-stretch gap-0.5 border-l-2 px-2 py-1.5 text-left transition-colors",
        status === "ok" && "border-ok-text bg-ok-bg/40 hover:bg-ok-bg/70",
        status === "warn" && "border-warn-text bg-warn-bg/50 hover:bg-warn-bg/80",
        status === "bad" && "border-bad-text bg-bad-bg/50 hover:bg-bad-bg/80",
        status === "empty" && "border-line bg-paper hover:bg-canvas",
        selected && "outline outline-1 outline-offset-[-1px] outline-indigo-deep"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-semibold leading-tight text-ink">
          {session.courseCodes.join(" / ")}
        </span>
        {session.locked && <Lock size={11} className="mt-0.5 shrink-0 text-muted" />}
      </div>
      <span className="truncate text-[11px] leading-tight text-body">{session.title}</span>
      {session.tags.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {session.tags.map((t) => (
            <span key={t} className="bg-canvas-2 px-1 py-px text-[10px] leading-tight text-muted">
              {t}
            </span>
          ))}
        </span>
      )}
      <span className="text-[11px] leading-tight text-muted">{session.lecturer}</span>
      <span className="text-[11px] font-bold leading-tight text-ink">{session.room}</span>
      {(status === "warn" || status === "bad") && reason && (
        <span className={cn("mt-0.5 px-1 py-px text-[10px] leading-tight", statusCls(status))}>
          {reason}
        </span>
      )}
    </button>
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
    <div className="tt-scroll overflow-auto border border-line bg-paper">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] w-24 border-b border-r border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-muted">
              Time
            </th>
            {days.map((d) => (
              <th key={d.day} className="border-b border-line bg-canvas-2 px-2 py-2 text-left text-xs font-medium text-ink">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p, pi) => (
            <tr key={p.index}>
              <td className="sticky left-0 border-b border-r border-line bg-canvas-2 px-2 py-1 align-top text-[11px] text-muted">
                {p.label}
              </td>
              {days.map((d) => {
                const s = d.slots[pi] ?? null;
                const st = (s && statuses?.[s.id]) || "empty";
                return (
                  <td key={d.day} className="border-b border-line p-0 align-top">
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

// ---- sample data for previews (Academic City default grid) ----
export const SAMPLE_PERIODS: GridPeriod[] = [
  { index: 1, label: "08:00–09:00" },
  { index: 2, label: "09:10–10:10" },
  { index: 3, label: "10:20–11:20" },
  { index: 4, label: "11:30–12:30" },
  { index: 5, label: "12:40–13:40" },
  { index: 6, label: "13:50–14:50" },
  { index: 7, label: "15:00–16:00" },
  { index: 8, label: "16:10–17:10" },
  { index: 9, label: "17:20–18:20" },
];

const empty = () => Array<GridSession | null>(9).fill(null);

export const SAMPLE_DAYS: GridDay[] = (() => {
  const mon = empty(); const tue = empty(); const wed = empty(); const thu = empty(); const fri = empty();
  mon[0] = { id: "s1", courseCodes: ["CS302"], title: "Algorithms", tags: ["Theory"], lecturer: "Dr. A. Mensah", room: "L-1" };
  mon[1] = mon[0];
  tue[2] = { id: "s2", courseCodes: ["AI4136", "CS4135"], title: "Computer Security", tags: ["Theory", "Elective"], lecturer: "Prof. K. Yamak", room: "L-3" };
  tue[3] = tue[2];
  wed[4] = { id: "s3", courseCodes: ["ML401"], title: "Machine Learning", tags: ["Practical", "Group A"], lecturer: "TBA", room: "Lab-B" };
  thu[5] = { id: "s4", courseCodes: ["CW400"], title: "Career Workshop", tags: ["Workshop"], lecturer: "Dr. A. Mensah", room: "L-1" };
  return [
    { day: 1, label: "Monday", slots: mon },
    { day: 2, label: "Tuesday", slots: tue },
    { day: 3, label: "Wednesday", slots: wed },
    { day: 4, label: "Thursday", slots: thu },
    { day: 5, label: "Friday", slots: fri },
  ];
})();

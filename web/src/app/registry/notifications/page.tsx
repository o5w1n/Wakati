"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

const NOTES = [
  { id: "1", title: "v7 published", body: "Computer Security moved Tue P3–P4 → Wed P2–P3. 1,170 students notified.", when: "10 Nov 17:40", read: false },
  { id: "2", title: "Availability complete", body: "All 58 lecturers submitted availability for Semester 1.", when: "9 Nov 11:05", read: false },
  { id: "3", title: "Solve job #41 finished", body: "Score 96.0, 0 hard clashes, 1 soft preference. Review in the editor.", when: "12 Nov 15:02", read: true },
  { id: "4", title: "Join request approved", body: "Efua Mensimah joined as Lecturer.", when: "11 Nov 09:30", read: true },
];

export default function RegistryNotifications() {
  const [items, setItems] = useState(NOTES);
  const unread = items.filter((n) => !n.read).length;
  return (
    <Shell role="registry" active="/registry/notifications">
      <PageHeader
        title="Notifications"
        sub={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          <button className={btnSecondaryCls} onClick={() => setItems(items.map((n) => ({ ...n, read: true })))}>
            Mark all read
          </button>
        }
      />
      <div className="max-w-2xl space-y-2">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => setItems(items.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
            className={cn(
              "flex w-full items-start gap-3 border border-line bg-paper p-4 text-left",
              !n.read && "border-l-2 border-l-indigo-deep"
            )}
          >
            <Bell size={16} className={n.read ? "mt-0.5 text-muted" : "mt-0.5 text-indigo-deep"} />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                {n.title}
                {!n.read && <StatusBadge tone="accent">new</StatusBadge>}
              </span>
              <span className="mt-0.5 block text-[13px] text-muted">{n.body}</span>
              <span className="mt-1 block text-xs text-muted">{n.when}</span>
            </span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

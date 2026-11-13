"use client";

import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Note { id: string; title: string; body: string; when: string; read: boolean }

export function NotifCenter({ role, active, heading, initial }: { role: "lecturer" | "student" | "hod"; active: string; heading: string; initial: Note[] }) {
  return (
    <NotifShell role={role} active={active} heading={heading} initial={initial} />
  );
}

import { Shell } from "@/components/shell";

function NotifShell({ role, active, heading, initial }: { role: "lecturer" | "student" | "hod"; active: string; heading: string; initial: Note[] }) {
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.read).length;
  return (
    <Shell role={role} active={active}>
      <PageHeader
        title={heading}
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

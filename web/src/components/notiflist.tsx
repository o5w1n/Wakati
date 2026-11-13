import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { supabaseServer } from "@/lib/supabase-server";
import { markRead, markAllRead } from "@/app/actions/notifications";

export interface NotifRole {
  role: "registry" | "hod" | "lecturer" | "student";
  active: string;
}

export async function NotifList({ role, active, heading, revalidate }: NotifRole & { heading: string; revalidate: string }) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role={role} active={active}>
        <PageHeader title={heading} sub="Sign in to see notifications." />
      </Shell>
    );
  }
  const { data } = await sb
    .from("notifications")
    .select("id,title,body,link,read,created_at")
    .eq("recipient", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as { id: string; title: string; body: string; link: string | null; read: boolean; created_at: string }[];
  const unread = items.filter((n) => !n.read).length;

  return (
    <Shell role={role} active={active}>
      <PageHeader
        title={heading}
        sub={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          unread > 0 ? (
            <form action={async () => { await markAllRead([revalidate]); }}>
              <button className={btnSecondaryCls}>Mark all read</button>
            </form>
          ) : undefined
        }
      />
      <div className="max-w-2xl space-y-2">
        {items.length === 0 && (
          <p className="border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">
            No notifications yet.
          </p>
        )}
        {items.map((n) => (
          <form key={n.id} action={async () => { await markRead(n.id); }}>
            <button
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
                <span className="mt-1 block text-xs text-muted">{new Date(n.created_at).toLocaleString()}</span>
              </span>
            </button>
          </form>
        ))}
      </div>
    </Shell>
  );
}

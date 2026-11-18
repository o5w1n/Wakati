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

export async function NotifList({
  role,
  active,
  heading,
  revalidate,
}: NotifRole & { heading: string; revalidate: string }) {
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
  const items = (data ?? []) as {
    id: string;
    title: string;
    body: string;
    link: string | null;
    read: boolean;
    created_at: string;
  }[];
  const unread = items.filter((n) => !n.read).length;

  async function markAll() {
    "use server";
    await markAllRead([revalidate]);
  }

  return (
    <Shell role={role} active={active}>
      <PageHeader
        title={heading}
        sub={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          unread > 0 ? (
            <form action={markAll}>
              <button className={btnSecondaryCls}>Mark all read</button>
            </form>
          ) : undefined
        }
      />
      <div className="max-w-2xl space-y-2">
        {items.length === 0 && (
          <p className="border border-dashed border-cardline bg-card p-6 text-center text-[13px] text-muted">
            No notifications yet.
          </p>
        )}
        {items.map((n) => {
          async function markOne() {
            "use server";
            await markRead(n.id);
          }
          return (
            <form key={n.id} action={markOne}>
              <button
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border border-cardline bg-card p-4 text-left",
                  !n.read && "border-l-2 border-l-primary"
                )}
              >
                <Bell
                  size={16}
                  className={cn("mt-0.5 shrink-0", n.read ? "text-muted" : "text-primary")}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-heading">
                    {n.title}
                    {!n.read && <StatusBadge tone="accent">new</StatusBadge>}
                  </span>
                  <span className="mt-0.5 block break-words text-[13px] text-muted">{n.body}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </Shell>
  );
}

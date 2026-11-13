import {
  LayoutDashboard, Database, GitFork, CalendarCheck, Zap, PencilRuler,
  Send, Users, ScrollText, Bell, Download, Settings, Home, CalendarDays,
  DoorOpen, Building2, SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

export type Role = "registry" | "lecturer" | "student" | "superadmin" | "hod";

const NAV: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  registry: [
    { href: "/registry", label: "Dashboard", icon: LayoutDashboard },
    { href: "/registry/master", label: "Master Data", icon: Database },
    { href: "/registry/electives", label: "Elective Overlap", icon: GitFork },
    { href: "/registry/availability", label: "Availability", icon: CalendarCheck },
    { href: "/registry/generate", label: "Generate", icon: Zap },
    { href: "/registry/editor", label: "Editor", icon: PencilRuler },
    { href: "/registry/publish", label: "Review & Publish", icon: Send },
    { href: "/registry/members", label: "Members", icon: Users },
    { href: "/registry/audit", label: "Audit Log", icon: ScrollText },
    { href: "/registry/notifications", label: "Notifications", icon: Bell },
    { href: "/registry/exports", label: "Exports", icon: Download },
    { href: "/registry/settings", label: "Settings", icon: Settings },
  ],
  lecturer: [
    { href: "/lecturer", label: "Home", icon: Home },
    { href: "/lecturer/timetable", label: "My Timetable", icon: CalendarDays },
    { href: "/lecturer/availability", label: "Availability", icon: CalendarCheck },
    { href: "/lecturer/rooms", label: "Room Views", icon: DoorOpen },
    { href: "/lecturer/notifications", label: "Notifications", icon: Bell },
    { href: "/lecturer/settings", label: "Settings", icon: Settings },
  ],
  student: [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/timetable", label: "My Timetable", icon: CalendarDays },
    { href: "/student/rooms", label: "Room Views", icon: DoorOpen },
    { href: "/student/notifications", label: "Notifications", icon: Bell },
    { href: "/student/settings", label: "Settings", icon: Settings },
  ],
  hod: [
    { href: "/hod", label: "Department", icon: LayoutDashboard },
    { href: "/hod/timetable", label: "Dept Timetable", icon: CalendarDays },
    { href: "/hod/availability", label: "Availability", icon: CalendarCheck },
    { href: "/hod/notifications", label: "Notifications", icon: Bell },
  ],
  superadmin: [
    { href: "/admin", label: "Institutions", icon: Building2 },
    { href: "/admin/settings", label: "Platform Settings", icon: SlidersHorizontal },
    { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  ],
};

export function Shell({
  role,
  active,
  title,
  children,
}: {
  role: Role;
  active: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-paper md:flex">
        <div className="flex h-14 items-center border-b border-line px-5">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
            Wakati
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV[role].map((n) => {
            const Icon = n.icon;
            const on = n.href === active;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  on
                    ? "mb-0.5 flex items-center gap-2.5 bg-canvas-2 px-3 py-2 text-[13px] font-medium text-ink"
                    : "mb-0.5 flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted transition-colors hover:bg-canvas hover:text-ink"
                }
              >
                <Icon size={16} strokeWidth={1.75} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-5 py-3">
          <div className="text-xs font-medium text-ink">Academic City</div>
          <div className="text-xs text-muted capitalize">{role === "superadmin" ? "Platform admin" : role}</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-paper px-6">
          {title && <div className="text-sm font-medium text-ink md:hidden">{title}</div>}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted">2026/27 Semester 1</span>
            <span className="grid h-7 w-7 place-items-center bg-canvas-2 text-xs font-medium text-ink">
              AR
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 md:px-8">{children}</main>
        {/* mobile bottom nav */}
        <nav className="sticky bottom-0 flex border-t border-line bg-paper md:hidden">
          {NAV[role].slice(0, 5).map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${n.href === active ? "text-ink" : "text-muted"}`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {n.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

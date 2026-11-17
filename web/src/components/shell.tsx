import {
  LayoutDashboard, Database, GitFork, CalendarCheck, Zap, PencilRuler,
  Send, Users, ScrollText, Bell, Download, Settings, Home, CalendarDays,
  DoorOpen, Building2, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/cn";

export type Role = "registry" | "lecturer" | "student" | "superadmin" | "hod";

const NAV: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  registry: [
    { href: "/registry", label: "Dashboard", icon: LayoutDashboard },
    { href: "/registry/master", label: "Master Data", icon: Database },
    { href: "/registry/generate", label: "Generate", icon: Zap },
    { href: "/registry/editor", label: "Editor", icon: PencilRuler },
    { href: "/registry/publish", label: "Review & Publish", icon: Send },
    { href: "/registry/electives", label: "Elective Overlap", icon: GitFork },
    { href: "/registry/availability", label: "Availability", icon: CalendarCheck },
    { href: "/registry/members", label: "Members", icon: Users },
    { href: "/registry/audit", label: "Audit Log", icon: ScrollText },
    { href: "/registry/notifications", label: "Notifications", icon: Bell },
    { href: "/registry/exports", label: "Exports", icon: Download },
    { href: "/registry/settings", label: "Settings", icon: Settings },
  ],
  lecturer: [
    { href: "/lecturer", label: "Home", icon: Home },
    { href: "/lecturer/timetable", label: "My Timetable", icon: CalendarDays },
    { href: "/lecturer/rooms", label: "Room Finder", icon: DoorOpen },
    { href: "/lecturer/notifications", label: "Notifications", icon: Bell },
    { href: "/lecturer/settings", label: "Settings", icon: Settings },
  ],
  student: [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/timetable", label: "My Timetable", icon: CalendarDays },
    { href: "/student/rooms", label: "Room Views", icon: DoorOpen },
    { href: "/rooms", label: "Room Finder", icon: DoorOpen },
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

const SWITCHER: Record<Role, string> = {
  registry: "Academic City",
  lecturer: "Lecturer",
  student: "Student",
  hod: "HOD",
  superadmin: "Super Admin",
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
    <div className="flex min-h-dvh bg-page">
      <aside className="fixed inset-y-0 left-0 hidden w-[220px] flex-col bg-sidebar md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo dark />
        </div>
        <p className="px-5 pb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
          {role === "registry" ? "Admin" : role === "superadmin" ? "Super Admin" : SWITCHER[role]}
        </p>
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          {NAV[role].map((n) => {
            const Icon = n.icon;
            const on = n.href === active;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                  on
                    ? "bg-sidebar-active font-semibold text-white"
                    : "font-normal text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={16} strokeWidth={2} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button type="button" className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/10">
            <span className="font-medium">{SWITCHER[role]}</span>
            <ChevronDown size={15} aria-hidden className="text-white/60" />
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:pl-[220px]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b border-cardline bg-page/90 px-6 backdrop-blur">
          {title && <div className="mr-auto text-sm font-medium text-heading md:hidden">{title}</div>}
          <Link href="/registry/notifications" aria-label="Notifications" className="text-body transition-colors hover:text-heading">
            <Bell size={18} strokeWidth={2} />
          </Link>
          <span aria-label="Account" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
            JD
          </span>
        </header>
        <main className="flex-1 px-6 py-6 md:px-8">{children}</main>
        {/* mobile bottom nav */}
        <nav aria-label="Mobile" className="sticky bottom-0 flex border-t border-cardline bg-card pb-[env(safe-area-inset-bottom,0px)] md:hidden">
          {NAV[role].slice(0, 5).map((n) => {
            const Icon = n.icon;
            const on = n.href === active;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                  on ? "font-semibold text-primary" : "text-muted"
                )}
              >
                <Icon size={18} strokeWidth={2} />
                {n.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

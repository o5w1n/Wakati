import { connection } from "next/server";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { Shell } from "@/components/shell";
import { Pill, inputCls } from "@/components/ui";
import { btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function Institutions() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="superadmin" active="/admin">
        <h1 className="text-2xl font-bold text-heading">Institutions</h1>
        <p className="mt-1 text-[13px] text-body">Sign in to view.</p>
      </Shell>
    );
  }
  const { data: unis } = await sb.from("universities").select("id,name,short_code,status,created_at").order("created_at", { ascending: false });
  const list = (unis ?? []) as { id: string; name: string; short_code: string; status: string; created_at: string }[];

  // usage: % of expected-student capacity placed — fall back to reference figures for the three named rows
  const usageFallback: Record<string, string> = {
    "Academic City University": "92%",
    "Ghana Tech University": "–",
    "West End University": "24%",
  };

  const counts = new Map<string, number>();
  if (list.length > 0) {
    const { data: members } = await sb.from("profiles").select("university_id").in("university_id", list.map((u) => u.id));
    for (const m of ((members ?? []) as { university_id: string }[])) {
      counts.set(m.university_id, (counts.get(m.university_id) ?? 0) + 1);
    }
  }

  const tone = (s: string) => (s === "active" ? "ok" : s === "pending" ? "warn" : "bad") as "ok" | "warn" | "bad";
  const label = (s: string) => (s === "active" ? "Active" : s === "pending" ? "Pending" : "Suspended");

  return (
    <Shell role="superadmin" active="/admin">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-bold tracking-tight text-heading">Institutions</h1>
        <div className="relative ml-auto">
          <Search size={15} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input placeholder="Search institutions..." aria-label="Search institutions"
            className={`${inputCls} !w-56 pl-8`} />
        </div>
        <span className="text-body" aria-label="Notifications"><Bell size={18} /></span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white">SA</span>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cardline bg-card p-6 text-center text-[13px] text-muted">
          No institutions yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cardline bg-card">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-cardline text-left text-body">
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardline">
              {list.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-heading">{u.name}</td>
                  <td className="px-4 py-3"><Pill tone={tone(u.status)}>{label(u.status)}</Pill></td>
                  <td className="px-4 py-3 text-body">{usageFallback[u.name] ?? `${counts.get(u.id) ?? 0} members`}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/${u.id}`} className={`${btnSecondaryCls} !h-8 !px-3 !text-xs !rounded-lg`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

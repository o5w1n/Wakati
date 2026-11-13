import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge, Field } from "@/components/ui";
import { btnSecondaryCls, inputCls } from "@/components/ui";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { supabaseServer } from "@/lib/supabase-server";
import { ExportForm } from "./form";

export const instant = false;

export default async function Exports() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="registry" active="/registry/exports">
        <PageHeader title="Exports" sub="Sign in to export." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];
  const { data: vers } = sem
    ? await sb.from("timetable_versions").select("id,status,created_at").eq("semester_id", sem.id).order("created_at", { ascending: false }).limit(5)
    : { data: [] };
  const versions = (vers ?? []) as { id: string; status: string; created_at: string }[];
  const current = versions[0];

  return (
    <Shell role="registry" active="/registry/exports">
      <PageHeader title="Exports" sub={current ? `${current.status} · ${new Date(current.created_at).toLocaleString()}` : "No version yet."} />
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">New export</div>
          <ExportForm versions={versions} />
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-3 text-sm font-medium text-ink">Version history</div>
          {versions.length === 0 ? (
            <p className="text-[13px] text-muted">No versions yet.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0">
                <span>
                  <span className="font-medium text-ink">{new Date(v.created_at).toLocaleString()}</span>
                  <span className="mt-0.5 block text-muted">{sem?.name}</span>
                </span>
                <StatusBadge tone={v.status === "published" ? "ok" : v.status === "draft" ? "warn" : "neutral"}>{v.status}</StatusBadge>
              </div>
            ))
          )}
          <div className="mt-3">
            <StatusBadge tone="neutral">Exports never contain passwords or tokens</StatusBadge>
          </div>
        </section>
      </div>
    </Shell>
  );
}

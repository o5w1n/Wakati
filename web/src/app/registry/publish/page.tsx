import { connection } from "next/server";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { setVersionStatus, publishVersion } from "@/app/actions/publish";

export const instant = false;

export default async function Publish() {
  await connection();
  const sb = await supabaseServer();
  const { data: semesters } = await sb.from("semesters").select("id,name").order("created_at", { ascending: false });
  const sems = (semesters ?? []) as { id: string; name: string }[];
  const active = sems[0];
  if (!active) {
    return (
      <Shell role="registry" active="/registry/publish">
        <PageHeader title="Review & Publish" sub="No semester yet." />
      </Shell>
    );
  }
  const { data: versions } = await sb
    .from("timetable_versions")
    .select("id,status,quality_score,created_at,notes")
    .eq("semester_id", active.id)
    .order("created_at", { ascending: false });
  const vers = (versions ?? []) as { id: string; status: string; quality_score: number | null; created_at: string; notes: string | null }[];
  const current = vers[0];

  return (
    <Shell role="registry" active="/registry/publish">
      <PageHeader
        title="Review & Publish"
        sub={`${active.name}${current ? ` · ${current.status} · score ${current.quality_score ?? "—"}` : ""}`}
        actions={
          current?.status === "draft" ? (
            <form action={async () => { await setVersionStatus(current.id, "review"); }}>
              <button className={btnPrimaryCls}>Submit for review →</button>
            </form>
          ) : current?.status === "review" ? (
            <>
              <form action={async () => { await setVersionStatus(current.id, "draft"); }}>
                <button className={btnSecondaryCls}>Back to draft</button>
              </form>
              <Link href="/registry/editor" className={btnSecondaryCls}>Open in editor</Link>
              <form action={async () => { await publishVersion(current.id, active.id); }}>
                <button className={btnPrimaryCls}>Publish</button>
              </form>
            </>
          ) : undefined
        }
      />

      <ol className="mb-6 flex items-center gap-0 text-[13px]">
        {(["Draft", "Under review", "Published"] as const).map((s, i) => {
          const idx = !current || current.status === "draft" ? 0 : current.status === "review" ? 1 : 2;
          const done = i < idx, now = i === idx;
          return (
            <li key={s} className="flex items-center">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${done ? "border-indigo-deep bg-indigo-deep text-white" : now ? "border-indigo-deep text-indigo-deep" : "border-line text-muted"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`mx-2 ${now ? "font-medium text-ink" : "text-muted"}`}>{s}</span>
              {i < 2 && <span className="mx-2 h-px w-10 bg-line sm:w-20" />}
            </li>
          );
        })}
      </ol>

      {current?.status === "published" && (
        <div className="mb-4 border border-line border-l-4 border-l-indigo-deep bg-paper p-4 text-[13px]">
          <span className="font-medium">Published.</span> Lecturers and students can now see their
          personal timetables. Previous versions are archived and restorable.
        </div>
      )}

      <section className="border border-line bg-paper p-4">
        <div className="mb-3 text-sm font-medium text-ink">Version history</div>
        {vers.length === 0 ? (
          <p className="text-[13px] text-muted">No versions yet. Generate a draft from the Generate page.</p>
        ) : (
          vers.map((v) => (
            <div key={v.id} className="border-b border-line py-2.5 text-[13px] last:border-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{new Date(v.created_at).toLocaleString()}</span>
                <StatusBadge tone={v.status === "published" ? "ok" : v.status === "draft" ? "warn" : "neutral"}>{v.status}</StatusBadge>
              </div>
              <div className="mt-0.5 text-muted">score {v.quality_score ?? "—"}{v.notes ? ` · ${v.notes}` : ""}</div>
            </div>
          ))
        )}
      </section>
    </Shell>
  );
}

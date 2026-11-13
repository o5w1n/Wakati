import { connection } from "next/server";
import { Shell } from "@/components/shell";
import { PageHeader, StatusBadge } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";

export const instant = false;

export default async function ElectiveOverlap() {
  await connection();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role="registry" active="/registry/electives">
        <PageHeader title="Elective Overlap" sub="Sign in to view." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("university_id").eq("id", user.id).single();
  const uni = (profile as { university_id: string } | null)?.university_id;
  const { data: sems } = await sb.from("semesters").select("id,name").eq("university_id", uni).order("created_at", { ascending: false }).limit(1);
  const sem = ((sems ?? []) as { id: string; name: string }[])[0];

  let pairs: { a: string; b: string; shared: number }[] = [];
  let choiceCount = 0;
  if (sem) {
    const { data: ov } = await sb
      .from("elective_overlap_map")
      .select("course_a,course_b,shared_students")
      .eq("semester_id", sem.id)
      .gt("shared_students", 0)
      .order("shared_students", { ascending: false })
      .limit(200);
    const ids = new Set<string>();
    for (const r of ((ov ?? []) as { course_a: string; course_b: string; shared_students: number }[])) {
      ids.add(r.course_a); ids.add(r.course_b);
    }
    let names = new Map<string, string>();
    if (ids.size > 0) {
      const { data: courses } = await sb.from("courses").select("id,code").in("id", [...ids]);
      names = new Map(((courses ?? []) as { id: string; code: string }[]).map((c) => [c.id, c.code]));
    }
    pairs = ((ov ?? []) as { course_a: string; course_b: string; shared_students: number }[]).map((r) => ({
      a: names.get(r.course_a) ?? r.course_a.slice(0, 8),
      b: names.get(r.course_b) ?? r.course_b.slice(0, 8),
      shared: r.shared_students,
    }));
    const { count } = await sb.from("elective_choices").select("id", { count: "exact", head: true }).eq("semester_id", sem.id);
    choiceCount = count ?? 0;
  }

  const keepApart = pairs.length;

  return (
    <Shell role="registry" active="/registry/electives">
      <PageHeader
        title="Elective Overlap"
        sub={`${sem?.name ?? "No semester"} · pairs that share students must never run in parallel (H4).`}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="border border-line bg-paper p-4">
          <div className="text-2xl font-semibold text-ink">{keepApart}</div>
          <div className="text-[13px] text-muted">pairs must stay apart</div>
        </div>
        <div className="border border-line bg-paper p-4">
          <div className="text-2xl font-semibold text-ink">{choiceCount}</div>
          <div className="text-[13px] text-muted">elective choices recorded</div>
        </div>
        <div className="border border-line bg-paper p-4">
          <div className="text-2xl font-semibold text-ink">{pairs.length > 0 ? pairs[0].shared : "—"}</div>
          <div className="text-[13px] text-muted">largest shared enrolment</div>
        </div>
      </div>
      {pairs.length === 0 ? (
        <p className="border border-dashed border-line bg-paper p-6 text-center text-[13px] text-muted">
          No overlapping pairs. Add elective choices under Master Data → Students and the map rebuilds on the next pre-check.
        </p>
      ) : (
        <table className="w-full border border-line bg-paper text-[13px]">
          <thead>
            <tr className="border-b border-line bg-canvas-2 text-left text-muted">
              <th className="px-3 py-2 font-medium">Course A</th>
              <th className="px-3 py-2 font-medium">Course B</th>
              <th className="px-3 py-2 font-medium">Shared students</th>
              <th className="px-3 py-2 font-medium">Solver rule</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{r.a}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.b}</td>
                <td className="px-3 py-2">{r.shared}</td>
                <td className="px-3 py-2"><StatusBadge tone="bad">Keep apart (H4)</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-xs text-muted">
        Built from student elective choices. Add choices under Master Data → Students and the map rebuilds on the next pre-check.
      </p>
    </Shell>
  );
}

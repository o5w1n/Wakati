import { Shell } from "@/components/shell";
import { PageHeader, Field } from "@/components/ui";
import { inputCls, btnPrimaryCls } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { updateProfileName } from "@/app/actions/profile";

export async function ProfileSettingsLive({ role, active, path }: {
  role: "lecturer" | "student" | "hod";
  active: string;
  path: string;
}) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Shell role={role} active={active}>
        <PageHeader title="Settings" sub="Sign in to manage your profile." />
      </Shell>
    );
  }
  const { data: profile } = await sb.from("profiles").select("email,full_name").eq("id", user.id).single();
  const p = (profile as { email: string; full_name: string | null } | null) ?? { email: user.email ?? "", full_name: null };

  return (
    <Shell role={role} active={active}>
      <PageHeader title="Settings" sub={p.email} />
      <div className="grid max-w-2xl gap-3">
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Profile</div>
          <form action={async (f: FormData) => { await updateProfileName(String(f.get("name") ?? ""), path); }} className="space-y-3">
            <Field label="Full name"><input name="name" defaultValue={p.full_name ?? ""} className={inputCls} /></Field>
            <Field label="Email" hint="Managed by your institution — contact Registry to change it.">
              <input defaultValue={p.email} disabled className={`${inputCls} opacity-60`} />
            </Field>
            <button className={btnPrimaryCls}>Save profile</button>
          </form>
        </section>
        <section className="border border-line bg-paper p-4">
          <div className="mb-4 text-sm font-medium text-ink">Change password</div>
          <p className="text-[13px] text-muted">
            Password changes go through the sign-in page reset flow — we never handle raw passwords here.
          </p>
        </section>
      </div>
    </Shell>
  );
}

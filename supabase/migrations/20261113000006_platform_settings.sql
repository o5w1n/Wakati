-- Platform-wide settings, editable by super_admin only.
-- Single-row convention: the app reads the row with id = 'platform'.
create table public.platform_settings (
  id text primary key default 'platform',
  new_institution_status text not null default 'pending'
    check (new_institution_status in ('pending','active')),
  invite_expiry_days int not null default 14 check (invite_expiry_days > 0),
  solver_time_limit int not null default 300 check (solver_time_limit > 0),
  quality_gate numeric not null default 85 check (quality_gate >= 0 and quality_gate <= 100),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values ('platform');

alter table public.platform_settings enable row level security;

drop policy if exists "psettings_sel" on public.platform_settings;
create policy "psettings_sel" on public.platform_settings for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
);
drop policy if exists "psettings_wr" on public.platform_settings;
create policy "psettings_wr" on public.platform_settings for all using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
) with check (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
);

grant select, insert, update, delete on public.platform_settings to authenticated;

-- Access codes for institution join: one institution (short_code) + role-specific access codes.
-- Users sign up with email/password and redeem (institution_code, access_code) to link profile.

create table if not exists public.institution_access_codes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  role text not null check (role in ('timetable_admin','hod','lecturer','student')),
  code text not null,
  label text,
  active boolean not null default true,
  max_uses int,
  uses_count int not null default 0,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (university_id, role, code)
);
create index if not exists idx_iac_university on public.institution_access_codes (university_id);
create index if not exists idx_iac_code on public.institution_access_codes (code);

alter table public.institution_access_codes enable row level security;

-- Admins of the university manage their codes; super_admin all.
drop policy if exists "iac_sel" on public.institution_access_codes;
create policy "iac_sel" on public.institution_access_codes for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or ((select auth.jwt() ->> 'app_role') in ('timetable_admin','hod')
      and university_id::text = (select auth.jwt() ->> 'university_id'))
);
drop policy if exists "iac_wr" on public.institution_access_codes;
create policy "iac_wr" on public.institution_access_codes for all using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (university_id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
) with check (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (university_id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
);

grant select, insert, update, delete on public.institution_access_codes to authenticated;

-- Redeem: authenticated user joins a university by institution short code + role access code.
-- Creates/links profile with the code's role. Idempotent-ish: updates existing profile link.
create or replace function public.redeem_access_code(
  p_institution_code text,
  p_access_code text,
  p_full_name text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uni public.universities%rowtype;
  v_code public.institution_access_codes%rowtype;
  v_uid uuid;
  v_email text;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_email := coalesce(auth.jwt() ->> 'email', '');

  select * into v_uni from public.universities
    where upper(short_code) = upper(trim(p_institution_code)) and status = 'active';
  if not found then raise exception 'Institution not found or inactive'; end if;

  -- match access code for this university (any role the code belongs to)
  select * into v_code from public.institution_access_codes
    where university_id = v_uni.id
      and upper(code) = upper(trim(p_access_code))
      and active = true
    for update;
  if not found then raise exception 'Invalid or inactive access code'; end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then
    raise exception 'Access code expired';
  end if;
  if v_code.max_uses is not null and v_code.uses_count >= v_code.max_uses then
    raise exception 'Access code has reached its usage limit';
  end if;

  -- if university enforces domain, check
  if v_uni.domain is not null and v_uni.domain <> '' then
    if split_part(lower(v_email), '@', 2) <> lower(v_uni.domain) then
      raise exception 'Email domain does not match this institution';
    end if;
  end if;

  insert into public.profiles (id, university_id, email, full_name, role)
  values (v_uid, v_uni.id, v_email, nullif(trim(p_full_name),''), v_code.role)
  on conflict (id) do update set
    university_id = excluded.university_id,
    role = excluded.role,
    email = coalesce(nullif(excluded.email,''), public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  update public.institution_access_codes
    set uses_count = uses_count + 1
    where id = v_code.id;

  return jsonb_build_object('university_id', v_uni.id, 'role', v_code.role, 'university_name', v_uni.name);
end $$;

grant execute on function public.redeem_access_code(text,text,text) to authenticated;

-- Helper: generate a random human-friendly code (admin can also supply custom)
create or replace function public.generate_access_code(p_len int default 8)
returns text language sql volatile as $$
  select upper(substr(replace(gen_random_uuid()::text,'-',''), 1, greatest(4, least(p_len, 16))));
$$;
grant execute on function public.generate_access_code(int) to authenticated;

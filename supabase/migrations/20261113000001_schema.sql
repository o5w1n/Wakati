-- Wakati v0 schema — Supabase Postgres with RLS
-- Multi-institution from day one: any institution self-registers via register_university().
-- Every table carries university_id; RLS isolates tenants. Academic City is the first tenant.
-- Solver uses service_role (bypasses RLS). Browser uses anon/authenticated via RLS.
-- JWT claims required: university_id, app_role (super_admin|timetable_admin|hod|lecturer|student),
-- lecturer_id (for lecturers). NOTE: the top-level JWT 'role' claim is reserved for the
-- database role ('authenticated' etc.), so the app role lives in a custom 'app_role' claim.
-- Set via public.custom_access_token_hook (see supabase/auth_hook.sql), enabled in the
-- dashboard under Auth > Hooks. See build-plan.md section 4.

-- ============ helpers ============
create extension if not exists "pgcrypto";

-- ============ 1. universities ============
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text unique not null, -- e.g. 'AC'
  domain text unique, -- e.g. 'acity.edu.gh'; student/lecturer emails must match when set
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Self-service registration: creates the university + caller becomes its timetable_admin.
-- Called as the registering user (RLS bypassed inside, tenant scoping enforced by RLS after).
create or replace function public.register_university(
  p_name text, p_short_code text, p_domain text default null,
  p_admin_full_name text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uni uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.universities (name, short_code, domain, status, created_by)
  values (p_name, upper(p_short_code), lower(p_domain), 'active', auth.uid())
  returning id into v_uni;
  insert into public.profiles (id, university_id, email, full_name, role)
  values (auth.uid(), v_uni, coalesce(auth.jwt() ->> 'email', ''), p_admin_full_name, 'timetable_admin')
  on conflict (id) do update set university_id = excluded.university_id, role = 'timetable_admin',
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return v_uni;
end $$;

-- ============ 2. master data ============
create table public.lecturers (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  email text,
  department text not null,
  employment_type text not null default 'full-time' check (employment_type in ('full-time','part-time','adjunct')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (university_id, email)
);
create index on public.lecturers (university_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  code text not null, -- 'L-3', 'Lab-B'
  building text,
  capacity int not null check (capacity > 0),
  type text not null default 'lecture' check (type in ('lecture','computer_lab','other')),
  active boolean not null default true,
  unique (university_id, code)
);
create index on public.rooms (university_id);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  code text not null, -- 'BSc CS'
  name text not null,
  department text not null,
  unique (university_id, code)
);
create index on public.programmes (university_id);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  level int not null check (level in (100,200,300,400)),
  size int not null default 0 check (size >= 0),
  unique (university_id, programme_id, level)
);
create index on public.cohorts (university_id);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  code text not null, -- 'CS302'
  title text not null,
  department text not null,
  level int not null,
  is_elective boolean not null default false,
  unique (university_id, code)
);
create index on public.courses (university_id);

-- Which core courses each cohort takes (drives H3). Electives excluded — they use elective_choices.
create table public.cohort_courses (
  university_id uuid not null references public.universities(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (cohort_id, course_id)
);
create index on public.cohort_courses (university_id);

-- ============ 3. semesters + periods ============
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null, -- '2026/27 Semester 1'
  start_date date,
  end_date date,
  teaching_days int[] not null default '{1,2,3,4,5}', -- 1=Mon
  status text not null default 'setup' check (status in ('setup','availability','solving','review','published','closed')),
  config jsonb not null default '{}', -- preference weights P1-P9, solver tuning
  created_at timestamptz not null default now(),
  unique (university_id, name)
);
create index on public.semesters (university_id);

-- Per-semester time grid, fully chosen by each institution: any days, any number of
-- periods, any start/end times. Sessions occupy consecutive period_indexes on one day (H9).
create table public.periods (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  period_index int not null check (period_index between 1 and 24),
  start_time time not null,
  end_time time not null,
  constraint period_sane check (start_time < end_time),
  unique (semester_id, day_of_week, period_index)
);
create index on public.periods (semester_id);

-- No two periods on the same day may overlap in wall-clock time.
create or replace function public.no_period_overlap()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from public.periods
    where semester_id = new.semester_id and day_of_week = new.day_of_week and id != new.id
      and (new.start_time, new.end_time) overlaps (start_time, end_time)
  ) then raise exception 'period overlaps another period on day %', new.day_of_week; end if;
  return new;
end $$;
drop trigger if exists trg_no_period_overlap on public.periods;
create trigger trg_no_period_overlap before insert or update on public.periods
  for each row execute function public.no_period_overlap();

-- Seed a custom grid. Days and slots are arguments; the Academic City Mon-Fri 9x1hr
-- grid is just the default. Also syncs semesters.teaching_days.
-- Example custom: select public.seed_periods('<sem_id>', array[1,2,3,4],
--   array['08:00','10:00','13:00']::time[], array['10:00','12:00','15:00']::time[]);
create or replace function public.seed_periods(
  p_semester_id uuid,
  p_days int[] default array[1,2,3,4,5],
  p_starts time[] default array['08:00','09:10','10:20','11:30','12:40','13:50','15:00','16:10','17:20']::time[],
  p_ends time[] default array['09:00','10:10','11:20','12:30','13:40','14:50','16:00','17:10','18:20']::time[]
)
returns void language plpgsql as $$
declare
  v_uni uuid;
  d int; p int;
begin
  if array_length(p_starts, 1) is distinct from array_length(p_ends, 1) then
    raise exception 'starts and ends must have the same length';
  end if;
  select university_id into v_uni from public.semesters where id = p_semester_id;
  delete from public.periods where semester_id = p_semester_id;
  foreach d in array p_days loop
    if d < 1 or d > 7 then raise exception 'day % out of range 1-7', d; end if;
    for p in 1..array_length(p_starts, 1) loop
      insert into public.periods (university_id, semester_id, day_of_week, period_index, start_time, end_time)
      values (v_uni, p_semester_id, d, p, p_starts[p], p_ends[p]);
    end loop;
  end loop;
  update public.semesters set teaching_days = p_days where id = p_semester_id;
end $$;

-- ============ 4. sessions (solver unit) ============
-- One session = one block of consecutive periods, one room, one lecturer, one or more groups.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  session_key text not null, -- stable import key e.g. 'CS302-T1'
  component text not null default 'theory' check (component in ('theory','practical','workshop','project')),
  length_periods int not null default 2 check (length_periods >= 1),
  times_per_week int not null default 1 check (times_per_week >= 1),
  required_room_type text not null default 'lecture' check (required_room_type in ('lecture','computer_lab','other','any')),
  lecturer_id uuid references public.lecturers(id) on delete set null, -- null = TBA
  group_label text, -- 'Group A', null = whole cohort
  expected_students int not null default 0 check (expected_students >= 0),
  unique (semester_id, session_key)
);
create index on public.sessions (university_id);
create index on public.sessions (semester_id);

-- Cross-listing: one session serves several course codes (H3).
create table public.session_courses (
  university_id uuid not null references public.universities(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (session_id, course_id)
);
create index on public.session_courses (university_id);

-- ============ 5. students + electives + groups ============
create table public.students (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  index_number text not null,
  full_name text not null,
  email text,
  cohort_id uuid references public.cohorts(id) on delete set null,
  unique (university_id, index_number)
);
create index on public.students (university_id);
create index on public.students (cohort_id);

-- Which electives each student takes (drives H4 overlap map).
create table public.elective_choices (
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  unique (semester_id, student_id, course_id)
);
create index on public.elective_choices (semester_id);

-- Student assigned to a grouped session (H5). Groups of same course may run in parallel.
create table public.student_session_groups (
  university_id uuid not null references public.universities(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (session_id, student_id)
);

-- ============ 6. availability + blocks + rules ============
create table public.lecturer_availability (
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  lecturer_id uuid not null references public.lecturers(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  period_index int not null,
  status text not null check (status in ('available','preferred','unavailable')),
  reason text,
  primary key (semester_id, lecturer_id, day_of_week, period_index)
);

-- H12: blocked rooms / institution-wide blocked times (assembly, prayer). room_id null = all rooms.
create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  day_of_week int not null,
  period_index int not null,
  room_id uuid references public.rooms(id) on delete cascade,
  reason text not null
);
create index on public.blocked_slots (semester_id);

-- Rules/weights per semester (NFR-15: config, not code). Solver reads this.
create table public.semester_rules (
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  rule_id text not null, -- 'H1'..'H12', 'P1'..'P9'
  enabled boolean not null default true,
  weight int not null default 0,
  params jsonb not null default '{}',
  primary key (semester_id, rule_id)
);

-- ============ 7. versions + placements ============
create table public.timetable_versions (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','review','published')),
  created_by uuid,
  notes text,
  quality_score numeric,
  created_at timestamptz not null default now()
);
create index on public.timetable_versions (semester_id);
-- one published version per semester at a time (enforced in app on publish; partial index guards it)
create unique index one_published_per_semester on public.timetable_versions (semester_id)
  where status = 'published';

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  version_id uuid not null references public.timetable_versions(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  day_of_week int not null,
  start_period int not null,
  room_id uuid not null references public.rooms(id),
  locked boolean not null default false,
  override_reason text -- set only when an admin overrides a hard clash (logged)
);
create index on public.placements (version_id);
create index on public.placements (university_id);

-- ============ 8. solver jobs ============
create table public.solve_jobs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  version_id uuid references public.timetable_versions(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  progress int not null default 0 check (progress between 0 and 100),
  snapshot jsonb, -- frozen input for reproducibility
  quality_score numeric,
  conflict_report jsonb, -- [{session_key, reason}]
  error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.solve_jobs (semester_id);

-- ============ 9. profiles / audit / notifications ============
-- id = auth.users.id. university_id + role mirrored into JWT claims by auth hook.
create table public.profiles (
  id uuid primary key,
  university_id uuid references public.universities(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('super_admin','timetable_admin','hod','lecturer','student')),
  lecturer_id uuid references public.lecturers(id) on delete set null,
  student_id uuid references public.students(id) on delete set null
);
create index on public.profiles (university_id);

create table public.change_log (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  version_id uuid references public.timetable_versions(id) on delete set null,
  actor uuid,
  action text not null,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index on public.change_log (version_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  recipient uuid not null, -- profiles.id
  type text not null default 'move',
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (recipient) where read = false;

-- ============ 10. invites + join requests ============
-- Closed loop: admins invite by email OR approve requests. No open self-join into a tenant.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  email text not null,
  role text not null check (role in ('timetable_admin','hod','lecturer','student')),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  invited_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  unique (university_id, email)
);
create index on public.invites (token);

create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  full_name text,
  requested_role text not null check (requested_role in ('lecturer','student','hod')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (university_id, user_id)
);
create index on public.join_requests (university_id) where status = 'pending';

-- Accept an invite: links caller to the tenant with the invited role. Token single-use.
create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv public.invites%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_inv from public.invites where token = p_token;
  if not found then raise exception 'invalid invite'; end if;
  if v_inv.accepted_at is not null then raise exception 'invite already used'; end if;
  if v_inv.expires_at < now() then raise exception 'invite expired'; end if;
  update public.invites set accepted_at = now() where id = v_inv.id;
  insert into public.profiles (id, university_id, email, full_name, role)
  values (auth.uid(), v_inv.university_id, v_inv.email, null, v_inv.role)
  on conflict (id) do update set university_id = excluded.university_id, role = excluded.role;
  return v_inv.university_id;
end $$;

-- Request to join: any authenticated user picks an active institution from the directory.
create or replace function public.request_join(p_university_id uuid, p_role text, p_full_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_req uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_role not in ('lecturer','student','hod') then raise exception 'bad role'; end if;
  if not exists (select 1 from public.universities where id = p_university_id and status = 'active') then
    raise exception 'institution not available';
  end if;
  insert into public.join_requests (university_id, user_id, email, full_name, requested_role)
  values (p_university_id, auth.uid(), coalesce(auth.jwt() ->> 'email',''), p_full_name, p_role)
  on conflict (university_id, user_id) do update set requested_role = excluded.requested_role,
    full_name = coalesce(excluded.full_name, public.join_requests.full_name), status = 'pending'
  returning id into v_req;
  return v_req;
end $$;

-- Review a request: own timetable_admin approves (creates profile link) or rejects.
create or replace function public.review_join_request(p_request_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_req public.join_requests%rowtype; v_role text; v_uni uuid;
begin
  select * into v_req from public.join_requests where id = p_request_id;
  if not found then raise exception 'request not found'; end if;
  select (auth.jwt() ->> 'app_role'), (auth.jwt() ->> 'university_id')::uuid into v_role, v_uni;
  if v_role is null or v_role not in ('super_admin','timetable_admin') then
    raise exception 'not authorized';
  end if;
  if v_role != 'super_admin' and (v_uni is null or v_uni != v_req.university_id) then
    raise exception 'not authorized';
  end if;
  if v_req.status != 'pending' then raise exception 'already reviewed'; end if;
  if p_approve then
    insert into public.profiles (id, university_id, email, full_name, role)
    values (v_req.user_id, v_req.university_id, v_req.email, v_req.full_name, v_req.requested_role)
    on conflict (id) do update set university_id = excluded.university_id, role = excluded.role;
    update public.join_requests set status='approved', reviewed_by=auth.uid(), reviewed_at=now() where id=p_request_id;
  else
    update public.join_requests set status='rejected', reviewed_by=auth.uid(), reviewed_at=now() where id=p_request_id;
  end if;
end $$;

-- ============ RLS ============
-- Pattern: (select auth.jwt() ->> 'university_id') evaluates once per query (see build-plan.md).
-- service_role bypasses RLS (solver). Tests must cover every table (pgTAP) before real data load.

alter table public.lecturers enable row level security;
alter table public.rooms enable row level security;
alter table public.programmes enable row level security;
alter table public.cohorts enable row level security;
alter table public.courses enable row level security;
alter table public.cohort_courses enable row level security;
alter table public.semesters enable row level security;
alter table public.periods enable row level security;
alter table public.sessions enable row level security;
alter table public.session_courses enable row level security;
alter table public.students enable row level security;
alter table public.elective_choices enable row level security;
alter table public.student_session_groups enable row level security;
alter table public.lecturer_availability enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.semester_rules enable row level security;
alter table public.timetable_versions enable row level security;
alter table public.placements enable row level security;
alter table public.solve_jobs enable row level security;
alter table public.profiles enable row level security;
alter table public.change_log enable row level security;
alter table public.notifications enable row level security;
alter table public.invites enable row level security;
alter table public.join_requests enable row level security;

-- Super admins see everything; everyone else scoped to their university.
-- Read: any authenticated member of the university. Write: timetable_admin (+super_admin),
-- except lecturer_availability (lecturer edits own) and notifications (recipient marks read).

-- Helper macro pattern used per table (example for lecturers; repeat for all):
-- drop policy if exists ... ; create policy ...

-- universities: members see own row; anyone authenticated can see active institutions (directory);
-- registration via register_university() (SECURITY DEFINER); edits by own timetable_admin.
drop policy if exists "uni_select" on public.universities;
create policy "uni_select" on public.universities for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or id::text = (select auth.jwt() ->> 'university_id')
  or (status = 'active' and auth.uid() is not null)
);
drop policy if exists "uni_insert" on public.universities;
create policy "uni_insert" on public.universities for insert with check (false); -- use register_university()
drop policy if exists "uni_update" on public.universities;
create policy "uni_update" on public.universities for update using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
) with check (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
);
alter table public.universities enable row level security;
grant execute on function public.register_university(text, text, text, text) to authenticated;

-- Generic select-own-university + admin-write policies for master/semester tables.
-- Tables covered: lecturers, rooms, programmes, cohorts, courses, semesters, periods,
-- sessions, session_courses, students, elective_choices, student_session_groups,
-- blocked_slots, semester_rules, timetable_versions, placements, solve_jobs, change_log
do $$
declare t text;
begin
  foreach t in array array[
    'lecturers','rooms','programmes','cohorts','courses','cohort_courses','semesters','periods',
    'sessions','session_courses','students','elective_choices','student_session_groups',
    'blocked_slots','semester_rules','timetable_versions','placements','solve_jobs','change_log']
  loop
    execute format('drop policy if exists "%s_select" on public.%I', t||'_sel', t);
    execute format($p$
      create policy "%s" on public.%I for select using (
        (select auth.jwt() ->> 'app_role') = 'super_admin'
        or university_id::text = (select auth.jwt() ->> 'university_id')
      )$p$, t||'_sel', t);
    execute format('drop policy if exists "%s" on public.%I', t||'_wr', t);
    execute format($p$
      create policy "%s" on public.%I for all using (
        (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
        and (
          (select auth.jwt() ->> 'app_role') = 'super_admin'
          or university_id::text = (select auth.jwt() ->> 'university_id')
        )
      ) with check (
        (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
        and (
          (select auth.jwt() ->> 'app_role') = 'super_admin'
          or university_id::text = (select auth.jwt() ->> 'university_id')
        )
      )$p$, t||'_wr', t);
  end loop;
end $$;

-- lecturer_availability: lecturers read all (to coordinate) but write own; admins write all
drop policy if exists "avail_select" on public.lecturer_availability;
create policy "avail_select" on public.lecturer_availability for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or university_id::text = (select auth.jwt() ->> 'university_id')
);
drop policy if exists "avail_write" on public.lecturer_availability;
create policy "avail_write" on public.lecturer_availability for all using (
  ((select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
    and university_id::text = coalesce((select auth.jwt() ->> 'university_id'), university_id::text))
  or (
    (select auth.jwt() ->> 'app_role') = 'lecturer'
    and university_id::text = (select auth.jwt() ->> 'university_id')
    and lecturer_id::text = (select auth.jwt() ->> 'lecturer_id')
  )
) with check (
  ((select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin'))
  or (
    (select auth.jwt() ->> 'app_role') = 'lecturer'
    and university_id::text = (select auth.jwt() ->> 'university_id')
    and lecturer_id::text = (select auth.jwt() ->> 'lecturer_id')
  )
);

-- profiles: users see members of own university; signup inserts own row (then claims set by trigger/hook).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or university_id::text = (select auth.jwt() ->> 'university_id')
  or id::text = (select auth.uid()::text)
);
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (
  id::text = (select auth.uid()::text)
);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (
  (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
  or id::text = (select auth.uid()::text)
) with check (
  ((select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin'))
  or (
    id::text = (select auth.uid()::text)
    and university_id = (select university_id from public.profiles where id = auth.uid())
    and role = (select role from public.profiles where id = auth.uid())
  )
);

-- invites / join_requests: tenant admins manage; requesters see own requests.
drop policy if exists "inv_sel" on public.invites;
create policy "inv_sel" on public.invites for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or ((select auth.jwt() ->> 'app_role') in ('timetable_admin','hod')
      and university_id::text = (select auth.jwt() ->> 'university_id'))
);
drop policy if exists "inv_wr" on public.invites;
create policy "inv_wr" on public.invites for all using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (university_id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
) with check (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (university_id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
);
drop policy if exists "jr_sel" on public.join_requests;
create policy "jr_sel" on public.join_requests for select using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or ((select auth.jwt() ->> 'app_role') in ('timetable_admin','hod')
      and university_id::text = (select auth.jwt() ->> 'university_id'))
  or user_id::text = (select auth.uid()::text)
);
drop policy if exists "jr_wr" on public.join_requests;
create policy "jr_wr" on public.join_requests for all using (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (university_id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
) with check (
  (select auth.jwt() ->> 'app_role') = 'super_admin'
  or (university_id::text = (select auth.jwt() ->> 'university_id')
      and (select auth.jwt() ->> 'app_role') = 'timetable_admin')
);
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.request_join(uuid, text, text) to authenticated;
grant execute on function public.review_join_request(uuid, boolean) to authenticated;

-- notifications: recipient reads own and marks own read; admins insert/update all
drop policy if exists "notif_select" on public.notifications;
create policy "notif_select" on public.notifications for select using (
  recipient::text = (select auth.uid()::text)
  or (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
);
drop policy if exists "notif_insert" on public.notifications;
create policy "notif_insert" on public.notifications for insert with check (
  (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
);
drop policy if exists "notif_update" on public.notifications;
create policy "notif_update" on public.notifications for update using (
  recipient::text = (select auth.uid()::text)
  or (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
) with check (
  recipient::text = (select auth.uid()::text)
  or (select auth.jwt() ->> 'app_role') in ('super_admin','timetable_admin')
);
drop policy if exists "notif_write" on public.notifications;

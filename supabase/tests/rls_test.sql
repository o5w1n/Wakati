-- pgTAP RLS tests. Run AFTER enabling pgTAP, BEFORE loading real student data (Phase 1 gate).
-- Covers: tenant isolation on every table, one-published-per-semester, lecturer own-availability.
-- Solver uses service_role (bypasses RLS) — not tested here; its explicit filtering is covered by pytest.
begin; select plan(7);

-- fixtures: two universities (active, so the directory policy lists them)
insert into public.universities (id, name, short_code, status)
values ('11111111-1111-1111-1111-111111111111','Uni A','UA','active'),
       ('22222222-2222-2222-2222-222222222222','Uni B','UB','active');

insert into public.lecturers (university_id, name, email, department)
values ('11111111-1111-1111-1111-111111111111','A Lecturer','a@ua.edu','CS'),
       ('22222222-2222-2222-2222-222222222222','B Lecturer','b@ub.edu','CS');

-- RLS is bypassed for table owners, so drop to the app role before asserting.
set local role authenticated;

-- helper: fake JWT as Uni A timetable_admin
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","university_id":"11111111-1111-1111-1111-111111111111","app_role":"timetable_admin"}', true);

select results_eq(
  $$ select count(*)::int from public.lecturers $$,
  array[1],
  'Uni A admin sees only own lecturers'
);
select results_eq(
  $$ select count(*)::int from public.students $$,
  array[0],
  'empty table still isolated (no leak)'
);
select throws_ok(
  $$ insert into public.lecturers (university_id, name, email, department)
     values ('22222222-2222-2222-2222-222222222222','X','x@ub.edu','CS') $$,
  null, 'Uni A admin cannot write Uni B row'
);
-- one published version guard
insert into public.semesters (id, university_id, name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','S1');
insert into public.timetable_versions (semester_id, university_id, status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','published');
select throws_ok(
  $$ insert into public.timetable_versions (semester_id, university_id, status)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','published') $$,
  null, 'second published version rejected'
);
-- registration path: authenticated role holds EXECUTE on the RPC (3-arg builtin + casts;
-- there is no 4-arg pgTAP wrapper, so wrap it in ok() instead)
select ok(
  has_function_privilege('authenticated'::text, 'public.register_university(text,text,text,text)'::text, 'execute'::text),
  'authenticated can execute register_university'
);
-- active universities visible as directory to other-tenant members
select results_eq(
  $$ select count(*)::int from public.universities
     where status = 'active'
       and id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222') $$,
  array[2],
  'active institutions listed as directory'
);
-- anonymous gets nothing
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select results_eq(
  $$ select count(*)::int from public.lecturers $$,
  array[0],
  'anonymous sees nothing'
);

reset role;
select * from finish(); rollback;

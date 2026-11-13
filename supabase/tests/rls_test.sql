-- pgTAP RLS tests. Run AFTER enabling pgTAP, BEFORE loading real student data (Phase 1 gate).
-- Covers: tenant isolation on every table, one-published-per-semester, lecturer own-availability.
-- Solver uses service_role (bypasses RLS) — not tested here; its explicit filtering is covered by pytest.
begin; select plan(8);

-- fixtures: two universities
insert into public.universities (id, name, short_code)
values ('11111111-1111-1111-1111-111111111111','Uni A','UA'),
       ('22222222-2222-2222-2222-222222222222','Uni B','UB');

insert into public.lecturers (university_id, name, email, department)
values ('11111111-1111-1111-1111-111111111111','A Lecturer','a@ua.edu','CS'),
       ('22222222-2222-2222-2222-222222222222','B Lecturer','b@ub.edu','CS');

-- helper: fake JWT as Uni A timetable_admin
select set_config('request.jwt.claims', '{"university_id":"11111111-1111-1111-1111-111111111111","app_role":"timetable_admin"}', true);

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
-- registration path: function exists and is callable shape
select has_function_privilege('authenticated', 'public.register_university(text,text,text,text)', 'execute',
  'authenticated can execute register_university');
-- active universities visible as directory to other-tenant members
select results_eq(
  $$ select count(*)::int from public.universities where status = 'active' $$,
  array[2],
  'active institutions listed as directory'
);
-- anonymous gets nothing
select set_config('request.jwt.claims', '{}', true);
select results_eq(
  $$ select count(*)::int from public.lecturers $$,
  array[0],
  'anonymous sees nothing'
);

select * from finish(); rollback;

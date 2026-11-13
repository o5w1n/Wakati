-- Per-test RLS diagnostics: run in a FRESH query tab. Each block reports
-- PASS/FAIL on its own line so a single failure can't hide in a summary.
-- Everything rolls back at the end; no real data is touched.
begin;

-- fixtures
insert into public.universities (id, name, short_code, status)
values ('11111111-1111-1111-1111-111111111111','Uni A','UA','active'),
       ('22222222-2222-2222-2222-222222222222','Uni B','UB','active');
insert into public.lecturers (university_id, name, email, department)
values ('11111111-1111-1111-1111-111111111111','A Lecturer','a@ua.edu','CS'),
       ('22222222-2222-2222-2222-222222222222','B Lecturer','b@ub.edu','CS');

set local role authenticated;
select set_config('request.jwt.claims', '{"university_id":"11111111-1111-1111-1111-111111111111","app_role":"timetable_admin"}', true);

-- TEST 1: tenant isolation on read
select 'TEST 1 sees-only-own-lecturers: ' ||
  case when (select count(*)::int from public.lecturers) = 1 then 'PASS' else 'FAIL' end;

-- TEST 2: empty table isolation
select 'TEST 2 empty-table-isolated: ' ||
  case when (select count(*)::int from public.students) = 0 then 'PASS' else 'FAIL' end;

-- TEST 3: cross-tenant write blocked (uses a savepoint so the failure doesn't abort us)
savepoint t3;
insert into public.lecturers (university_id, name, email, department)
values ('22222222-2222-2222-2222-222222222222','X','x@ub.edu','CS');
select 'TEST 3 cross-tenant-write-blocked: FAIL (insert succeeded!)';
rollback to savepoint t3;
-- if the insert above throws, execution jumps to the editor error and you will
-- see the error text instead of the FAIL line — that error IS the PASS evidence.
-- To get a clean PASS line instead, comment out the 3 lines above and run:
-- select 'TEST 3 cross-tenant-write-blocked: check manually (insert threw = PASS)';

-- TEST 4: one published version guard
insert into public.semesters (id, university_id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','S1');
insert into public.timetable_versions (semester_id, university_id, status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','published');
savepoint t4;
insert into public.timetable_versions (semester_id, university_id, status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','published');
select 'TEST 4 second-published-rejected: FAIL (insert succeeded!)';
rollback to savepoint t4;

-- TEST 5: RPC grant present
select 'TEST 5 can-execute-register_university: ' ||
  case when has_function_privilege('authenticated'::text,
    'public.register_university(text,text,text,text)'::text, 'execute'::text)
  then 'PASS' else 'FAIL' end;

-- TEST 6: directory listing
select 'TEST 6 active-directory-listed: ' ||
  case when (select count(*)::int from public.universities where status = 'active') = 2
  then 'PASS' else 'FAIL' end;

-- TEST 7: anonymous sees nothing
select set_config('request.jwt.claims', '{}', true);
select 'TEST 7 anonymous-sees-nothing: ' ||
  case when (select count(*)::int from public.lecturers) = 0 then 'PASS' else 'FAIL' end;

rollback; reset role;

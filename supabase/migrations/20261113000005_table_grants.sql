-- Table-level privileges for the anon/authenticated roles.
-- RLS policies already decide *which rows* each caller sees; without these GRANTs the
-- browser (anon/authenticated) cannot touch the tables at all, even where a policy allows it.
-- Safe: service_role bypasses both RLS and grants; these only open the door that RLS guards.

-- Read access: every app table readable when an RLS select policy allows it.
grant select on
  public.universities, public.lecturers, public.rooms, public.programmes,
  public.cohorts, public.courses, public.cohort_courses, public.semesters,
  public.periods, public.sessions, public.session_courses, public.students,
  public.elective_choices, public.student_session_groups, public.lecturer_availability,
  public.blocked_slots, public.semester_rules, public.timetable_versions,
  public.placements, public.solve_jobs, public.profiles, public.change_log,
  public.notifications, public.invites, public.join_requests
to authenticated;
grant select on public.universities to anon;

-- Write access: only where RLS write policies exist.
-- Master + semester + solver tables: timetable_admin writes via the app.
grant insert, update, delete on
  public.lecturers, public.rooms, public.programmes,
  public.cohorts, public.courses, public.cohort_courses, public.semesters,
  public.periods, public.sessions, public.session_courses, public.students,
  public.elective_choices, public.student_session_groups,
  public.blocked_slots, public.semester_rules, public.timetable_versions,
  public.placements, public.solve_jobs
to authenticated;

-- lecturer_availability: lecturers write their own rows; admins write all (RLS decides).
grant insert, update, delete on public.lecturer_availability to authenticated;

-- profiles: users insert/update their own row; role changes guarded by RLS WITH CHECK.
grant insert, update on public.profiles to authenticated;

-- invites / join_requests: admins manage invites; request flow via request_join().
grant insert, update, delete on public.invites, public.join_requests to authenticated;

-- notifications: admins/members insert; recipients mark their own read (RLS decides).
grant insert, update on public.notifications to authenticated;

-- change_log: app writes audit entries on publish/solve.
grant insert on public.change_log to authenticated;

-- RPCs the app calls directly as the signed-in user.
grant execute on function public.seed_default_rules(uuid) to authenticated;

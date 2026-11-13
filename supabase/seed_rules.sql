-- Seed default rule toggles + weights for a semester. Call with the semester id:
--   select public.seed_default_rules('<semester_id>');
-- H1-H12 enabled, weights 0 (hard). P1-P9 enabled with starter weights, tunable per semester.
create or replace function public.seed_default_rules(p_semester_id uuid)
returns void language plpgsql set search_path = public as $$
declare v_uni uuid;
begin
  select university_id into v_uni from public.semesters where id = p_semester_id;
  insert into public.semester_rules (university_id, semester_id, rule_id, enabled, weight, params)
  values
    (v_uni, p_semester_id, 'H1', true, 0, '{}'),
    (v_uni, p_semester_id, 'H2', true, 0, '{}'),
    (v_uni, p_semester_id, 'H3', true, 0, '{}'),
    (v_uni, p_semester_id, 'H4', true, 0, '{}'),
    (v_uni, p_semester_id, 'H5', true, 0, '{}'),
    (v_uni, p_semester_id, 'H6', true, 0, '{}'),
    (v_uni, p_semester_id, 'H7', true, 0, '{}'),
    (v_uni, p_semester_id, 'H8', true, 0, '{}'),
    (v_uni, p_semester_id, 'H9', true, 0, '{}'),
    (v_uni, p_semester_id, 'H10', true, 0, '{}'),
    (v_uni, p_semester_id, 'H11', true, 0, '{}'),
    (v_uni, p_semester_id, 'H12', true, 0, '{}'),
    (v_uni, p_semester_id, 'P1', true, 10, '{}'),
    (v_uni, p_semester_id, 'P2', true, 8, '{}'),
    (v_uni, p_semester_id, 'P3', true, 6, '{}'),
    (v_uni, p_semester_id, 'P4', true, 5, '{}'),
    (v_uni, p_semester_id, 'P5', true, 5, '{"max_periods_per_day": 6}'),
    (v_uni, p_semester_id, 'P6', true, 5, '{"max_consecutive": 3}'),
    (v_uni, p_semester_id, 'P7', true, 3, '{}'),
    (v_uni, p_semester_id, 'P8', true, 2, '{}'),
    (v_uni, p_semester_id, 'P9', true, 7, '{}')
  on conflict do nothing;
end $$;

grant execute on function public.seed_default_rules(uuid) to authenticated;

-- Elective overlap map (H4): pairs of electives with shared-student counts.
-- The solver reads this to allow zero-overlap pairs to share a slot.
-- security_invoker: RLS on elective_choices applies as the querying user, not the view owner.
create or replace view public.elective_overlap_map with (security_invoker = true) as
select
  e1.semester_id,
  e1.university_id,
  e1.course_id as course_a,
  e2.course_id as course_b,
  count(*) filter (where e1.student_id = e2.student_id) as shared_students
from public.elective_choices e1
join public.elective_choices e2
  on e1.semester_id = e2.semester_id
 and e1.student_id = e2.student_id
 and e1.course_id < e2.course_id
group by e1.semester_id, e1.university_id, e1.course_id, e2.course_id;

-- Execute grants for seed functions (called by timetable_admin from the app)
grant execute on function public.seed_periods(uuid, int[], time[], time[]) to authenticated;
grant execute on function public.seed_default_rules(uuid) to authenticated;

-- Custom access token hook: mirrors the caller's profile into JWT claims.
-- Reads public.profiles (id = auth user id) and injects:
--   app_role      (super_admin|timetable_admin|hod|lecturer|student)
--   university_id (tenant scope used by every RLS policy)
--   lecturer_id   (for lecturer own-availability writes)
-- Enable in dashboard: Auth > Hooks > Custom Access Token > postgres public.custom_access_token_hook.
-- IMPORTANT: leaves the reserved top-level 'role' claim (database role) untouched.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  claims jsonb;
  v_profile public.profiles%rowtype;
begin
  claims := event -> 'claims';
  select * into v_profile from public.profiles where id = (event ->> 'user_id')::uuid;
  if found then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(v_profile.role));
    if v_profile.university_id is not null then
      claims := jsonb_set(claims, '{university_id}', to_jsonb(v_profile.university_id::text));
    end if;
    if v_profile.lecturer_id is not null then
      claims := jsonb_set(claims, '{lecturer_id}', to_jsonb(v_profile.lecturer_id::text));
    end if;
  end if;
  return jsonb_build_object('claims', claims);
end $$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

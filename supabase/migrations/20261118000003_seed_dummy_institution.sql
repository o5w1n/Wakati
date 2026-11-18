-- Seed a dummy institution for testing, plus sample access codes.
-- Institution: Wakati Demo University (code: DEMO, status: active)
-- Sample access codes (multi-use, no expiry):
--   STU-DEMO01  -> student
--   LEC-DEMO01  -> lecturer
--   HOD-DEMO01  -> hod
--   ADM-DEMO01  -> timetable_admin
-- Dummy timetable admin account (linked to DEMO):
--   Email: registry@demo.wakati.local / Password: DemoAdmin123!
-- Safe to re-run (idempotent).

do $$
declare
  v_uni_id uuid := '11111111-1111-4111-8111-111111111111';
  v_admin_uid uuid := '11111111-1111-4111-8111-111111111101';
  v_admin_email text := 'registry@demo.wakati.local';
  v_admin_password text := 'DemoAdmin123!';
  v_admin_name text := 'Demo Registry Admin';
begin
  -- dummy institution
  insert into public.universities (id, name, short_code, domain, status, settings, created_at)
  values (v_uni_id, 'Wakati Demo University', 'DEMO', null, 'active', '{}'::jsonb, now())
  on conflict (id) do update
    set name = excluded.name,
        short_code = excluded.short_code,
        domain = excluded.domain,
        status = 'active';

  -- sample access codes (role-scoped, reusable for testing)
  insert into public.institution_access_codes (university_id, role, code, label, active, uses_count)
  values
    (v_uni_id, 'student',         'STU-DEMO01', 'Demo student access',  true, 0),
    (v_uni_id, 'lecturer',        'LEC-DEMO01', 'Demo lecturer access', true, 0),
    (v_uni_id, 'hod',             'HOD-DEMO01', 'Demo HOD access',      true, 0),
    (v_uni_id, 'timetable_admin', 'ADM-DEMO01', 'Demo admin access',    true, 0)
  on conflict (university_id, role, code) do update
    set label = excluded.label,
        active = true;

  -- dummy timetable admin auth user
  if not exists (select 1 from auth.users where lower(email) = lower(v_admin_email)) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_admin_uid,
      'authenticated',
      'authenticated',
      v_admin_email,
      extensions.crypt(v_admin_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_admin_name),
      now(), now(), '', '', '', ''
    );
  else
    select id into v_admin_uid from auth.users where lower(email) = lower(v_admin_email) limit 1;
    update auth.users
      set encrypted_password = extensions.crypt(v_admin_password, extensions.gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          updated_at = now(),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_admin_name)
    where id = v_admin_uid;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_admin_uid and provider = 'email') then
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(),
      v_admin_uid,
      v_admin_uid::text,
      jsonb_build_object('sub', v_admin_uid::text, 'email', v_admin_email, 'email_verified', true),
      'email',
      now(), now(), now()
    );
  else
    update auth.identities
      set identity_data = jsonb_build_object('sub', v_admin_uid::text, 'email', v_admin_email, 'email_verified', true),
          updated_at = now()
    where user_id = v_admin_uid and provider = 'email';
  end if;

  insert into public.profiles (id, university_id, email, full_name, role)
  values (v_admin_uid, v_uni_id, v_admin_email, v_admin_name, 'timetable_admin')
  on conflict (id) do update
    set university_id = excluded.university_id,
        role = 'timetable_admin',
        email = excluded.email,
        full_name = excluded.full_name;
end $$;

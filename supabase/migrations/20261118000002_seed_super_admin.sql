-- Seed a super_admin creator/test account.
-- Email: jesudunyinayobolu@gmail.com / Password: Iretomilowo20$
-- Safe to re-run (idempotent). Run with sufficient privileges (service role / postgres).
-- After running, sign in at /login and you should land on /admin.

do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-00000000a001';
  v_email text := 'jesudunyinayobolu@gmail.com';
  v_password text := 'Iretomilowo20$';
  v_name text := 'Jesudunyin Ayobolu';
begin
  -- create auth user if missing (or locate existing)
  if not exists (select 1 from auth.users where lower(email) = lower(v_email)) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_name),
      now(), now(), '', '', '', ''
    );
  else
    select id into v_uid from auth.users where lower(email) = lower(v_email) limit 1;
    -- ensure password and confirmation for the requested account
    update auth.users
      set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          updated_at = now(),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_name)
    where id = v_uid;
  end if;

  -- identity for email provider
  if not exists (select 1 from auth.identities where user_id = v_uid and provider = 'email') then
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(),
      v_uid,
      v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email',
      now(), now(), now()
    );
  else
    update auth.identities
      set identity_data = jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
          updated_at = now()
    where user_id = v_uid and provider = 'email';
  end if;

  -- super_admin profile (no university)
  insert into public.profiles (id, university_id, email, full_name, role)
  values (v_uid, null, v_email, v_name, 'super_admin')
  on conflict (id) do update
    set role = 'super_admin',
        full_name = excluded.full_name,
        email = excluded.email,
        university_id = null;
end $$;

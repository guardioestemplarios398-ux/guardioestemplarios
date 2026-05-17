-- =====================================================
-- CRIAR ADMINISTRADOR DE TESTE
-- Guardiões Templários Check-in
-- E-mail: douglasnoticias@gmail.com
-- Senha de teste: tabella1991
--
-- Use somente em ambiente de teste. Em produção, crie o usuário
-- pelo painel Authentication > Users e use uma senha forte.
-- =====================================================

create extension if not exists "pgcrypto";

do $$
declare
  v_user_id uuid;
  v_email text := 'douglasnoticias@gmail.com';
  v_password text := 'tabella1991';
  v_identity_exists boolean;
begin
  select id
  into v_user_id
  from auth.users
  where email = v_email
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin,
      is_sso_user,
      is_anonymous
    )
    values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Douglas Francisco"}'::jsonb,
      now(),
      now(),
      false,
      false,
      false
    );
  else
    update auth.users
    set
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"name":"Douglas Francisco"}'::jsonb,
      updated_at = now()
    where id = v_user_id;
  end if;

  select exists (
    select 1
    from auth.identities
    where user_id = v_user_id
      and provider = 'email'
  )
  into v_identity_exists;

  if not v_identity_exists then
    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_user_id,
      v_email,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  insert into public.admin_users (
    user_id,
    name,
    role,
    active
  )
  values (
    v_user_id,
    'Douglas Francisco',
    'admin',
    true
  )
  on conflict (user_id) do update
  set
    name = excluded.name,
    role = excluded.role,
    active = true;

end $$;

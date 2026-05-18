-- =====================================================
-- GUARDIÕES TEMPLÁRIOS CHECK-IN
-- CORREÇÃO FINAL DO LOGIN LOCAL
--
-- Corrige erro:
--   function crypt(text, text) does not exist
--
-- Motivo:
--   No Supabase, a extensão pgcrypto pode ficar no schema "extensions".
--   As funções precisam usar search_path = public, extensions.
--
-- Logins:
--   douglas francisco  / 123456
--   cristian valente   / 123456
-- =====================================================

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

set search_path = public, extensions;

-- =====================================================
-- 1. TABELAS DO SISTEMA
-- =====================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  location text,
  event_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  full_name text not null,
  cim text,
  grau text,
  phone text,
  email text,
  city text,
  is_guardioes boolean not null default false,
  other_institution text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.checkins add column if not exists cim text;
alter table public.checkins add column if not exists grau text;

create table if not exists public.app_admin_users (
  id uuid primary key default gen_random_uuid(),
  login_name text not null,
  login_key text not null unique,
  display_name text not null,
  password_hash text not null,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- =====================================================
-- 2. EVENTO PADRÃO
-- =====================================================

insert into public.events (
  name,
  slug,
  description,
  location,
  event_date,
  active
)
values (
  'Check-in Guardiões Templários 33 N° 4637',
  'checkin-diario-templo',
  'Controle de presença da Loja Guardiões Templários 33 N° 4637.',
  'Guardiões Templários 33 N° 4637',
  current_date,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  location = excluded.location,
  event_date = current_date,
  active = true;

-- =====================================================
-- 3. LIMPAR SESSÕES ANTIGAS E RESETAR USUÁRIOS
-- =====================================================

delete from public.app_admin_sessions;

insert into public.app_admin_users (
  login_name,
  login_key,
  display_name,
  password_hash,
  role,
  active,
  updated_at
)
values
  (
    'douglas francisco',
    regexp_replace(lower(trim('douglas francisco')), '[[:space:]]+', ' ', 'g'),
    'Douglas Francisco',
    crypt('123456', gen_salt('bf')),
    'admin',
    true,
    now()
  ),
  (
    'cristian valente',
    regexp_replace(lower(trim('cristian valente')), '[[:space:]]+', ' ', 'g'),
    'Cristian Valente',
    crypt('123456', gen_salt('bf')),
    'admin',
    true,
    now()
  )
on conflict (login_key) do update
set
  login_name = excluded.login_name,
  display_name = excluded.display_name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  active = true,
  updated_at = now();

-- =====================================================
-- 4. RECRIAR FUNÇÕES
-- =====================================================

drop function if exists public.local_admin_login(text, text);
drop function if exists public.local_admin_validate(text);
drop function if exists public.local_admin_logout(text);
drop function if exists public.local_admin_change_password(text, text, text);
drop function if exists public.admin_list_checkins(text, timestamptz, timestamptz);
drop function if exists public.admin_list_events(text);
drop function if exists public.admin_create_event(text, text, text, text, text, date, boolean);
drop function if exists public.admin_set_event_active(text, uuid, boolean);
drop function if exists public.require_local_admin(text);

create or replace function public.local_admin_login(
  p_login text,
  p_password text
)
returns table (
  token text,
  user_id uuid,
  display_name text,
  role text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_login_key text;
  v_user public.app_admin_users%rowtype;
  v_token text;
  v_expires_at timestamptz;
begin
  v_login_key := regexp_replace(lower(trim(coalesce(p_login, ''))), '[[:space:]]+', ' ', 'g');

  select *
  into v_user
  from public.app_admin_users
  where login_key = v_login_key
    and active = true
  limit 1;

  if v_user.id is null then
    return;
  end if;

  if v_user.password_hash <> crypt(coalesce(p_password, ''), v_user.password_hash) then
    return;
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '12 hours';

  insert into public.app_admin_sessions (
    user_id,
    token_hash,
    expires_at,
    last_seen_at
  )
  values (
    v_user.id,
    encode(digest(v_token, 'sha256'), 'hex'),
    v_expires_at,
    now()
  );

  return query
  select
    v_token,
    v_user.id,
    v_user.display_name,
    v_user.role,
    v_expires_at;
end;
$$;

create or replace function public.require_local_admin(
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_token_hash text;
begin
  v_token_hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  select s.user_id
  into v_user_id
  from public.app_admin_sessions s
  join public.app_admin_users u on u.id = s.user_id
  where s.token_hash = v_token_hash
    and s.expires_at > now()
    and u.active = true
  limit 1;

  if v_user_id is null then
    raise exception 'Sessão administrativa inválida ou expirada';
  end if;

  update public.app_admin_sessions
  set last_seen_at = now()
  where token_hash = v_token_hash;

  return v_user_id;
end;
$$;

create or replace function public.local_admin_validate(
  p_token text
)
returns table (
  user_id uuid,
  display_name text,
  role text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  return query
  select
    u.id,
    u.display_name,
    u.role,
    s.expires_at
  from public.app_admin_sessions s
  join public.app_admin_users u on u.id = s.user_id
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and s.expires_at > now()
    and u.active = true
  limit 1;
end;
$$;

create or replace function public.local_admin_logout(
  p_token text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.app_admin_sessions
  set expires_at = now()
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  return true;
end;
$$;


create or replace function public.local_admin_change_password(
  p_token text,
  p_current_password text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_user public.app_admin_users%rowtype;
begin
  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'A nova senha precisa ter pelo menos 6 caracteres';
  end if;

  v_user_id := public.require_local_admin(p_token);

  select *
  into v_user
  from public.app_admin_users
  where id = v_user_id
    and active = true
  limit 1;

  if v_user.id is null then
    return false;
  end if;

  if v_user.password_hash <> crypt(coalesce(p_current_password, ''), v_user.password_hash) then
    return false;
  end if;

  update public.app_admin_users
  set
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  where id = v_user.id;

  update public.app_admin_sessions
  set expires_at = now()
  where user_id = v_user.id
    and token_hash <> encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  return true;
end;
$$;

create or replace function public.admin_list_checkins(
  p_token text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  id uuid,
  event_id uuid,
  event_name text,
  event_slug text,
  full_name text,
  cim text,
  grau text,
  phone text,
  email text,
  city text,
  is_guardioes boolean,
  other_institution text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  return query
  select
    c.id,
    c.event_id,
    e.name as event_name,
    e.slug as event_slug,
    c.full_name,
    c.cim,
    c.grau,
    c.phone,
    c.email,
    c.city,
    c.is_guardioes,
    c.other_institution,
    c.notes,
    c.created_at
  from public.checkins c
  left join public.events e on e.id = c.event_id
  where c.created_at >= p_start
    and c.created_at <= p_end
  order by c.created_at desc;
end;
$$;

create or replace function public.admin_list_events(
  p_token text
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  location text,
  event_date date,
  active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  return query
  select
    e.id,
    e.name,
    e.slug,
    e.description,
    e.location,
    e.event_date,
    e.active,
    e.created_at
  from public.events e
  order by e.created_at desc;
end;
$$;

create or replace function public.admin_create_event(
  p_token text,
  p_name text,
  p_slug text,
  p_description text default null,
  p_location text default null,
  p_event_date date default null,
  p_active boolean default true
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  location text,
  event_date date,
  active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  return query
  insert into public.events (
    name,
    slug,
    description,
    location,
    event_date,
    active
  )
  values (
    trim(p_name),
    trim(p_slug),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_location, '')), ''),
    p_event_date,
    coalesce(p_active, true)
  )
  returning
    events.id,
    events.name,
    events.slug,
    events.description,
    events.location,
    events.event_date,
    events.active,
    events.created_at;
end;
$$;

create or replace function public.admin_set_event_active(
  p_token text,
  p_event_id uuid,
  p_active boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  update public.events
  set active = p_active
  where id = p_event_id;

  return true;
end;
$$;

-- =====================================================
-- 5. RLS E PERMISSÕES
-- =====================================================

alter table public.events enable row level security;
alter table public.checkins enable row level security;
alter table public.app_admin_users enable row level security;
alter table public.app_admin_sessions enable row level security;

drop policy if exists "public_view_active_events" on public.events;
drop policy if exists "public_insert_checkins" on public.checkins;

create policy "public_view_active_events"
on public.events
for select
to anon, authenticated
using (active = true);

create policy "public_insert_checkins"
on public.checkins
for insert
to anon, authenticated
with check (true);

grant usage on schema public to anon, authenticated;

grant select on public.events to anon, authenticated;
grant insert on public.checkins to anon, authenticated;

grant execute on function public.local_admin_login(text, text) to anon, authenticated;
grant execute on function public.local_admin_validate(text) to anon, authenticated;
grant execute on function public.local_admin_logout(text) to anon, authenticated;
grant execute on function public.local_admin_change_password(text, text, text) to anon, authenticated;
grant execute on function public.require_local_admin(text) to anon, authenticated;
grant execute on function public.admin_list_checkins(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.admin_list_events(text) to anon, authenticated;
grant execute on function public.admin_create_event(text, text, text, text, text, date, boolean) to anon, authenticated;
grant execute on function public.admin_set_event_active(text, uuid, boolean) to anon, authenticated;

create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_active on public.events(active);
create index if not exists idx_checkins_event_id on public.checkins(event_id);
create index if not exists idx_checkins_created_at on public.checkins(created_at desc);
create index if not exists idx_checkins_cim on public.checkins(cim);
create index if not exists idx_checkins_grau on public.checkins(grau);
create index if not exists idx_app_admin_users_login_key on public.app_admin_users(login_key);
create index if not exists idx_app_admin_sessions_token_hash on public.app_admin_sessions(token_hash);
create index if not exists idx_app_admin_sessions_expires_at on public.app_admin_sessions(expires_at);

-- =====================================================
-- 6. TESTES FINAIS
-- =====================================================

select
  login_name,
  display_name,
  role,
  active
from public.app_admin_users
order by display_name;

select
  display_name,
  role,
  expires_at
from public.local_admin_login('douglas francisco', '123456');


-- =====================================================
-- CORREÇÃO: LISTAR CIM/GRAU + EDITAR/EXCLUIR CHECK-INS
-- Execute no Supabase SQL Editor
-- =====================================================

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

set search_path = public, extensions;

alter table public.checkins add column if not exists cim text;
alter table public.checkins add column if not exists grau text;

create index if not exists idx_checkins_cim on public.checkins(cim);
create index if not exists idx_checkins_grau on public.checkins(grau);

drop function if exists public.admin_list_checkins(text, timestamptz, timestamptz);
drop function if exists public.admin_update_checkin(text, uuid, text, text, text, boolean, text, text);
drop function if exists public.admin_delete_checkin(text, uuid);

create or replace function public.admin_list_checkins(
  p_token text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  id uuid,
  event_id uuid,
  event_name text,
  event_slug text,
  full_name text,
  cim text,
  grau text,
  phone text,
  email text,
  city text,
  is_guardioes boolean,
  other_institution text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  return query
  select
    c.id,
    c.event_id,
    e.name as event_name,
    e.slug as event_slug,
    c.full_name,
    c.cim,
    c.grau,
    c.phone,
    c.email,
    c.city,
    c.is_guardioes,
    c.other_institution,
    c.notes,
    c.created_at
  from public.checkins c
  left join public.events e on e.id = c.event_id
  where c.created_at >= p_start
    and c.created_at <= p_end
  order by c.created_at desc;
end;
$$;

create or replace function public.admin_update_checkin(
  p_token text,
  p_checkin_id uuid,
  p_full_name text,
  p_cim text,
  p_grau text,
  p_is_guardioes boolean,
  p_other_institution text,
  p_notes text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  update public.checkins
  set
    full_name = trim(coalesce(p_full_name, full_name)),
    cim = nullif(trim(coalesce(p_cim, '')), ''),
    grau = nullif(trim(coalesce(p_grau, '')), ''),
    is_guardioes = coalesce(p_is_guardioes, is_guardioes),
    other_institution = case
      when coalesce(p_is_guardioes, is_guardioes) = true then null
      else nullif(trim(coalesce(p_other_institution, '')), '')
    end,
    notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_checkin_id;

  return found;
end;
$$;

create or replace function public.admin_delete_checkin(
  p_token text,
  p_checkin_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  delete from public.checkins
  where id = p_checkin_id;

  return found;
end;
$$;

grant execute on function public.admin_list_checkins(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.admin_update_checkin(text, uuid, text, text, text, boolean, text, text) to anon, authenticated;
grant execute on function public.admin_delete_checkin(text, uuid) to anon, authenticated;

select 'Funções de listar, editar e excluir check-ins atualizadas com sucesso.' as status;


-- =====================================================
-- CORREÇÃO DEFINITIVA: CIM/GRAU + EDITAR + EXCLUIR
-- Guardiões Templários 33 N° 4637
--
-- Corrige:
-- 1) CIM e GRAU não aparecendo no painel
-- 2) Função admin_delete_checkin ambígua
-- 3) Edição e exclusão manual
-- =====================================================

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

set search_path = public, extensions;

-- =====================================================
-- 1. GARANTIR COLUNAS
-- =====================================================

alter table public.checkins add column if not exists cim text;
alter table public.checkins add column if not exists grau text;

create index if not exists idx_checkins_cim on public.checkins(cim);
create index if not exists idx_checkins_grau on public.checkins(grau);

-- =====================================================
-- 2. REMOVER FUNÇÕES ANTIGAS/AMBÍGUAS
-- =====================================================

drop function if exists public.admin_delete_checkin(text, uuid);
drop function if exists public.admin_delete_checkin(uuid, text);
drop function if exists public.admin_update_checkin(text, uuid, text, text, text, boolean, text, text);
drop function if exists public.admin_list_checkins(text, timestamptz, timestamptz);

drop function if exists public.admin_delete_checkin_v2(text, uuid);
drop function if exists public.admin_update_checkin_v2(text, uuid, text, text, text, boolean, text, text);
drop function if exists public.admin_list_checkins_v2(text, timestamptz, timestamptz);

-- =====================================================
-- 3. LISTAR CHECK-INS COM CIM E GRAU
-- =====================================================

create or replace function public.admin_list_checkins_v2(
  p_token text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  id uuid,
  event_id uuid,
  event_name text,
  event_slug text,
  full_name text,
  cim text,
  grau text,
  phone text,
  email text,
  city text,
  is_guardioes boolean,
  other_institution text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  return query
  select
    c.id,
    c.event_id,
    e.name as event_name,
    e.slug as event_slug,
    c.full_name,
    c.cim,
    c.grau,
    c.phone,
    c.email,
    c.city,
    c.is_guardioes,
    c.other_institution,
    c.notes,
    c.created_at
  from public.checkins c
  left join public.events e on e.id = c.event_id
  where c.created_at >= p_start
    and c.created_at <= p_end
  order by c.created_at desc;
end;
$$;

-- Compatibilidade para telas antigas ainda chamando admin_list_checkins
create or replace function public.admin_list_checkins(
  p_token text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  id uuid,
  event_id uuid,
  event_name text,
  event_slug text,
  full_name text,
  cim text,
  grau text,
  phone text,
  email text,
  city text,
  is_guardioes boolean,
  other_institution text,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select *
  from public.admin_list_checkins_v2(p_token, p_start, p_end);
end;
$$;

-- =====================================================
-- 4. EDITAR CHECK-IN
-- =====================================================

create or replace function public.admin_update_checkin_v2(
  p_token text,
  p_checkin_id uuid,
  p_full_name text,
  p_cim text,
  p_grau text,
  p_is_guardioes boolean,
  p_other_institution text,
  p_notes text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  update public.checkins
  set
    full_name = trim(coalesce(p_full_name, full_name)),
    cim = nullif(trim(coalesce(p_cim, '')), ''),
    grau = nullif(trim(coalesce(p_grau, '')), ''),
    is_guardioes = coalesce(p_is_guardioes, is_guardioes),
    other_institution = case
      when coalesce(p_is_guardioes, is_guardioes) = true then null
      else nullif(trim(coalesce(p_other_institution, '')), '')
    end,
    notes = nullif(trim(coalesce(p_notes, '')), '')
  where id = p_checkin_id;

  return found;
end;
$$;

-- Compatibilidade para telas antigas
create or replace function public.admin_update_checkin(
  p_token text,
  p_checkin_id uuid,
  p_full_name text,
  p_cim text,
  p_grau text,
  p_is_guardioes boolean,
  p_other_institution text,
  p_notes text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return public.admin_update_checkin_v2(
    p_token,
    p_checkin_id,
    p_full_name,
    p_cim,
    p_grau,
    p_is_guardioes,
    p_other_institution,
    p_notes
  );
end;
$$;

-- =====================================================
-- 5. EXCLUIR CHECK-IN SEM AMBIGUIDADE
-- =====================================================

create or replace function public.admin_delete_checkin_v2(
  p_token text,
  p_checkin_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.require_local_admin(p_token);

  delete from public.checkins
  where id = p_checkin_id;

  return found;
end;
$$;

-- Compatibilidade para telas antigas, com uma única assinatura
create or replace function public.admin_delete_checkin(
  p_token text,
  p_checkin_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return public.admin_delete_checkin_v2(p_token, p_checkin_id);
end;
$$;

-- =====================================================
-- 6. PERMISSÕES
-- =====================================================

grant execute on function public.admin_list_checkins_v2(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.admin_list_checkins(text, timestamptz, timestamptz) to anon, authenticated;

grant execute on function public.admin_update_checkin_v2(text, uuid, text, text, text, boolean, text, text) to anon, authenticated;
grant execute on function public.admin_update_checkin(text, uuid, text, text, text, boolean, text, text) to anon, authenticated;

grant execute on function public.admin_delete_checkin_v2(text, uuid) to anon, authenticated;
grant execute on function public.admin_delete_checkin(text, uuid) to anon, authenticated;

-- =====================================================
-- 7. RECARREGAR CACHE DO SUPABASE/POSTGREST
-- =====================================================

notify pgrst, 'reload schema';

-- =====================================================
-- 8. TESTE VISUAL
-- =====================================================

select
  full_name,
  cim,
  grau,
  is_guardioes,
  other_institution,
  created_at
from public.checkins
order by created_at desc
limit 10;

select 'Funções v2 criadas. Atualize o painel e teste novamente.' as status;

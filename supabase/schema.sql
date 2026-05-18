-- =====================================================
-- GUARDIÕES TEMPLÁRIOS CHECK-IN
-- Estrutura completa do banco Supabase
-- Execute em: Supabase > SQL Editor > New Query
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- TABELA DE EVENTOS
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

-- =====================================================
-- TABELA DE CHECK-INS
-- =====================================================

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
  created_at timestamptz not null default now(),
  constraint check_full_name_min_length check (char_length(trim(full_name)) >= 3),
  constraint check_other_institution_required check (
    is_guardioes = true
    or (
      is_guardioes = false
      and other_institution is not null
      and char_length(trim(other_institution)) >= 2
    )
  )
);

-- =====================================================
-- TABELA DE ADMINISTRADORES
-- =====================================================

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_users_user_id_unique unique (user_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_active on public.events(active);
create index if not exists idx_checkins_event_id on public.checkins(event_id);
create index if not exists idx_checkins_created_at on public.checkins(created_at desc);
create index if not exists idx_checkins_cim on public.checkins(cim);
create index if not exists idx_checkins_grau on public.checkins(grau);
create index if not exists idx_checkins_is_guardioes on public.checkins(is_guardioes);
create index if not exists idx_checkins_city on public.checkins(city);
create index if not exists idx_admin_users_user_id on public.admin_users(user_id);

-- =====================================================
-- EVENTO INICIAL
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
on conflict (slug) do nothing;

-- =====================================================
-- FUNÇÃO PARA VERIFICAR ADMIN
-- =====================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
  );
$$;

-- =====================================================
-- RLS
-- =====================================================

alter table public.events enable row level security;
alter table public.checkins enable row level security;
alter table public.admin_users enable row level security;

-- Remove políticas antigas, se existirem

drop policy if exists "public_view_active_events" on public.events;
drop policy if exists "admins_manage_events" on public.events;

drop policy if exists "public_insert_checkins" on public.checkins;
drop policy if exists "admins_view_checkins" on public.checkins;
drop policy if exists "admins_update_checkins" on public.checkins;
drop policy if exists "admins_delete_checkins" on public.checkins;

drop policy if exists "admins_view_admin_users" on public.admin_users;
drop policy if exists "admins_manage_admin_users" on public.admin_users;

-- EVENTS

create policy "public_view_active_events"
on public.events
for select
to anon, authenticated
using (active = true);

create policy "admins_manage_events"
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- CHECKINS

create policy "public_insert_checkins"
on public.checkins
for insert
to anon, authenticated
with check (true);

create policy "admins_view_checkins"
on public.checkins
for select
to authenticated
using (public.is_admin());

create policy "admins_update_checkins"
on public.checkins
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins_delete_checkins"
on public.checkins
for delete
to authenticated
using (public.is_admin());

-- ADMIN_USERS

create policy "admins_view_admin_users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "admins_manage_admin_users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- VIEWS DE RELATÓRIOS
-- =====================================================

create or replace view public.v_checkins_daily as
select
  date_trunc('day', created_at)::date as period_date,
  count(*) as total_checkins,
  count(*) filter (where is_guardioes = true) as total_guardioes,
  count(*) filter (where is_guardioes = false) as total_visitantes
from public.checkins
group by date_trunc('day', created_at)::date
order by period_date desc;

create or replace view public.v_checkins_monthly as
select
  date_trunc('month', created_at)::date as period_month,
  count(*) as total_checkins,
  count(*) filter (where is_guardioes = true) as total_guardioes,
  count(*) filter (where is_guardioes = false) as total_visitantes
from public.checkins
group by date_trunc('month', created_at)::date
order by period_month desc;

create or replace view public.v_checkins_yearly as
select
  date_trunc('year', created_at)::date as period_year,
  count(*) as total_checkins,
  count(*) filter (where is_guardioes = true) as total_guardioes,
  count(*) filter (where is_guardioes = false) as total_visitantes
from public.checkins
group by date_trunc('year', created_at)::date
order by period_year desc;

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

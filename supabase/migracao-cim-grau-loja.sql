-- =====================================================
-- MIGRAÇÃO: CIM, GRAU E NOME DA LOJA
-- Guardiões Templários 33 N° 4637
-- =====================================================

alter table public.checkins add column if not exists cim text;
alter table public.checkins add column if not exists grau text;

create index if not exists idx_checkins_cim on public.checkins(cim);
create index if not exists idx_checkins_grau on public.checkins(grau);

update public.events
set
  name = 'Check-in Guardiões Templários 33 N° 4637',
  description = 'Controle de presença da Loja Guardiões Templários 33 N° 4637.',
  location = 'Guardiões Templários 33 N° 4637',
  active = true
where slug = 'checkin-diario-templo';

-- Recrie as funções administrativas executando também:
-- supabase/correcao-crypt-login.sql

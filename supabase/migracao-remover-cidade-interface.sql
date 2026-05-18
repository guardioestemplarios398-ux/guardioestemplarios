-- =====================================================
-- AJUSTE: REMOVER CIDADE DA INTERFACE
-- =====================================================
-- O campo cidade foi removido do formulário público, painel e exportação.
-- A coluna city pode permanecer no banco para compatibilidade histórica.
-- Não é necessário apagar a coluna.
select 'Campo cidade removido da interface; banco mantido compatível.' as status;

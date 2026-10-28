-- Migration 003: Adiciona campos de quilometragem de retorno (volta para casa)
-- Execute este script no banco de dados PostgreSQL em produção se necessário
-- O schema.sql já foi atualizado para criar a coluna em novos bancos.

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS quilometragem_retorno NUMERIC DEFAULT 0;

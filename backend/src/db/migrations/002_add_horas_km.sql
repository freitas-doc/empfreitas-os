-- Migration 002: Adiciona campos de horas trabalhadas e quilometragem rodada
-- Execute este script no banco de dados PostgreSQL em produção

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS horas_trabalhadas NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quilometragem_rodada NUMERIC DEFAULT 0;

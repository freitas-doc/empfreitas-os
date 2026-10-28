-- Migration 004: Tabela de Orçamentos
-- Cada orçamento está vinculado a uma OS e nomeado pelo número da OS.

CREATE TABLE IF NOT EXISTS orcamentos (
  id            TEXT PRIMARY KEY,
  ordem_id      TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  numero_orc    TEXT NOT NULL,          -- ex: ORC-2026-167 (baseado no numero_os)
  -- Identificação
  data_emissao  DATE NOT NULL DEFAULT CURRENT_DATE,
  validade_dias INTEGER NOT NULL DEFAULT 15,
  prazo_entrega TEXT NOT NULL DEFAULT '2 dias após aprovação',
  -- Valores
  descricao_servico  TEXT,
  valor_mao_obra     NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_deslocamento NUMERIC(12,2) NOT NULL DEFAULT 0,
  itens_adicionais   JSONB DEFAULT '[]'::JSONB,  -- [{descricao, quantidade, valor_unit}]
  desconto_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  imposto_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  valor_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Condições comerciais
  forma_pagamento    TEXT DEFAULT 'Boleto/Pix',
  garantia           TEXT DEFAULT '90 dias',
  -- Textos técnicos (podem ser editados ou puxados da OS)
  problema_relatado  TEXT,
  solucao_aplicada   TEXT,
  servico_realizado  TEXT,
  observacoes        TEXT,
  -- Controle
  criado_em          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orc_ordem_id ON orcamentos(ordem_id);
CREATE INDEX IF NOT EXISTS idx_orc_numero   ON orcamentos(numero_orc);
CREATE INDEX IF NOT EXISTS idx_orc_criado   ON orcamentos(criado_em);

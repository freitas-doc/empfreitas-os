-- ============================================================
-- SCHEMA SQLite — Sistema de Ordens de Serviço EMPFREITAS
-- ============================================================

-- Tabela principal de Ordens de Serviço (rascunho + finalizada)
CREATE TABLE IF NOT EXISTS ordens_servico (
  id TEXT PRIMARY KEY,                          -- UUID gerado no frontend
  tipo_os TEXT NOT NULL,                        -- 'EMPILHADEIRA' | 'CONTROLADOR'
  tipo_manutencao TEXT NOT NULL,                -- 'CORRETIVA' | 'PREVENTIVA'
  status TEXT NOT NULL DEFAULT 'RASCUNHO',      -- 'RASCUNHO' | 'FINALIZADA'
  numero_os TEXT,                               -- número sequencial/interno
  cliente_nome TEXT,
  cliente_documento TEXT,
  cliente_endereco TEXT,
  equipamento_modelo TEXT,
  equipamento_serie TEXT,
  equipamento_horimetro TEXT,
  tecnico_nome TEXT,
  descricao_problema TEXT,
  servico_executado TEXT,
  observacoes TEXT,
  data_abertura TEXT,
  data_fechamento TEXT,
  dados_formulario_json TEXT,                   -- snapshot completo do form (autosave)
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

-- Índices para a tela de histórico
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_tipo ON ordens_servico(tipo_os);
CREATE INDEX IF NOT EXISTS idx_os_criado ON ordens_servico(criado_em);

-- Peças trocadas (1:N)
CREATE TABLE IF NOT EXISTS pecas_trocadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  nome_peca TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_pecas_os_id ON pecas_trocadas(ordem_servico_id);

-- Fotos (1:N) — guardamos referência/base64 comprimido
CREATE TABLE IF NOT EXISTS fotos_os (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,                      -- 'ANTES' | 'DEPOIS' | 'PECA' | 'OUTRO'
  imagem_base64 TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fotos_os_id ON fotos_os(ordem_servico_id);

-- Assinaturas (1:N — máx. 2 por OS: cliente e técnico)
CREATE TABLE IF NOT EXISTS assinaturas_os (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,                           -- 'CLIENTE' | 'TECNICO'
  assinatura_base64 TEXT NOT NULL,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_os_id ON assinaturas_os(ordem_servico_id);

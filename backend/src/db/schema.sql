-- ============================================================
-- SCHEMA PostgreSQL — Sistema de Ordens de Serviço EMPFREITAS
-- ============================================================

-- Tabela principal de Ordens de Serviço (rascunho + finalizada)
CREATE TABLE IF NOT EXISTS ordens_servico (
  id TEXT PRIMARY KEY,                          
  tipo_os TEXT NOT NULL,                        
  tipo_manutencao TEXT NOT NULL,                
  status TEXT NOT NULL DEFAULT 'RASCUNHO',      
  numero_os TEXT,                               
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
  dados_formulario_json TEXT,                   
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tela de histórico
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_tipo ON ordens_servico(tipo_os);
CREATE INDEX IF NOT EXISTS idx_os_criado ON ordens_servico(criado_em);

-- Peças trocadas (1:N)
CREATE TABLE IF NOT EXISTS pecas_trocadas (
  id SERIAL PRIMARY KEY,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  nome_peca TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_pecas_os_id ON pecas_trocadas(ordem_servico_id);

-- Fotos (1:N) — guardamos referência/base64 comprimido
CREATE TABLE IF NOT EXISTS fotos_os (
  id SERIAL PRIMARY KEY,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,                      
  imagem_base64 TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fotos_os_id ON fotos_os(ordem_servico_id);

-- Assinaturas (1:N — máx. 2 por OS: cliente e técnico)
CREATE TABLE IF NOT EXISTS assinaturas_os (
  id SERIAL PRIMARY KEY,
  ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,                           
  assinatura_base64 TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_os_id ON assinaturas_os(ordem_servico_id);

-- Usuários para Autenticação
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,                           
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

const db = require('../db/database');

// ──────────────────────────────────────────────
// LISTAR todas as OS (com filtros opcionais)
// ──────────────────────────────────────────────
function listarOrdens({ status, tipo_os, tipo_manutencao, limit = 50, offset = 0 } = {}) {
  let sql = `SELECT * FROM ordens_servico WHERE 1=1`;
  const params = [];

  if (status) { sql += ` AND status = ?`; params.push(status); }
  if (tipo_os) { sql += ` AND tipo_os = ?`; params.push(tipo_os); }
  if (tipo_manutencao) { sql += ` AND tipo_manutencao = ?`; params.push(tipo_manutencao); }

  sql += ` ORDER BY atualizado_em DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  return db.all(sql, params);
}

// ──────────────────────────────────────────────
// BUSCAR uma OS por ID (com peças, fotos e assinaturas)
// ──────────────────────────────────────────────
function buscarOrdemPorId(id) {
  const ordem = db.get(`SELECT * FROM ordens_servico WHERE id = ?`, [id]);
  if (!ordem) return null;

  ordem.pecas = db.all(`SELECT * FROM pecas_trocadas WHERE ordem_servico_id = ?`, [id]);
  ordem.fotos = db.all(`SELECT id, categoria, criado_em FROM fotos_os WHERE ordem_servico_id = ?`, [id]);
  ordem.assinaturas = db.all(`SELECT id, tipo, criado_em FROM assinaturas_os WHERE ordem_servico_id = ?`, [id]);

  return ordem;
}

// ──────────────────────────────────────────────
// CRIAR OS (rascunho)
// ──────────────────────────────────────────────
function criarOrdem(dados) {
  const {
    id, tipo_os, tipo_manutencao, numero_os,
    cliente_nome, cliente_documento, cliente_endereco,
    equipamento_modelo, equipamento_serie, equipamento_horimetro,
    tecnico_nome, descricao_problema, servico_executado, observacoes,
    data_abertura, dados_formulario_json
  } = dados;

  db.run(`
    INSERT INTO ordens_servico (
      id, tipo_os, tipo_manutencao, status, numero_os,
      cliente_nome, cliente_documento, cliente_endereco,
      equipamento_modelo, equipamento_serie, equipamento_horimetro,
      tecnico_nome, descricao_problema, servico_executado, observacoes,
      data_abertura, dados_formulario_json
    ) VALUES (
      ?, ?, ?, 'RASCUNHO', ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `, [
    id, tipo_os, tipo_manutencao, numero_os || null,
    cliente_nome || null, cliente_documento || null, cliente_endereco || null,
    equipamento_modelo || null, equipamento_serie || null, equipamento_horimetro || null,
    tecnico_nome || null, descricao_problema || null, servico_executado || null, observacoes || null,
    data_abertura || new Date().toISOString(), dados_formulario_json || null
  ]);

  return buscarOrdemPorId(id);
}

// ──────────────────────────────────────────────
// ATUALIZAR OS (autosave)
// ──────────────────────────────────────────────
function atualizarOrdem(id, dados) {
  const campos = [
    'numero_os', 'cliente_nome', 'cliente_documento', 'cliente_endereco',
    'equipamento_modelo', 'equipamento_serie', 'equipamento_horimetro',
    'tecnico_nome', 'descricao_problema', 'servico_executado', 'observacoes',
    'dados_formulario_json'
  ];

  const definidos = campos.filter(c => dados[c] !== undefined);
  if (!definidos.length) return buscarOrdemPorId(id);

  const setClauses = definidos.map(c => `${c} = ?`).join(', ');
  const values = definidos.map(c => dados[c]);

  db.run(
    `UPDATE ordens_servico SET ${setClauses}, atualizado_em = datetime('now') WHERE id = ?`,
    [...values, id]
  );

  return buscarOrdemPorId(id);
}

// ──────────────────────────────────────────────
// FINALIZAR OS
// ──────────────────────────────────────────────
function finalizarOrdem(id) {
  const existe = db.get(`SELECT id FROM ordens_servico WHERE id = ?`, [id]);
  if (!existe) return null;

  db.run(
    `UPDATE ordens_servico SET status = 'FINALIZADA', data_fechamento = datetime('now'), atualizado_em = datetime('now') WHERE id = ?`,
    [id]
  );

  return buscarOrdemPorId(id);
}

// ──────────────────────────────────────────────
// DELETAR OS (apenas rascunhos)
// ──────────────────────────────────────────────
function deletarOrdem(id) {
  const antes = db.get(`SELECT id FROM ordens_servico WHERE id = ? AND status = 'RASCUNHO'`, [id]);
  if (!antes) return false;

  db.run(`DELETE FROM ordens_servico WHERE id = ? AND status = 'RASCUNHO'`, [id]);
  return true;
}

module.exports = {
  listarOrdens,
  buscarOrdemPorId,
  criarOrdem,
  atualizarOrdem,
  finalizarOrdem,
  deletarOrdem
};

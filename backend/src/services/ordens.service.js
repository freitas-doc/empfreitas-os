const db = require('../db/database');

// ──────────────────────────────────────────────
// LISTAR todas as OS (com filtros opcionais)
// ──────────────────────────────────────────────
async function listarOrdens({ status, tipo_os, tipo_manutencao, tecnico_nome, limit = 50, offset = 0 } = {}) {
  let sql = `SELECT * FROM ordens_servico WHERE 1=1`;
  const params = [];
  let paramIdx = 1;

  if (status)        { sql += ` AND status = $${paramIdx++}`;         params.push(status); }
  if (tipo_os)       { sql += ` AND tipo_os = $${paramIdx++}`;        params.push(tipo_os); }
  if (tipo_manutencao) { sql += ` AND tipo_manutencao = $${paramIdx++}`; params.push(tipo_manutencao); }
  if (tecnico_nome)  { sql += ` AND tecnico_nome = $${paramIdx++}`;   params.push(tecnico_nome); }

  sql += ` ORDER BY atualizado_em DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(Number(limit), Number(offset));

  return db.all(sql, params);
}

// ──────────────────────────────────────────────
// BUSCAR uma OS por ID (com peças, fotos e assinaturas)
// ──────────────────────────────────────────────
async function buscarOrdemPorId(id) {
  const ordem = await db.get(`SELECT * FROM ordens_servico WHERE id = $1`, [id]);
  if (!ordem) return null;

  ordem.pecas = await db.all(`SELECT * FROM pecas_trocadas WHERE ordem_servico_id = $1`, [id]);
  ordem.fotos = await db.all(`SELECT id, categoria, criado_em FROM fotos_os WHERE ordem_servico_id = $1`, [id]);
  ordem.assinaturas = await db.all(`SELECT id, tipo, criado_em FROM assinaturas_os WHERE ordem_servico_id = $1`, [id]);

  return ordem;
}

// ──────────────────────────────────────────────
// CRIAR OS (rascunho)
// ──────────────────────────────────────────────
async function criarOrdem(dados) {
  const {
    id, tipo_os, tipo_manutencao, numero_os,
    cliente_nome, cliente_documento, cliente_endereco,
    equipamento_modelo, equipamento_serie, equipamento_horimetro,
    tecnico_nome, descricao_problema, servico_executado, observacoes,
    data_abertura, dados_formulario_json
  } = dados;

  await db.run(`
    INSERT INTO ordens_servico (
      id, tipo_os, tipo_manutencao, status, numero_os,
      cliente_nome, cliente_documento, cliente_endereco,
      equipamento_modelo, equipamento_serie, equipamento_horimetro,
      tecnico_nome, descricao_problema, servico_executado, observacoes,
      data_abertura, dados_formulario_json
    ) VALUES (
      $1, $2, $3, 'RASCUNHO', $4,
      $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16
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
async function atualizarOrdem(id, dados) {
  const campos = [
    'numero_os', 'cliente_nome', 'cliente_documento', 'cliente_endereco',
    'equipamento_modelo', 'equipamento_serie', 'equipamento_horimetro',
    'tecnico_nome', 'descricao_problema', 'servico_executado', 'observacoes',
    'dados_formulario_json'
  ];

  const definidos = campos.filter(c => dados[c] !== undefined);
  if (!definidos.length) return buscarOrdemPorId(id);

  // Monta o SET com $1, $2, ... para o PostgreSQL
  const setClauses = definidos.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = definidos.map(c => dados[c]);
  const idParamIdx = values.length + 1;

  await db.run(
    `UPDATE ordens_servico SET ${setClauses}, atualizado_em = CURRENT_TIMESTAMP WHERE id = $${idParamIdx}`,
    [...values, id]
  );

  return buscarOrdemPorId(id);
}

// ──────────────────────────────────────────────
// FINALIZAR OS
// ──────────────────────────────────────────────
async function finalizarOrdem(id) {
  const existe = await db.get(`SELECT id FROM ordens_servico WHERE id = $1`, [id]);
  if (!existe) return null;

  await db.run(
    `UPDATE ordens_servico SET status = 'FINALIZADA', data_fechamento = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1`,
    [id]
  );

  return buscarOrdemPorId(id);
}

// ──────────────────────────────────────────────
// DELETAR OS (apenas rascunhos)
// ──────────────────────────────────────────────
async function deletarOrdem(id) {
  const antes = await db.get(`SELECT id FROM ordens_servico WHERE id = $1 AND status = 'RASCUNHO'`, [id]);
  if (!antes) return false;

  await db.run(`DELETE FROM ordens_servico WHERE id = $1 AND status = 'RASCUNHO'`, [id]);
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

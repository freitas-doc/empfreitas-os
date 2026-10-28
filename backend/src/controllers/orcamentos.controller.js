const { all, get, run } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// ── Helpers ────────────────────────────────────────────────────────────────
function calcTotal(maoObra, deslocamento, itens, descontoPct, impostoPct) {
  const subtotal = parseFloat(maoObra || 0)
    + parseFloat(deslocamento || 0)
    + (itens || []).reduce((s, i) => s + (parseFloat(i.quantidade || 1) * parseFloat(i.valor_unit || 0)), 0);
  const desconto = subtotal * (parseFloat(descontoPct || 0) / 100);
  const base = subtotal - desconto;
  const imposto = base * (parseFloat(impostoPct || 0) / 100);
  return parseFloat((base + imposto).toFixed(2));
}

// ── GET /api/admin/orcamentos ──────────────────────────────────────────────
const listarOrcamentos = async (req, res) => {
  try {
    const rows = await all(`
      SELECT o.id, o.numero_orc, o.data_emissao, o.validade_dias,
             o.valor_total, o.forma_pagamento, o.garantia, o.criado_em,
             os.numero_os, os.cliente_nome, os.equipamento_modelo,
             os.tipo_manutencao
      FROM orcamentos o
      JOIN ordens_servico os ON os.id = o.ordem_id
      ORDER BY o.criado_em DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[orcamentos] listar:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar orçamentos' });
  }
};

// ── GET /api/admin/orcamentos/:id ──────────────────────────────────────────
const buscarOrcamento = async (req, res) => {
  try {
    const row = await get(`
      SELECT o.*, os.numero_os, os.cliente_nome, os.cliente_documento,
             os.cliente_endereco, os.equipamento_modelo, os.equipamento_serie,
             os.tipo_manutencao, os.descricao_problema, os.servico_executado, os.observacoes
      FROM orcamentos o
      JOIN ordens_servico os ON os.id = o.ordem_id
      WHERE o.id = $1
    `, [req.params.id]);

    if (!row) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[orcamentos] buscar:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar orçamento' });
  }
};

// ── POST /api/admin/orcamentos ─────────────────────────────────────────────
const criarOrcamento = async (req, res) => {
  try {
    const {
      ordem_id, data_emissao, validade_dias, prazo_entrega,
      descricao_servico, valor_mao_obra, valor_deslocamento,
      itens_adicionais, desconto_pct, imposto_pct,
      forma_pagamento, garantia,
      problema_relatado, solucao_aplicada, servico_realizado, observacoes
    } = req.body;

    if (!ordem_id) return res.status(400).json({ success: false, message: 'ordem_id é obrigatório' });

    // Busca a OS para montar o número do orçamento
    const os = await get('SELECT numero_os FROM ordens_servico WHERE id = $1', [ordem_id]);
    if (!os) return res.status(404).json({ success: false, message: 'OS não encontrada' });

    const id       = uuidv4();
    const numOs    = os.numero_os || ordem_id.slice(0, 8);
    const numeroOrc = `ORC-${numOs}`;
    const itens     = itens_adicionais || [];
    const total     = calcTotal(valor_mao_obra, valor_deslocamento, itens, desconto_pct, imposto_pct);

    await run(`
      INSERT INTO orcamentos (
        id, ordem_id, numero_orc, data_emissao, validade_dias, prazo_entrega,
        descricao_servico, valor_mao_obra, valor_deslocamento, itens_adicionais,
        desconto_pct, imposto_pct, valor_total,
        forma_pagamento, garantia,
        problema_relatado, solucao_aplicada, servico_realizado, observacoes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
    `, [
      id, ordem_id, numeroOrc,
      data_emissao || new Date().toISOString().slice(0, 10),
      validade_dias || 15,
      prazo_entrega || '2 dias após aprovação',
      descricao_servico || '',
      parseFloat(valor_mao_obra || 0),
      parseFloat(valor_deslocamento || 0),
      JSON.stringify(itens),
      parseFloat(desconto_pct || 0),
      parseFloat(imposto_pct || 0),
      total,
      forma_pagamento || 'Boleto/Pix',
      garantia || '90 dias',
      problema_relatado || '',
      solucao_aplicada || '',
      servico_realizado || '',
      observacoes || ''
    ]);

    const criado = await get('SELECT * FROM orcamentos WHERE id = $1', [id]);
    res.status(201).json({ success: true, data: criado });
  } catch (err) {
    console.error('[orcamentos] criar:', err);
    res.status(500).json({ success: false, error: 'Erro ao criar orçamento' });
  }
};

// ── PUT /api/admin/orcamentos/:id ──────────────────────────────────────────
const atualizarOrcamento = async (req, res) => {
  try {
    const { id } = req.params;
    const orc = await get('SELECT id FROM orcamentos WHERE id = $1', [id]);
    if (!orc) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });

    const {
      data_emissao, validade_dias, prazo_entrega,
      descricao_servico, valor_mao_obra, valor_deslocamento,
      itens_adicionais, desconto_pct, imposto_pct,
      forma_pagamento, garantia,
      problema_relatado, solucao_aplicada, servico_realizado, observacoes
    } = req.body;

    const itens = itens_adicionais || [];
    const total = calcTotal(valor_mao_obra, valor_deslocamento, itens, desconto_pct, imposto_pct);

    await run(`
      UPDATE orcamentos SET
        data_emissao=$1, validade_dias=$2, prazo_entrega=$3,
        descricao_servico=$4, valor_mao_obra=$5, valor_deslocamento=$6,
        itens_adicionais=$7, desconto_pct=$8, imposto_pct=$9, valor_total=$10,
        forma_pagamento=$11, garantia=$12,
        problema_relatado=$13, solucao_aplicada=$14, servico_realizado=$15, observacoes=$16,
        atualizado_em=CURRENT_TIMESTAMP
      WHERE id=$17
    `, [
      data_emissao, validade_dias || 15, prazo_entrega || '2 dias após aprovação',
      descricao_servico || '',
      parseFloat(valor_mao_obra || 0), parseFloat(valor_deslocamento || 0),
      JSON.stringify(itens),
      parseFloat(desconto_pct || 0), parseFloat(imposto_pct || 0), total,
      forma_pagamento || 'Boleto/Pix', garantia || '90 dias',
      problema_relatado || '', solucao_aplicada || '', servico_realizado || '', observacoes || '',
      id
    ]);

    const atualizado = await get('SELECT * FROM orcamentos WHERE id = $1', [id]);
    res.json({ success: true, data: atualizado });
  } catch (err) {
    console.error('[orcamentos] atualizar:', err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar orçamento' });
  }
};

// ── DELETE /api/admin/orcamentos/:id ──────────────────────────────────────
const deletarOrcamento = async (req, res) => {
  try {
    const { id } = req.params;
    const orc = await get('SELECT id FROM orcamentos WHERE id = $1', [id]);
    if (!orc) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });

    await run('DELETE FROM orcamentos WHERE id = $1', [id]);
    res.json({ success: true, message: 'Orçamento excluído com sucesso' });
  } catch (err) {
    console.error('[orcamentos] deletar:', err);
    res.status(500).json({ success: false, error: 'Erro ao deletar orçamento' });
  }
};

module.exports = { listarOrcamentos, buscarOrcamento, criarOrcamento, atualizarOrcamento, deletarOrcamento };

const { v4: uuidv4 } = require('uuid');
const ordensService = require('../services/ordens.service');

// GET /api/ordens
function listar(req, res, next) {
  try {
    const { status, tipo_os, tipo_manutencao, limit, offset } = req.query;
    const ordens = ordensService.listarOrdens({ status, tipo_os, tipo_manutencao, limit, offset });
    res.json({ success: true, data: ordens, total: ordens.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/ordens/:id
function buscarPorId(req, res, next) {
  try {
    const ordem = ordensService.buscarOrdemPorId(req.params.id);
    if (!ordem) return res.status(404).json({ success: false, message: 'OS não encontrada.' });
    res.json({ success: true, data: ordem });
  } catch (err) {
    next(err);
  }
}

// POST /api/ordens
function criar(req, res, next) {
  try {
    const { tipo_os, tipo_manutencao } = req.body;

    if (!tipo_os || !['EMPILHADEIRA', 'CONTROLADOR'].includes(tipo_os)) {
      return res.status(400).json({ success: false, message: 'tipo_os inválido. Use EMPILHADEIRA ou CONTROLADOR.' });
    }
    if (!tipo_manutencao || !['CORRETIVA', 'PREVENTIVA'].includes(tipo_manutencao)) {
      return res.status(400).json({ success: false, message: 'tipo_manutencao inválido. Use CORRETIVA ou PREVENTIVA.' });
    }

    const id = req.body.id || uuidv4();
    const ordem = ordensService.criarOrdem({ ...req.body, id });
    res.status(201).json({ success: true, data: ordem });
  } catch (err) {
    next(err);
  }
}

// PUT /api/ordens/:id
function atualizar(req, res, next) {
  try {
    const ordemExistente = ordensService.buscarOrdemPorId(req.params.id);
    if (!ordemExistente) return res.status(404).json({ success: false, message: 'OS não encontrada.' });

    const ordem = ordensService.atualizarOrdem(req.params.id, req.body);
    res.json({ success: true, data: ordem });
  } catch (err) {
    next(err);
  }
}

// POST /api/ordens/:id/finalizar
function finalizar(req, res, next) {
  try {
    const ordem = ordensService.finalizarOrdem(req.params.id);
    if (!ordem) return res.status(404).json({ success: false, message: 'OS não encontrada.' });
    res.json({ success: true, data: ordem });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/ordens/:id
function deletar(req, res, next) {
  try {
    const removido = ordensService.deletarOrdem(req.params.id);
    if (!removido) {
      return res.status(404).json({
        success: false,
        message: 'OS não encontrada ou não pode ser removida (apenas rascunhos podem ser deletados).'
      });
    }
    res.json({ success: true, message: 'Rascunho removido com sucesso.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, finalizar, deletar };

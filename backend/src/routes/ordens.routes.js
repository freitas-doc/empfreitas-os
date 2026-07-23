const { Router } = require('express');
const ctrl = require('../controllers/ordens.controller');

const router = Router();

// CRUD principal
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

// Ações especiais
router.post('/:id/finalizar', ctrl.finalizar);

module.exports = router;

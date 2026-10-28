const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const orcamentosController = require('../controllers/orcamentos.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

// Todas as rotas de admin precisam de autenticação e papel 'admin'
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/graficos', adminController.getGraficos);
router.get('/ordens', adminController.getOrdens);
router.delete('/ordens/:id', adminController.deletarOS);

router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.criarUsuario);
router.delete('/usuarios/:id', adminController.deletarUsuario);

// ── Orçamentos ────────────────────────────────────────────────────────────
router.get('/orcamentos',     orcamentosController.listarOrcamentos);
router.get('/orcamentos/:id', orcamentosController.buscarOrcamento);
router.post('/orcamentos',    orcamentosController.criarOrcamento);
router.put('/orcamentos/:id', orcamentosController.atualizarOrcamento);
router.delete('/orcamentos/:id', orcamentosController.deletarOrcamento);

module.exports = router;

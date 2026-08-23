const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

// Todas as rotas de admin precisam de autenticação e papel 'admin'
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/ordens', adminController.getOrdens);
router.delete('/ordens/:id', adminController.deletarOS);

router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.criarUsuario);
router.delete('/usuarios/:id', adminController.deletarUsuario);

module.exports = router;

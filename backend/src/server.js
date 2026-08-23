require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const ordensRoutes = require('./routes/ordens.routes');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globais ──────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // Em prod aceita qualquer origem (controlada pelo próprio auth)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Rotas ────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ordens', ordensRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Tratamento de erros centralizado
app.use(errorHandler);

// ── Inicialização (apenas local) ───
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n🔧 EMPFREITAS OS Backend rodando em http://localhost:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health`);
        console.log(`   Ordens:       http://localhost:${PORT}/api/ordens\n`);
      });
    })
    .catch(err => {
      console.error('[FATAL] Falha ao inicializar o banco de dados:', err);
    });
}

module.exports = app;

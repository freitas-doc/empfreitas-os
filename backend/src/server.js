require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const ordensRoutes = require('./routes/ordens.routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globais ──────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Rotas ────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/ordens', ordensRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Tratamento de erros centralizado
app.use(errorHandler);

// ── Inicialização assíncrona (sql.js precisa de await) ───
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`\n🔧 EMPFREITAS OS Backend rodando em http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Ordens:       http://localhost:${PORT}/api/ordens\n`);
    });
  } catch (err) {
    console.error('[FATAL] Falha ao inicializar o banco de dados:', err);
    process.exit(1);
  }
}

start();
module.exports = app;

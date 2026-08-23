// api/index.js — Ponto de entrada para a Vercel Serverless Function
// Inicializa o DB antes de processar qualquer requisição
const { initDb } = require('../backend/src/db/database');
const app = require('../backend/src/server.js');

let dbReady = false;

module.exports = async (req, res) => {
  // Inicializa o banco apenas uma vez por instância serverless
  if (!dbReady) {
    try {
      await initDb();
      dbReady = true;
    } catch (err) {
      console.error('[Serverless] Falha ao inicializar DB:', err);
      // Não bloqueia — o pg.Pool tenta conectar lazy por si só
    }
  }
  return app(req, res);
};

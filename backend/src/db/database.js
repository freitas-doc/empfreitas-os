const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Se POSTGRES_URL não existir, vai usar os dados padrões locais ou dar erro de conexão
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/empfreitas',
  ssl: process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false // SSL obrigatório no Vercel
});

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function initDb() {
  try {
    const client = await pool.connect();
    
    // Executa o schema para criar as tabelas se não existirem
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    await client.query(schema);
    
    client.release();
    console.log('[DB] Conectado ao PostgreSQL com sucesso.');
  } catch (error) {
    console.error('[DB] Erro ao conectar no PostgreSQL:', error);
    throw error;
  }
}

// Helper genérico para queries
async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

// Helpers para simular a sintaxe antiga do SQLite (db.get, db.all, db.run)
// Para o PostgreSQL, usamos `$1, $2` em vez de `?` na string SQL.

async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

async function run(sql, params = []) {
  await query(sql, params);
}

module.exports = { initDb, query, get, all, run, pool };

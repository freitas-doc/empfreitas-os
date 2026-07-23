const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../data/empfreitas.db');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Garante que o diretório data/ existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

// sql.js é assíncrono na inicialização — exportamos uma Promise que resolve com o db
async function initDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Carrega banco existente ou cria novo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log(`[DB] SQLite carregado de: ${DB_PATH}`);
  } else {
    db = new SQL.Database();
    console.log(`[DB] Novo banco SQLite criado em: ${DB_PATH}`);
  }

  // Executa o schema (CREATE TABLE IF NOT EXISTS — idempotente)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);

  // Persiste no disco a cada operação de escrita
  _persistDb();

  return db;
}

// Persiste o banco em disco
function _persistDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Wrapper síncrono para execução de queries — persiste após writes
function run(sql, params = []) {
  db.run(sql, params);
  _persistDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { initDb, run, get, all, persistDb: _persistDb };

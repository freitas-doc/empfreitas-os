const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Lê a POSTGRES_URL do environment
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('Iniciando seed de usuários no PostgreSQL...');

  const client = await pool.connect();

  try {
    // Garante que a tabela existe antes de tudo
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin
    const adminRes = await client.query('SELECT id FROM usuarios WHERE username = $1', ['admin']);
    if (adminRes.rows.length === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO usuarios (id, username, password_hash, role) VALUES ($1, $2, $3, $4)',
        [uuidv4(), 'admin', adminHash, 'admin']
      );
      console.log('✅ Usuário admin criado (username: admin, password: admin123)');
    } else {
      console.log('ℹ️  Usuário admin já existe.');
    }

    // Técnico
    const tecnicoRes = await client.query('SELECT id FROM usuarios WHERE username = $1', ['tecnico']);
    if (tecnicoRes.rows.length === 0) {
      const tecnicoHash = await bcrypt.hash('tecnico123', 10);
      await client.query(
        'INSERT INTO usuarios (id, username, password_hash, role) VALUES ($1, $2, $3, $4)',
        [uuidv4(), 'tecnico', tecnicoHash, 'tecnico']
      );
      console.log('✅ Usuário tecnico criado (username: tecnico, password: tecnico123)');
    } else {
      console.log('ℹ️  Usuário tecnico já existe.');
    }

    console.log('\n🎉 Seed de usuários finalizado com sucesso!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Erro no seed de usuários:', err);
  process.exit(1);
});

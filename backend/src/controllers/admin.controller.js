const { all, get, run } = require('../db/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const getStats = async (req, res) => {
  try {
    // Total de OS por técnico
    const osPorTecnico = await all(`
      SELECT tecnico_nome as tecnico, COUNT(*) as total 
      FROM ordens_servico 
      GROUP BY tecnico_nome
      ORDER BY total DESC
    `);

    // Total de OS por cliente
    const osPorCliente = await all(`
      SELECT cliente_nome as cliente, COUNT(*) as total 
      FROM ordens_servico 
      GROUP BY cliente_nome
      ORDER BY total DESC
    `);

    // Total geral
    const totalGeralResult = await get('SELECT COUNT(*) as total FROM ordens_servico');
    const totalGeral = totalGeralResult ? parseInt(totalGeralResult.total, 10) : 0;

    res.json({
      success: true,
      data: {
        totalGeral,
        osPorTecnico,
        osPorCliente
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do admin:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

const getOrdens = async (req, res) => {
  try {
    const ordens = await all(`
      SELECT 
        id, 
        tipo_os, 
        tipo_manutencao, 
        status, 
        numero_os, 
        cliente_nome, 
        tecnico_nome, 
        data_abertura, 
        criado_em 
      FROM ordens_servico 
      ORDER BY criado_em DESC
    `);
    
    res.json({ success: true, data: ordens });
  } catch (error) {
    console.error('Erro ao buscar ordens para o admin:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

const deletarOS = async (req, res) => {
  try {
    const { id } = req.params;
    const os = await get('SELECT id FROM ordens_servico WHERE id = $1', [id]);
    if (!os) {
      return res.status(404).json({ success: false, message: 'OS não encontrada.' });
    }

    await run('DELETE FROM ordens_servico WHERE id = $1', [id]);
    res.json({ success: true, message: 'OS deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar OS pelo admin:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await all('SELECT id, username, role, criado_em FROM usuarios ORDER BY criado_em DESC');
    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

const criarUsuario = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
    }

    const existe = await get('SELECT id FROM usuarios WHERE username = $1', [username]);
    if (existe) {
      return res.status(400).json({ success: false, message: 'Username já existe' });
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    
    await run(
      'INSERT INTO usuarios (id, username, password_hash, role) VALUES ($1, $2, $3, $4)',
      [id, username, hash, role]
    );

    res.json({ success: true, message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await get('SELECT id, role FROM usuarios WHERE id = $1', [id]);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // Opcional: Impedir que o admin delete a si mesmo, mas pra simplificar vamos apenas deletar
    await run('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ success: true, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

module.exports = {
  getStats,
  getOrdens,
  deletarOS,
  listarUsuarios,
  criarUsuario,
  deletarUsuario
};

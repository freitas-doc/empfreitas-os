const { all, get, run } = require('../db/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ──────────────────────────────────────────────
// GET /api/admin/stats?mes=&ano=
// ──────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const { mes, ano } = req.query;

    // Monta filtro de período (opcional)
    let filtroData = '';
    const params = [];
    if (mes && ano) {
      filtroData = `WHERE EXTRACT(MONTH FROM criado_em) = $1 AND EXTRACT(YEAR FROM criado_em) = $2`;
      params.push(parseInt(mes, 10), parseInt(ano, 10));
    } else if (ano) {
      filtroData = `WHERE EXTRACT(YEAR FROM criado_em) = $1`;
      params.push(parseInt(ano, 10));
    }

    // Total de OS por técnico (com somatório de horas e km)
    const osPorTecnico = await all(`
      SELECT 
        tecnico_nome                    AS tecnico,
        COUNT(*)                        AS total,
        COALESCE(SUM(horas_trabalhadas), 0)   AS total_horas,
        COALESCE(SUM(quilometragem_rodada), 0) AS total_km
      FROM ordens_servico
      ${filtroData}
      GROUP BY tecnico_nome
      ORDER BY total DESC
    `, params);

    // Total de OS por cliente
    const osPorCliente = await all(`
      SELECT cliente_nome AS cliente, COUNT(*) AS total 
      FROM ordens_servico 
      ${filtroData}
      GROUP BY cliente_nome
      ORDER BY total DESC
    `, params);

    // Total geral
    const totalGeralResult = await get(
      `SELECT COUNT(*) as total FROM ordens_servico ${filtroData}`,
      params
    );
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

// ──────────────────────────────────────────────
// GET /api/admin/graficos?mes=&ano=
// Retorna dados agrupados por mês para os gráficos
// ──────────────────────────────────────────────
const getGraficos = async (req, res) => {
  try {
    const { mes, ano } = req.query;

    // --- Gráfico 1: OS por período (últimos 12 meses ou filtro de ano específico)
    let sqlPeriodo, paramsPeriodo = [];
    if (mes && ano) {
      // Semana a semana dentro do mês selecionado
      sqlPeriodo = `
        SELECT
          EXTRACT(WEEK FROM criado_em)::INT AS semana,
          TO_CHAR(MIN(criado_em), 'DD/MM')  AS label,
          COUNT(*)                           AS total_os,
          COALESCE(SUM(horas_trabalhadas), 0)    AS total_horas,
          COALESCE(SUM(quilometragem_rodada), 0)  AS total_km
        FROM ordens_servico
        WHERE EXTRACT(MONTH FROM criado_em) = $1
          AND EXTRACT(YEAR  FROM criado_em) = $2
        GROUP BY EXTRACT(WEEK FROM criado_em)
        ORDER BY semana
      `;
      paramsPeriodo = [parseInt(mes, 10), parseInt(ano, 10)];
    } else {
      // Mês a mês dentro do ano selecionado (padrão = ano corrente)
      const anoFiltro = ano ? parseInt(ano, 10) : new Date().getFullYear();
      sqlPeriodo = `
        SELECT
          EXTRACT(MONTH FROM criado_em)::INT              AS mes_num,
          TO_CHAR(MIN(criado_em), 'Mon/YYYY')             AS label,
          COUNT(*)                                         AS total_os,
          COALESCE(SUM(horas_trabalhadas), 0)             AS total_horas,
          COALESCE(SUM(quilometragem_rodada), 0)           AS total_km
        FROM ordens_servico
        WHERE EXTRACT(YEAR FROM criado_em) = $1
        GROUP BY EXTRACT(MONTH FROM criado_em)
        ORDER BY mes_num
      `;
      paramsPeriodo = [anoFiltro];
    }

    const dadosPeriodo = await all(sqlPeriodo, paramsPeriodo);

    // --- Gráfico 2: Horas e KM por técnico (com filtro de período)
    let filtroData = '', paramsTecnico = [];
    if (mes && ano) {
      filtroData = `WHERE EXTRACT(MONTH FROM criado_em) = $1 AND EXTRACT(YEAR FROM criado_em) = $2`;
      paramsTecnico = [parseInt(mes, 10), parseInt(ano, 10)];
    } else if (ano) {
      filtroData = `WHERE EXTRACT(YEAR FROM criado_em) = $1`;
      paramsTecnico = [parseInt(ano, 10)];
    }

    const horasKmPorTecnico = await all(`
      SELECT
        COALESCE(tecnico_nome, 'Não informado') AS tecnico,
        COUNT(*)                                  AS total_os,
        COALESCE(SUM(horas_trabalhadas), 0)       AS total_horas,
        COALESCE(SUM(quilometragem_rodada), 0)    AS total_km
      FROM ordens_servico
      ${filtroData}
      GROUP BY tecnico_nome
      ORDER BY total_horas DESC
    `, paramsTecnico);

    res.json({
      success: true,
      data: {
        dadosPeriodo,
        horasKmPorTecnico
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados de gráficos:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

// ──────────────────────────────────────────────
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
        horas_trabalhadas,
        quilometragem_rodada,
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

    await run('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ success: true, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

module.exports = {
  getStats,
  getGraficos,
  getOrdens,
  deletarOS,
  listarUsuarios,
  criarUsuario,
  deletarUsuario
};

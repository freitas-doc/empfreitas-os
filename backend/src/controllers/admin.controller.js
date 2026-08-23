const { all, get } = require('../db/database');

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

module.exports = {
  getStats,
  getOrdens
};

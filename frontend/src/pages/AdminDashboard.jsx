import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { gerarPdfOS } from '../services/pdfGenerator';
import AdminOrcamentos from './AdminOrcamentos.jsx';

// ─── Helpers ───────────────────────────────────────────────────────────────
const MESES = [
  { value: '', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },   { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const anoAtual = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => anoAtual - i);

function formatarHoras(horas) {
  const h = Math.floor(Number(horas) || 0);
  const m = Math.round(((Number(horas) || 0) - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ─── Tooltip customizado ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: '0.82rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--color-text)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Cores ────────────────────────────────────────────────────────────────
const COLORS = {
  os:    '#f59e0b',
  horas: '#10b981',
  km:    '#6366f1',
};

// ─── Estilos base ─────────────────────────────────────────────────────────
const styles = {
  navbar: {
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  container: { maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--shadow-card)'
  },
  cardTitle: {
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text-dim)',
    marginBottom: '12px',
    fontWeight: 700
  },
  statNumber: {
    fontSize: '3rem',
    fontWeight: 800,
    color: 'var(--color-accent)',
    textShadow: 'var(--shadow-glow)',
    textAlign: 'center',
    lineHeight: 1.1
  },
  list: { listStyle: 'none', padding: 0, margin: 0, maxHeight: '180px', overflowY: 'auto' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' },
  badge: { background: 'var(--color-surface-3)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 },
  filterBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '28px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
  },
  select: {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    padding: '8px 12px',
    fontSize: '0.88rem',
    cursor: 'pointer',
    outline: 'none',
  },
  chartCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--shadow-card)',
    marginBottom: '24px'
  },
  chartTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '4px'
  },
  chartSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--color-text-dim)',
    marginBottom: '20px'
  },
  tableContainer: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)'
  },
  th: {
    padding: '14px 20px',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-dim)',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface-2)'
  },
  td: {
    padding: '14px 20px',
    fontSize: '0.88rem',
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)'
  }
};

// ─── Componente Principal ──────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paginaAtiva, setPaginaAtiva] = useState('dashboard'); // 'dashboard' | 'orcamentos'

  const [filtroMes, setFiltroMes]   = useState('');
  const [filtroAno, setFiltroAno]   = useState(String(anoAtual));

  const [stats, setStats]     = useState({ totalGeral: 0, osPorTecnico: [], osPorCliente: [] });
  const [graficos, setGraficos] = useState({ dadosPeriodo: [], horasKmPorTecnico: [] });
  const [ordens, setOrdens]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGraficos, setLoadingGraficos] = useState(false);
  const [error, setError]     = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Carrega tudo na montagem
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [statsData, graficosData, ordensData] = await Promise.all([
          api.admin.stats({ mes: filtroMes, ano: filtroAno }),
          api.admin.graficos({ mes: filtroMes, ano: filtroAno }),
          api.admin.ordens()
        ]);
        setStats(statsData);
        setGraficos(graficosData);
        setOrdens(ordensData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualiza stats e gráficos ao mudar filtros
  const aplicarFiltros = useCallback(async (mes, ano) => {
    try {
      setLoadingGraficos(true);
      const filtros = {};
      if (ano)  filtros.ano = ano;
      if (mes)  filtros.mes = mes;

      const [statsData, graficosData] = await Promise.all([
        api.admin.stats(filtros),
        api.admin.graficos(filtros),
      ]);
      setStats(statsData);
      setGraficos(graficosData);
    } catch (err) {
      console.error('Erro ao filtrar:', err);
    } finally {
      setLoadingGraficos(false);
    }
  }, []);

  const handleMesChange = (e) => {
    const novoMes = e.target.value;
    setFiltroMes(novoMes);
    aplicarFiltros(novoMes, filtroAno);
  };

  const handleAnoChange = (e) => {
    const novoAno = e.target.value;
    setFiltroAno(novoAno);
    aplicarFiltros(filtroMes, novoAno);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownloadPDF = async (id, numero_os) => {
    try {
      setDownloadingId(id);
      const osFull = await api.ordens.buscar(id);
      if (!osFull?.dados_formulario_json) throw new Error('Dados do formulário não encontrados.');
      const state = JSON.parse(osFull.dados_formulario_json);
      const pdfBytes = await gerarPdfOS(state);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OS_${numero_os || id.substring(0, 8)}_ASSINADA.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      alert('Erro ao gerar o PDF. A OS pode estar corrompida ou incompleta.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id, numero_os) => {
    const confirmacao = window.confirm(
      `ATENÇÃO!\nTem certeza que deseja excluir permanentemente a OS ${numero_os || id.substring(0, 8)}?\nEssa ação não pode ser desfeita.`
    );
    if (!confirmacao) return;
    try {
      await api.admin.excluirOrdem(id);
      setOrdens(prev => prev.filter(os => os.id !== id));
      const statsData = await api.admin.stats({ mes: filtroMes, ano: filtroAno });
      setStats(statsData);
      alert('Ordem de serviço excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir OS:', err);
      alert('Erro ao excluir a OS: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 className="title-md" style={{ color: 'var(--color-accent)', textShadow: 'var(--shadow-glow)' }}>
          Carregando Dashboard...
        </h2>
      </div>
    );
  }

  const periodoLabel = filtroMes
    ? `${MESES.find(m => m.value === filtroMes)?.label || ''} / ${filtroAno}`
    : filtroAno;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.05em' }}>
            <img src="/logo-empfreitas.png" alt="Logo" style={{ height: '32px', marginRight: '12px', objectFit: 'contain' }} />
            EMPFREITAS OS <span style={{ color: 'var(--color-text-dim)', fontWeight: 400, marginLeft: '6px' }}>| ADMIN</span>
          </div>
          <button onClick={() => setPaginaAtiva('dashboard')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: paginaAtiva === 'dashboard' ? 'var(--color-accent)' : 'var(--color-text)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit', opacity: paginaAtiva === 'dashboard' ? 1 : 0.7 }}
          >Dashboard</button>
          <button onClick={() => setPaginaAtiva('orcamentos')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: paginaAtiva === 'orcamentos' ? 'var(--color-accent)' : 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit', opacity: paginaAtiva === 'orcamentos' ? 1 : 0.7 }}
          >📄 Orçamentos</button>
          <a href="/admin/usuarios"
            style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, opacity: 0.7 }}
            onMouseOver={e => e.target.style.opacity = 1}
            onMouseOut={e => e.target.style.opacity = 0.7}
          >Usuários</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Olá, <strong style={{ color: 'var(--color-text)' }}>{user?.username}</strong>
          </span>
          <button
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}
            onClick={handleLogout}
            onMouseOver={e => e.target.style.background = 'var(--color-surface-2)'}
            onMouseOut={e => e.target.style.background = 'transparent'}
          >Sair</button>
        </div>
      </nav>

      {paginaAtiva === 'orcamentos' && <AdminOrcamentos />}

      <main style={{ ...styles.container, position: 'relative', zIndex: 1, display: paginaAtiva === 'dashboard' ? 'block' : 'none' }} className="fade-in">

        {/* Marca d'água */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', width: '80%', height: '80%',
          backgroundImage: 'url(/logo-empfreitas.png)',
          backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'contain',
          opacity: 0.03, filter: 'grayscale(100%) brightness(200%)', zIndex: -1, pointerEvents: 'none'
        }} />

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid var(--color-danger)', padding: '16px', borderRadius: '4px', marginBottom: '24px' }}>
            <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 className="title-lg">Visão Geral</h1>
          <p className="text-muted" style={{ marginTop: '6px' }}>Resumo e análise de todas as Ordens de Serviço cadastradas.</p>
        </div>

        {/* ── Barra de Filtros ── */}
        <div style={styles.filterBar}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: 4 }}>🗓️ Filtrar por:</span>
          <select id="filtro-mes" value={filtroMes} onChange={handleMesChange} style={styles.select}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select id="filtro-ano" value={filtroAno} onChange={handleAnoChange} style={styles.select}>
            {ANOS.map(a => <option key={a} value={String(a)}>{a}</option>)}
          </select>
          {loadingGraficos && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, marginLeft: 8 }}>
              ⏳ Atualizando...
            </span>
          )}
          {(filtroMes || filtroAno !== String(anoAtual)) && (
            <span style={{ fontSize: '0.8rem', background: 'rgba(245,158,11,0.15)', color: 'var(--color-accent)', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
              📊 {periodoLabel}
            </span>
          )}
        </div>

        {/* ── Cards de Estatísticas ── */}
        <div style={styles.grid3}>
          {/* Total */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Total de OS</h3>
            <p style={styles.statNumber}>{stats.totalGeral}</p>
          </div>

          {/* Por Técnico */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>OS por Técnico</h3>
            <ul style={styles.list} className="custom-scrollbar">
              {stats.osPorTecnico.map((item, idx) => (
                <li key={idx} style={styles.listItem}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--color-text)', fontSize: '0.88rem', fontWeight: 500 }} title={item.tecnico}>
                      {item.tecnico || 'Não informado'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                      ⏱ {formatarHoras(item.total_horas)} · 🚗 {Number(item.total_km || 0).toFixed(0)} km
                    </span>
                  </div>
                  <span style={styles.badge}>{item.total}</span>
                </li>
              ))}
              {stats.osPorTecnico.length === 0 && (
                <li style={{ ...styles.listItem, border: 'none', justifyContent: 'center', color: 'var(--color-text-dim)' }}>Sem dados</li>
              )}
            </ul>
          </div>

          {/* Por Cliente */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>OS por Cliente</h3>
            <ul style={styles.list} className="custom-scrollbar">
              {stats.osPorCliente.map((item, idx) => (
                <li key={idx} style={styles.listItem}>
                  <span style={{ color: 'var(--color-text)', fontSize: '0.88rem', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.cliente}>
                    {item.cliente || 'Não informado'}
                  </span>
                  <span style={styles.badge}>{item.total}</span>
                </li>
              ))}
              {stats.osPorCliente.length === 0 && (
                <li style={{ ...styles.listItem, border: 'none', justifyContent: 'center', color: 'var(--color-text-dim)' }}>Sem dados</li>
              )}
            </ul>
          </div>
        </div>

        {/* ── Gráfico 1: OS por Período ── */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>📈 Ordens de Serviço por Período</h2>
          <p style={styles.chartSubtitle}>
            {filtroMes ? 'Evolução semanal dentro do mês selecionado' : `Evolução mensal — ${periodoLabel}`}
          </p>
          {graficos.dadosPeriodo.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-dim)' }}>
              Sem dados para o período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={graficos.dadosPeriodo} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', paddingTop: 10 }} />
                <Line type="monotone" dataKey="total_os" name="OS Abertas" stroke={COLORS.os} strokeWidth={2.5} dot={{ fill: COLORS.os, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Gráfico 2: Horas e KM por Técnico ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          {/* Horas por técnico */}
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>⏱️ Horas Trabalhadas por Técnico</h2>
            <p style={styles.chartSubtitle}>{periodoLabel}</p>
            {graficos.horasKmPorTecnico.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-dim)' }}>Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={graficos.horasKmPorTecnico} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="tecnico" type="category" width={110} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_horas" name="Horas" fill={COLORS.horas} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* KM por técnico */}
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>🚗 Quilometragem por Técnico</h2>
            <p style={styles.chartSubtitle}>{periodoLabel}</p>
            {graficos.horasKmPorTecnico.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-dim)' }}>Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={graficos.horasKmPorTecnico} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} unit=" km" />
                  <YAxis dataKey="tecnico" type="category" width={110} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_km" name="KM" fill={COLORS.km} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Tabela Completa ── */}
        <div style={styles.tableContainer}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="title-md">Histórico Completo</h2>
            <p className="text-muted" style={{ marginTop: '4px' }}>Listagem de todas as OS geradas por todos os técnicos.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={styles.th}>ID / Ref</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Técnico</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Horas</th>
                  <th style={styles.th}>KM</th>
                  <th style={styles.th}>Data</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((os) => (
                  <tr
                    key={os.id}
                    style={{ transition: 'var(--transition)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...styles.td, fontWeight: 700 }}>{os.numero_os || os.id.substring(0, 8)}</td>
                    <td style={styles.td}>{os.cliente_nome || '-'}</td>
                    <td style={styles.td}>{os.tecnico_nome || '-'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span>{os.tipo_os}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{os.tipo_manutencao}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span className={`badge ${os.status === 'FINALIZADA' ? 'badge-finalizada' : 'badge-rascunho'}`}>
                        {os.status}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: 'var(--color-success)', fontWeight: 600 }}>
                      {Number(os.horas_trabalhadas) > 0 ? formatarHoras(os.horas_trabalhadas) : '—'}
                    </td>
                    <td style={{ ...styles.td, color: 'var(--color-accent)', fontWeight: 600 }}>
                      {Number(os.quilometragem_rodada) > 0 ? `${Number(os.quilometragem_rodada).toFixed(0)} km` : '—'}
                    </td>
                    <td style={{ ...styles.td, color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {formatDate(os.criado_em)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleDownloadPDF(os.id, os.numero_os)}
                          disabled={downloadingId === os.id}
                          style={{
                            background: 'var(--color-surface-3)', border: '1px solid var(--color-border)',
                            color: 'var(--color-text)', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem', fontWeight: 600,
                            cursor: downloadingId === os.id ? 'wait' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            opacity: downloadingId === os.id ? 0.7 : 1
                          }}
                        >
                          {downloadingId === os.id ? '⏳' : '📄'} Baixar
                        </button>
                        <button
                          onClick={() => handleDelete(os.id, os.numero_os)}
                          style={{
                            background: 'transparent', border: '1px solid var(--color-danger)',
                            color: 'var(--color-danger)', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'var(--transition)'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-danger)'; }}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ordens.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: 'var(--color-text-dim)' }}>
                      Nenhuma Ordem de Serviço encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;

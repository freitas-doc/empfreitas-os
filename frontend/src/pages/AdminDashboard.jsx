import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ totalGeral: 0, osPorTecnico: [], osPorCliente: [] });
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, ordensData] = await Promise.all([
          api.admin.stats(),
          api.admin.ordens()
        ]);
        setStats(statsData);
        setOrdens(ordensData);
      } catch (err) {
        console.error('Erro ao carregar dados do admin:', err);
        setError('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Styles baseados no global.css
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
    navBrand: {
      fontSize: '1.25rem',
      fontWeight: 800,
      color: 'var(--color-text)',
      letterSpacing: '0.05em'
    },
    navUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logoutBtn: {
      background: 'transparent',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text)',
      padding: '8px 16px',
      borderRadius: 'var(--radius-sm)',
      fontWeight: 600,
      transition: 'var(--transition)',
      cursor: 'pointer'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '40px'
    },
    statCard: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-card)'
    },
    statTitle: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--color-text-dim)',
      marginBottom: '16px',
      fontWeight: 700
    },
    statNumber: {
      fontSize: '3.5rem',
      fontWeight: 800,
      color: 'var(--color-accent)',
      textShadow: 'var(--shadow-glow)',
      textAlign: 'center',
      margin: 'auto'
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      maxHeight: '180px',
      overflowY: 'auto'
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--color-border)'
    },
    listLabel: {
      color: 'var(--color-text)',
      fontSize: '0.9rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '200px'
    },
    listValue: {
      background: 'var(--color-surface-3)',
      color: 'var(--color-accent)',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '0.8rem',
      fontWeight: 700
    },
    tableContainer: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)'
    },
    tableHeader: {
      padding: '24px',
      borderBottom: '1px solid var(--color-border)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left'
    },
    th: {
      padding: '16px 24px',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--color-text-dim)',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface-2)'
    },
    td: {
      padding: '16px 24px',
      fontSize: '0.9rem',
      color: 'var(--color-text)',
      borderBottom: '1px solid var(--color-border)'
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          EMPFREITAS OS <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>| ADMIN</span>
        </div>
        <div style={styles.navUser}>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Olá, <strong style={{ color: 'var(--color-text)' }}>{user?.username}</strong>
          </span>
          <button 
            style={styles.logoutBtn} 
            onClick={handleLogout}
            onMouseOver={(e) => e.target.style.background = 'var(--color-surface-2)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.container} className="fade-in">
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--color-danger)', padding: '16px', borderRadius: '4px', marginBottom: '24px' }}>
            <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h1 className="title-lg">Visão Geral</h1>
          <p className="text-muted" style={{ marginTop: '8px' }}>Resumo de todas as Ordens de Serviço cadastradas.</p>
        </div>

        {/* Stats Grid */}
        <div style={styles.grid}>
          {/* Total */}
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Total de OS</h3>
            <p style={styles.statNumber}>{stats.totalGeral}</p>
          </div>

          {/* Por Técnico */}
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>OS por Técnico</h3>
            <ul style={styles.list} className="custom-scrollbar">
              {stats.osPorTecnico.map((item, idx) => (
                <li key={idx} style={styles.listItem}>
                  <span style={styles.listLabel} title={item.tecnico}>{item.tecnico || 'Não informado'}</span>
                  <span style={styles.listValue}>{item.total}</span>
                </li>
              ))}
              {stats.osPorTecnico.length === 0 && <li style={{...styles.listItem, border: 'none', justifyContent: 'center', color: 'var(--color-text-dim)'}}>Sem dados</li>}
            </ul>
          </div>

          {/* Por Cliente */}
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>OS por Cliente</h3>
            <ul style={styles.list} className="custom-scrollbar">
              {stats.osPorCliente.map((item, idx) => (
                <li key={idx} style={styles.listItem}>
                  <span style={styles.listLabel} title={item.cliente}>{item.cliente || 'Não informado'}</span>
                  <span style={styles.listValue}>{item.total}</span>
                </li>
              ))}
              {stats.osPorCliente.length === 0 && <li style={{...styles.listItem, border: 'none', justifyContent: 'center', color: 'var(--color-text-dim)'}}>Sem dados</li>}
            </ul>
          </div>
        </div>

        {/* Tabela Completa */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h2 className="title-md">Histórico Completo</h2>
            <p className="text-muted" style={{ marginTop: '4px' }}>Listagem de todas as OS geradas por todos os técnicos.</p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID / Ref</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Técnico</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Data</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((os) => (
                  <tr key={os.id} style={{ transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{...styles.td, fontWeight: 700}}>
                      {os.numero_os || os.id.substring(0, 8)}
                    </td>
                    <td style={styles.td}>{os.cliente_nome || '-'}</td>
                    <td style={styles.td}>{os.tecnico_nome || '-'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>{os.tipo_os}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{os.tipo_manutencao}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span className={`badge ${os.status === 'FINALIZADA' ? 'badge-finalizada' : 'badge-rascunho'}`}>
                        {os.status}
                      </span>
                    </td>
                    <td style={{...styles.td, color: 'var(--color-text-muted)', fontSize: '0.85rem'}}>
                      {formatDate(os.criado_em)}
                    </td>
                  </tr>
                ))}
                {ordens.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{...styles.td, textAlign: 'center', padding: '40px', color: 'var(--color-text-dim)'}}>
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

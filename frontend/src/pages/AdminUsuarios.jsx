import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminUsuarios = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'tecnico' });
  const [creating, setCreating] = useState(false);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await api.admin.listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error('Erro ao listar usuarios:', err);
      setError('Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.role) {
      alert('Preencha todos os campos.');
      return;
    }
    try {
      setCreating(true);
      await api.admin.criarUsuario(formData);
      setFormData({ username: '', password: '', role: 'tecnico' });
      alert('Usuário criado com sucesso!');
      fetchUsuarios();
    } catch (err) {
      alert(err.message || 'Erro ao criar usuário.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (user.username === username) {
      alert('Você não pode excluir o seu próprio usuário logado.');
      return;
    }
    const confirmacao = window.confirm(`ATENÇÃO!\nTem certeza que deseja excluir o usuário "${username}"?\nEssa ação não pode ser desfeita.`);
    if (!confirmacao) return;

    try {
      await api.admin.deletarUsuario(id);
      alert('Usuário excluído com sucesso!');
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.message || 'Erro ao excluir usuário.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Styles based on AdminDashboard
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
    navLinks: {
      display: 'flex',
      gap: '24px',
      alignItems: 'center'
    },
    navLink: {
      color: 'var(--color-text)',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: 600,
      opacity: 0.7,
      transition: 'var(--transition)'
    },
    navLinkActive: {
      opacity: 1,
      color: 'var(--color-accent)'
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
      padding: '40px 20px',
      display: 'flex',
      gap: '32px',
      alignItems: 'flex-start',
      flexWrap: 'wrap'
    },
    formContainer: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px',
      boxShadow: 'var(--shadow-card)',
      flex: '1 1 350px',
      maxWidth: '450px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '16px'
    },
    label: {
      fontSize: '0.85rem',
      fontWeight: 600,
      color: 'var(--color-text-dim)'
    },
    input: {
      padding: '12px 16px',
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--color-text)',
      fontSize: '1rem',
      outline: 'none'
    },
    select: {
      padding: '12px 16px',
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--color-text)',
      fontSize: '1rem',
      outline: 'none',
      appearance: 'none'
    },
    btnSubmit: {
      width: '100%',
      padding: '12px',
      background: 'var(--color-accent)',
      color: '#000',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      fontSize: '1rem',
      fontWeight: 800,
      cursor: 'pointer',
      marginTop: '8px',
      transition: 'var(--transition)'
    },
    tableContainer: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      flex: '2 1 600px'
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLinks}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.05em', marginRight: '20px' }}>
            <img src="/logo-empfreitas.png" alt="Logo Empfreitas" style={{ height: '32px', marginRight: '12px', objectFit: 'contain' }} />
            EMPFREITAS OS <span style={{ color: 'var(--color-text-dim)', fontWeight: 400, marginLeft: '6px' }}>| ADMIN</span>
          </div>
          <a href="/admin" style={styles.navLink} onMouseOver={(e) => e.target.style.opacity = 1} onMouseOut={(e) => e.target.style.opacity = 0.7}>Dashboard</a>
          <a href="/admin/usuarios" style={{...styles.navLink, ...styles.navLinkActive}}>Usuários</a>
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

      <main style={{ ...styles.container, position: 'relative', zIndex: 1 }} className="fade-in">
        
        {/* Marca d'água */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          backgroundImage: 'url(/logo-empfreitas.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
          opacity: 0.03, // Transparência bem leve
          filter: 'grayscale(100%) brightness(200%)', // Força a ficar branca num fundo escuro
          zIndex: -1,
          pointerEvents: 'none'
        }} />
        
        {/* Formulário de Criação */}
        <div style={styles.formContainer}>
          <h2 className="title-md" style={{ marginBottom: '24px' }}>Novo Usuário</h2>
          <form onSubmit={handleCreate}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input 
                type="text" 
                style={styles.input}
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Ex: joao.silva"
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Senha</label>
              <input 
                type="password" 
                style={styles.input}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="********"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Perfil (Role)</label>
              <select 
                style={styles.select}
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button type="submit" style={styles.btnSubmit} disabled={creating}>
              {creating ? 'Criando...' : '+ Criar Usuário'}
            </button>
          </form>
        </div>

        {/* Lista de Usuários */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h2 className="title-md">Usuários Cadastrados</h2>
            <p className="text-muted" style={{ marginTop: '4px' }}>Gerencie quem tem acesso ao sistema.</p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Perfil</th>
                  <th style={styles.th}>Criado em</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{...styles.td, textAlign: 'center', padding: '40px'}}>⏳ Carregando...</td>
                  </tr>
                ) : usuarios.map((u) => (
                  <tr key={u.id} style={{ transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{...styles.td, fontWeight: 700}}>{u.username}</td>
                    <td style={styles.td}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-finalizada' : 'badge-rascunho'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{...styles.td, color: 'var(--color-text-muted)', fontSize: '0.85rem'}}>
                      {formatDate(u.criado_em)}
                    </td>
                    <td style={{...styles.td, textAlign: 'right'}}>
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-danger)',
                          color: 'var(--color-danger)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'var(--transition)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'var(--color-danger)';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--color-danger)';
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && usuarios.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{...styles.td, textAlign: 'center', padding: '40px', color: 'var(--color-text-dim)'}}>
                      Nenhum usuário encontrado.
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

export default AdminUsuarios;

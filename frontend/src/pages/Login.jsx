import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    setIsLoading(false);

    if (result.success) {
      if (result.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      setError(result.error || 'Erro ao realizar login. Tente novamente.');
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg)',
    padding: '20px'
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'var(--transition)'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    boxShadow: 'var(--shadow-glow)',
    transition: 'var(--transition)'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle} className="fade-in">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>
            EMPFREITAS OS
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Acesso Restrito
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--color-danger)', padding: '12px', borderRadius: '4px' }}>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>{error}</p>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="username" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
              Usuário
            </label>
            <input
              id="username"
              type="text"
              required
              style={inputStyle}
              placeholder="Seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              style={inputStyle}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading} style={buttonStyle}>
            {isLoading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

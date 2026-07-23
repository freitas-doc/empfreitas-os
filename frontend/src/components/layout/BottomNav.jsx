import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { indexedDbService } from '../../services/indexedDbService.js';

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'var(--bottom-nav-height)',
    background: 'rgba(13, 27, 42, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'stretch',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  item: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 0',
    color: 'var(--color-text-dim)',
    fontSize: '0.7rem',
    fontWeight: 500,
    transition: 'color var(--transition)',
    border: 'none',
    background: 'none',
    textDecoration: 'none',
    position: 'relative',
  },
  icon: {
    fontSize: '1.3rem',
    lineHeight: 1,
    position: 'relative',
    display: 'inline-block',
  },
};

export default function BottomNav() {
  const [qtdRascunhos, setQtdRascunhos] = useState(0);

  useEffect(() => {
    async function checar() {
      const lista = await indexedDbService.listarRascunhos();
      setQtdRascunhos(lista.length);
    }
    checar();
    // Revalida quando a janela ganha foco (ex: voltou de outra tela)
    window.addEventListener('focus', checar);
    return () => window.removeEventListener('focus', checar);
  }, []);

  const navItems = [
    { to: '/', label: 'Nova OS', icon: '➕' },
    { to: '/rascunhos', label: 'Rascunhos', icon: '📝', badge: qtdRascunhos },
    { to: '/clientes', label: 'Clientes', icon: '👥' },
    { to: '/historico', label: 'Histórico', icon: '📋' },
  ];

  return (
    <nav style={styles.nav} role="navigation" aria-label="Navegação principal">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={({ isActive }) => ({
            ...styles.item,
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-dim)',
          })}
        >
          <span style={styles.icon}>
            {item.icon}
            {item.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -8,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 99,
                background: 'var(--color-warning, #f59e0b)',
                color: '#000',
                fontSize: '0.6rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 0 0 2px rgba(13,27,42,0.95)',
              }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

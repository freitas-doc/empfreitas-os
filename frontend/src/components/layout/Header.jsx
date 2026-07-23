import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoUrl from '../../assets/logo-empfreitas.png';

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--header-height)',
    background: 'rgba(13, 27, 42, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 var(--page-padding)',
    zIndex: 100,
    gap: 12,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontSize: '1.4rem',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition)',
    lineHeight: 1,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    objectFit: 'cover',
  },
  titleGroup: {
    flex: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    fontSize: '0.72rem',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export default function Header({ title = 'EMPFREITAS OS', subtitle, showBack = false, actions }) {
  const navigate = useNavigate();

  return (
    <header style={styles.header}>
      {showBack && (
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          ←
        </button>
      )}

      {!showBack && (
        <img src={logoUrl} alt="EMPFREITAS" style={styles.logo} />
      )}

      <div style={styles.titleGroup}>
        <div style={styles.title}>{title}</div>
        {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      </div>

      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </header>
  );
}

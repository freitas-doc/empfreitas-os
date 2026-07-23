import React, { useEffect } from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';
import { CHECKLIST_EMPILHADEIRA, CHECKLIST_CONTROLADOR, STATUS_CHECKLIST } from '../../utils/constants.js';

export default function ChecklistManutencao() {
  const { state, dispatch } = useOSForm();

  // Inicializa checklist se estiver vazio
  useEffect(() => {
    if (state.checklist.length === 0) {
      const padrao = state.tipo_os === 'EMPILHADEIRA' ? CHECKLIST_EMPILHADEIRA : CHECKLIST_CONTROLADOR;
      const initial = padrao.map(item => ({ ...item, status: STATUS_CHECKLIST.OK }));
      dispatch({ type: 'INICIALIZAR_CHECKLIST', payload: initial });
    }
  }, [state.tipo_os, state.checklist.length, dispatch]);

  const handleChangeStatus = (id, status) => {
    dispatch({ type: 'ATUALIZAR_CHECKLIST', id, status });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case STATUS_CHECKLIST.OK: return 'var(--color-success)';
      case STATUS_CHECKLIST.AJUSTADO: return 'var(--color-warning)';
      case STATUS_CHECKLIST.SUBSTITUIDO: return 'var(--color-info)';
      case STATUS_CHECKLIST.PENDENTE: return 'var(--color-danger)';
      default: return 'var(--color-text-muted)';
    }
  };

  if (state.checklist.length === 0) return null;

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 className="title-sm" style={{ marginBottom: 16 }}>Checklist Preventivo</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {state.checklist.map((item) => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{item.grupo}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {Object.values(STATUS_CHECKLIST).map((status) => {
                const ativo = item.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => handleChangeStatus(item.id, status)}
                    style={{
                      padding: '8px 4px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      background: ativo ? `${getStatusColor(status)}20` : 'var(--color-surface-2)',
                      color: ativo ? getStatusColor(status) : 'var(--color-text-dim)',
                      border: `1px solid ${ativo ? getStatusColor(status) : 'transparent'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

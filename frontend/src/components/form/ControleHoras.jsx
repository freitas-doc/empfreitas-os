import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function ControleHoras() {
  const { state, atualizarCampo } = useOSForm();

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 className="title-sm" style={{ marginBottom: 16 }}>Controle de Horas</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Início do Serviço</label>
          <input
            type="datetime-local"
            value={state.data_inicio_servico || ''}
            onChange={(e) => atualizarCampo('data_inicio_servico', e.target.value)}
            style={{ 
              width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--color-border)', background: 'var(--color-bg)', 
              color: '#fff', fontSize: '0.9rem'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Término do Serviço</label>
          <input
            type="datetime-local"
            value={state.data_termino_servico || ''}
            onChange={(e) => atualizarCampo('data_termino_servico', e.target.value)}
            style={{ 
              width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--color-border)', background: 'var(--color-bg)', 
              color: '#fff', fontSize: '0.9rem'
            }}
          />
        </div>
      </div>
    </section>
  );
}

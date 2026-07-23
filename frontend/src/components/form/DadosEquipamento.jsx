import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function DadosEquipamento() {
  const { state, atualizarCampo } = useOSForm();

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 className="title-sm" style={{ marginBottom: 16 }}>Dados do Equipamento</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Modelo do Equipamento *</label>
          <input
            type="text"
            value={state.equipamento_modelo}
            onChange={(e) => atualizarCampo('equipamento_modelo', e.target.value)}
            placeholder="Ex: BT RRE160"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Série</label>
          <input
            type="text"
            value={state.equipamento_serie}
            onChange={(e) => atualizarCampo('equipamento_serie', e.target.value)}
            placeholder="Nº Série"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Horímetro</label>
          <input
            type="text"
            value={state.equipamento_horimetro}
            onChange={(e) => atualizarCampo('equipamento_horimetro', e.target.value)}
            placeholder="Horas"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
          />
        </div>
      </div>
    </section>
  );
}

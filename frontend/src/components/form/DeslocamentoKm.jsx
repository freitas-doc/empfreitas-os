import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

const styleInput = {
  width: '100%',
  padding: '14px 52px 14px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: '#fff',
  fontSize: '1.05rem',
  textAlign: 'right',
  boxSizing: 'border-box',
  fontVariantNumeric: 'tabular-nums',
};

function CampoOdometro({ id, label, sublabel, icon, value, onChange }) {
  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 14px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{icon}</span>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{label}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 1 }}>{sublabel}</div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={onChange}
          placeholder="0"
          style={styleInput}
        />
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.72rem', color: 'var(--color-text-muted)', pointerEvents: 'none', fontWeight: 600,
        }}>km</span>
      </div>
    </div>
  );
}

export default function DeslocamentoKm() {
  const { state, atualizarCampo } = useOSForm();

  const saida   = parseFloat(state.km_odometro_saida)   || 0;
  const chegada = parseFloat(state.km_odometro_chegada) || 0;

  const kmPercorrido = chegada > saida ? chegada - saida : null;
  const leituraInvalida = chegada > 0 && saida > 0 && chegada < saida;

  return (
    <section className="card" style={{ marginBottom: 24, borderColor: 'var(--color-accent)', borderWidth: 1, borderStyle: 'solid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: '1.3rem' }}>🗺️</span>
        <div>
          <h2 className="title-sm" style={{ color: 'var(--color-accent)', margin: 0 }}>Deslocamento</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
            Registre a leitura do painel ao sair e ao chegar no cliente
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <CampoOdometro
          id="km-odometro-saida"
          label="Saída"
          sublabel="KM no painel ao sair do depósito"
          icon="🏁"
          value={state.km_odometro_saida}
          onChange={(e) => atualizarCampo('km_odometro_saida', e.target.value)}
        />
        <CampoOdometro
          id="km-odometro-chegada"
          label="Chegada no cliente"
          sublabel="KM no painel ao chegar no cliente"
          icon="📍"
          value={state.km_odometro_chegada}
          onChange={(e) => atualizarCampo('km_odometro_chegada', e.target.value)}
        />
      </div>

      {/* Resultado */}
      <div style={{
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.22)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Total percorrido (saída → cliente)
        </span>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: kmPercorrido !== null ? 'var(--color-accent)' : 'var(--color-text-dim)' }}>
          {kmPercorrido !== null ? `${kmPercorrido} km` : '—'}
        </span>
      </div>

      {leituraInvalida && (
        <p style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--color-danger)', display: 'flex', gap: 6 }}>
          <span>⚠️</span> A leitura de chegada não pode ser menor que a de saída.
        </p>
      )}
    </section>
  );
}

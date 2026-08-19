import React, { useState } from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function ControleHoras() {
  const { state, atualizarCampo } = useOSForm();
  const [erroTermino, setErroTermino] = useState('');

  // Formata a data atual para o atributo max do datetime-local (sem segundos)
  const agoraISO = () => {
    const agora = new Date();
    agora.setSeconds(0, 0);
    return agora.toISOString().slice(0, 16);
  };

  const handleTerminoChange = (valor) => {
    setErroTermino('');
    atualizarCampo('data_termino_servico', valor);

    if (!valor) return;

    const termino = new Date(valor);
    const agora   = new Date();

    // Regra 1: término não pode ser posterior ao momento atual (hora de fechamento)
    if (termino > agora) {
      setErroTermino('O término não pode ser posterior ao horário atual. O fechamento da OS ocorre agora.');
      return;
    }

    // Regra 2: término não pode ser anterior ao início
    if (state.data_inicio_servico && termino < new Date(state.data_inicio_servico)) {
      setErroTermino('O término não pode ser anterior ao início do serviço.');
    }
  };

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 className="title-sm" style={{ marginBottom: 16 }}>Controle de Horas</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Início do Serviço</label>
          <input
            type="datetime-local"
            value={state.data_inicio_servico || ''}
            max={agoraISO()}
            onChange={(e) => {
              atualizarCampo('data_inicio_servico', e.target.value);
              // Revalida o término se já estiver preenchido
              if (state.data_termino_servico) {
                handleTerminoChange(state.data_termino_servico);
              }
            }}
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
            min={state.data_inicio_servico || undefined}
            max={agoraISO()}
            onChange={(e) => handleTerminoChange(e.target.value)}
            style={{ 
              width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', 
              border: `1px solid ${erroTermino ? 'var(--color-danger)' : 'var(--color-border)'}`,
              background: 'var(--color-bg)', 
              color: '#fff', fontSize: '0.9rem'
            }}
          />
          {erroTermino && (
            <p style={{
              marginTop: 6, fontSize: '0.75rem', color: 'var(--color-danger)',
              display: 'flex', alignItems: 'flex-start', gap: 4
            }}>
              ⚠️ {erroTermino}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


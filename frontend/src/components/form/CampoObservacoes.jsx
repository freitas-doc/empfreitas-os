import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function CampoObservacoes() {
  const { state, atualizarCampo } = useOSForm();
  const isCorretiva = state.tipo_manutencao === 'CORRETIVA';

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 className="title-sm" style={{ marginBottom: 16 }}>
        {isCorretiva ? 'Detalhes do Serviço' : 'Observações Gerais'}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isCorretiva && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Problema Relatado</label>
              <textarea
                value={state.descricao_problema}
                onChange={(e) => atualizarCampo('descricao_problema', e.target.value)}
                placeholder="Descreva o defeito apresentado pelo equipamento..."
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Serviço Executado</label>
              <textarea
                value={state.servico_executado}
                onChange={(e) => atualizarCampo('servico_executado', e.target.value)}
                placeholder="Descreva a solução aplicada e os testes realizados..."
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', resize: 'vertical' }}
              />
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Observações Extras</label>
          <textarea
            value={state.observacoes}
            onChange={(e) => atualizarCampo('observacoes', e.target.value)}
            placeholder="Qualquer nota adicional sobre a manutenção..."
            rows={3}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', resize: 'vertical' }}
          />
        </div>
      </div>
    </section>
  );
}

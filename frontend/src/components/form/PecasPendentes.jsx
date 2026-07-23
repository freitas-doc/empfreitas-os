import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function PecasPendentes() {
  const { state, dispatch } = useOSForm();

  const handleAddPeca = () => dispatch({ type: 'ADICIONAR_PECA_PENDENTE' });
  const handleRemovePeca = (id) => dispatch({ type: 'REMOVER_PECA_PENDENTE', id });
  const handleUpdatePeca = (id, dados) => dispatch({ type: 'ATUALIZAR_PECA_PENDENTE', id, dados });

  return (
    <section className="card" style={{ marginBottom: 24, borderColor: 'var(--color-warning)', borderWidth: 1, borderStyle: 'solid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 className="title-sm" style={{ color: 'var(--color-warning)' }}>Peças Pendentes (Compra/Orçamento)</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 4 }}>Adicionar peças aqui muda o status da OS para Pendente.</p>
        </div>
        <button
          onClick={handleAddPeca}
          style={{
            background: 'rgba(234, 179, 8, 0.1)',
            color: 'var(--color-warning)',
            border: '1px solid var(--color-warning)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          + Adicionar Pendência
        </button>
      </div>

      {state.pecas_pendentes.length === 0 ? (
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
          Nenhuma peça pendente para esta OS.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.pecas_pendentes.map((peca, idx) => (
            <div key={peca.id} style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>Peça #{idx + 1}</span>
                <button
                  onClick={() => handleRemovePeca(peca.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Remover
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    value={peca.quantidade}
                    onChange={(e) => handleUpdatePeca(peca.id, { quantidade: e.target.value })}
                    style={{ width: '60px', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', textAlign: 'center' }}
                  />
                  <input
                    type="text"
                    placeholder="Nome da Peça Pendente"
                    value={peca.nome_peca}
                    onChange={(e) => handleUpdatePeca(peca.id, { nome_peca: e.target.value })}
                    style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Código / SKU (opcional)"
                  value={peca.codigo_sku || ''}
                  onChange={(e) => handleUpdatePeca(peca.id, { codigo_sku: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.4)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
                <input
                  type="text"
                  placeholder="Observação (Ex: Necessário para montagem)"
                  value={peca.observacao}
                  onChange={(e) => handleUpdatePeca(peca.id, { observacao: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

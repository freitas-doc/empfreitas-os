import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function PecasTrocadas() {
  const { state, dispatch } = useOSForm();

  const handleAddPeca = () => dispatch({ type: 'ADICIONAR_PECA' });
  const handleRemovePeca = (id) => dispatch({ type: 'REMOVER_PECA', id });
  const handleUpdatePeca = (id, dados) => dispatch({ type: 'ATUALIZAR_PECA', id, dados });

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="title-sm">Peças Trocadas</h2>
        <button
          onClick={handleAddPeca}
          style={{
            background: 'var(--color-surface-3)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          + Adicionar Peça
        </button>
      </div>

      {state.pecas.length === 0 ? (
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
          Nenhuma peça registrada nesta manutenção.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.pecas.map((peca, idx) => (
            <div key={peca.id} style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Peça #{idx + 1}</span>
                <button onClick={() => handleRemovePeca(peca.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                  Remover
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 3 }}>
                  <input
                    type="text"
                    value={peca.nome_peca}
                    onChange={(e) => handleUpdatePeca(peca.id, { nome_peca: e.target.value })}
                    placeholder="Descrição da peça"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="1"
                    value={peca.quantidade}
                    onChange={(e) => handleUpdatePeca(peca.id, { quantidade: parseInt(e.target.value) || 1 })}
                    placeholder="Qtd"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 2 }}>
                  <input
                    type="text"
                    value={peca.codigo_sku || ''}
                    onChange={(e) => handleUpdatePeca(peca.id, { codigo_sku: e.target.value })}
                    placeholder="Código / SKU (opcional)"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.4)', background: 'var(--color-bg)', color: 'var(--color-accent)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ flex: 3 }}>
                  <input
                    type="text"
                    value={peca.observacao}
                    onChange={(e) => handleUpdatePeca(peca.id, { observacao: e.target.value })}
                    placeholder="Observação (opcional)"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import React, { useState } from 'react';
import PainelAssinatura from './PainelAssinatura.jsx';
import { useOSForm } from '../../context/OSFormContext.jsx';

// ── Máscara simples de CPF ─────────────────────────────────
function mascaraCPF(v) {
  return v.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

const styleInput = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: '#fff',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

export default function AssinaturaCliente() {
  const { state, dispatch } = useOSForm();
  const [modalAberto, setModalAberto] = useState(false);

  const assinatura  = state.assinaturas.cliente;
  const nome        = state.responsavel_cliente_nome || '';
  const cpf         = state.responsavel_cliente_cpf  || '';
  const preenchido  = assinatura && nome.trim();

  const set = (campo, valor) =>
    dispatch({ type: 'ATUALIZAR_CAMPO', campo, valor });

  const handleSalvar = (base64) => {
    dispatch({ type: 'SALVAR_ASSINATURA', tipo: 'cliente', base64 });
    setModalAberto(false);
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 className="title-sm" style={{ color: preenchido ? 'var(--color-success)' : 'var(--color-text)' }}>
            {preenchido ? '✔ Assinatura do Cliente' : 'Assinatura do Cliente'}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Responsável pela aprovação do serviço
          </p>
        </div>
      </div>

      {/* Campos de identificação do responsável */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Nome do responsável *
          </label>
          <input
            id="responsavel-cliente-nome"
            type="text"
            value={nome}
            onChange={(e) => set('responsavel_cliente_nome', e.target.value)}
            placeholder="Nome completo de quem está aprovando"
            style={styleInput}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            CPF do responsável
          </label>
          <input
            id="responsavel-cliente-cpf"
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => set('responsavel_cliente_cpf', mascaraCPF(e.target.value))}
            placeholder="000.000.000-00"
            style={styleInput}
          />
        </div>
      </div>

      {/* Assinatura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {assinatura ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <img
              src={assinatura}
              alt="Assinatura Cliente"
              style={{ height: 48, background: '#fff', borderRadius: 4, border: '1px solid var(--color-border)', cursor: 'pointer' }}
              onClick={() => setModalAberto(true)}
              title="Clique para refazer"
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-success)' }}>✔ Assinatura registrada</span>
          </div>
        ) : (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>Nenhuma assinatura registrada</span>
        )}
        <button
          onClick={() => setModalAberto(true)}
          style={{
            padding: '9px 18px',
            background: assinatura ? 'var(--color-surface-2)' : 'var(--color-surface-2)',
            border: `1px solid ${assinatura ? 'var(--color-success)' : 'var(--color-accent)'}`,
            color: assinatura ? 'var(--color-success)' : 'var(--color-accent)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            marginLeft: 12,
            flexShrink: 0,
          }}
        >
          {assinatura ? 'Refazer' : 'Assinar'}
        </button>
      </div>

      {modalAberto && (
        <PainelAssinatura
          titulo="Assinatura do Cliente"
          descricao="Desenhe sua assinatura para confirmar a aprovação do servico realizado."
          onSalvar={handleSalvar}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}

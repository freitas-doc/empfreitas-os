import React, { useState, useEffect } from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';
import { mascaraCPFCNPJ } from '../../utils/formatters.js';
import { indexedDbService } from '../../services/indexedDbService.js';

export default function DadosCliente() {
  const { state, atualizarCampo } = useOSForm();
  
  // Modal de busca
  const [modalAberto, setModalAberto] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (modalAberto) {
      carregarClientes();
    }
  }, [modalAberto]);

  const carregarClientes = async () => {
    setBuscando(true);
    const lista = await indexedDbService.listarClientes();
    setClientes(lista);
    setBuscando(false);
  };

  const selecionarCliente = (cli) => {
    atualizarCampo('cliente_nome', cli.nome || '');
    atualizarCampo('cliente_documento', cli.documento || '');
    atualizarCampo('cliente_endereco', cli.endereco || '');
    setModalAberto(false);
  };

  const salvarClienteAtual = async () => {
    if (!state.cliente_nome?.trim()) {
      alert("Para salvar o cliente, digite pelo menos o Nome/Razão Social.");
      return;
    }
    await indexedDbService.salvarCliente({
      nome: state.cliente_nome,
      documento: state.cliente_documento,
      endereco: state.cliente_endereco
    });
    alert("Cliente salvo no banco local com sucesso!");
  };

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="title-sm" style={{ margin: 0 }}>Dados do Cliente</h2>
        <button 
          type="button"
          onClick={() => setModalAberto(true)}
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🔍 Buscar
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Nome / Razão Social *</label>
          <input
            type="text"
            value={state.cliente_nome}
            onChange={(e) => atualizarCampo('cliente_nome', e.target.value)}
            placeholder="Nome do cliente"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>CNPJ / CPF</label>
          <input
            type="text"
            value={state.cliente_documento}
            onChange={(e) => atualizarCampo('cliente_documento', mascaraCPFCNPJ(e.target.value))}
            placeholder="00.000.000/0000-00"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Endereço</label>
          <input
            type="text"
            value={state.cliente_endereco}
            onChange={(e) => atualizarCampo('cliente_endereco', e.target.value)}
            placeholder="Endereço da manutenção"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button 
          type="button"
          onClick={salvarClienteAtual}
          style={{
            background: 'none', border: 'none', color: 'var(--color-text-dim)',
            textDecoration: 'underline', fontSize: '0.8rem', cursor: 'pointer'
          }}
        >
          Salvar este cliente na base local
        </button>
      </div>

      {/* Modal de Busca de Clientes */}
      {modalAberto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: 'var(--page-padding)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setModalAberto(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
            >✕</button>
            
            <h2 className="title-sm" style={{ marginBottom: 20 }}>Selecionar Cliente</h2>

            {buscando ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>Buscando...</p>
            ) : clientes.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>Nenhum cliente cadastrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clientes.map(cli => (
                  <button 
                    key={cli.id}
                    onClick={() => selecionarCliente(cli)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: 12, borderRadius: 8, background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)', color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: 4 }}>{cli.nome}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                      {cli.documento || 'Sem CNPJ/CPF'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

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
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    if (modalAberto) {
      setFiltro('');
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

  const clientesFiltrados = clientes.filter(cli => 
    cli.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    (cli.documento && cli.documento.includes(filtro))
  );

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
          background: 'rgba(0,0,0,0.9)',
          zIndex: 2000, padding: '20px 10px',
          display: 'flex', justifyContent: 'center'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: 450, 
            display: 'flex', flexDirection: 'column', 
            maxHeight: '90vh', overflow: 'hidden' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="title-sm" style={{ margin: 0 }}>Selecionar Cliente</h2>
              <button 
                onClick={() => setModalAberto(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              >✕</button>
            </div>
            
            <input 
              type="text"
              placeholder="Filtrar por nome ou documento..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
            />

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {buscando ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Buscando...</p>
              ) : clientesFiltrados.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Nenhum cliente encontrado.</p>
              ) : (
                clientesFiltrados.map(cli => (
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{cli.documento || 'Sem CNPJ/CPF'}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

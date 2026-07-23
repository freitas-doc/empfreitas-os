import React, { useState, useEffect } from 'react';
import { indexedDbService } from '../services/indexedDbService.js';
import { mascaraCPFCNPJ } from '../utils/formatters.js';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Form State
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [endereco, setEndereco] = useState('');

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    setCarregando(true);
    const lista = await indexedDbService.listarClientes();
    setClientes(lista);
    setCarregando(false);
  };

  const abrirModal = (cliente = null) => {
    if (cliente) {
      setClienteEditando(cliente);
      setNome(cliente.nome || '');
      setDocumento(cliente.documento || '');
      setEndereco(cliente.endereco || '');
    } else {
      setClienteEditando(null);
      setNome('');
      setDocumento('');
      setEndereco('');
    }
    setModalAberto(true);
  };

  const fecharModal = () => setModalAberto(false);

  const salvarCliente = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert("O Nome do cliente é obrigatório.");
      return;
    }

    const clienteParaSalvar = {
      ...(clienteEditando && { id: clienteEditando.id }),
      nome,
      documento,
      endereco
    };

    await indexedDbService.salvarCliente(clienteParaSalvar);
    fecharModal();
    carregarClientes();
  };

  const deletarCliente = async (id) => {
    if (window.confirm("Deseja realmente excluir este cliente?")) {
      await indexedDbService.deletarCliente(id);
      carregarClientes();
    }
  };

  return (
    <>
      <Header title="Meus Clientes" />
      <main className="page-container fade-in" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 120px)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="title-md">Cadastros Rápidos</h2>
          <button 
            onClick={() => abrirModal()}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'var(--color-accent)',
              color: '#000',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>➕</span> Novo Cliente
          </button>
        </div>

        {carregando ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
            Carregando...
          </div>
        ) : clientes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 16 }}>👥</span>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Você ainda não tem clientes cadastrados.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
              Cadastre aqui ou adicione direto na tela de Nova OS.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clientes.map(cli => (
              <div key={cli.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                    {cli.nome}
                  </h3>
                  {cli.documento && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: 2 }}>
                      CNPJ/CPF: {cli.documento}
                    </p>
                  )}
                  {cli.endereco && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                      📍 {cli.endereco}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => abrirModal(cli)}
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, color: '#fff' }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => deletarCliente(cli.id)}
                    style={{ background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', borderRadius: 8, padding: 8, color: 'var(--color-danger)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalAberto && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: 'var(--page-padding)'
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
              <button 
                onClick={fecharModal}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >✕</button>
              
              <h2 className="title-sm" style={{ marginBottom: 20 }}>
                {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>

              <form onSubmit={salvarCliente} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Nome / Razão Social *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Nome completo ou empresa"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>CNPJ / CPF</label>
                  <input
                    type="text"
                    value={documento}
                    onChange={e => setDocumento(mascaraCPFCNPJ(e.target.value))}
                    placeholder="Opcional"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Endereço</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={e => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff' }}
                  />
                </div>
                
                <button 
                  type="submit"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#000',
                    fontWeight: 'bold',
                    marginTop: 8
                  }}
                >
                  Salvar Cliente
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
      <BottomNav />
    </>
  );
}

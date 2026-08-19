import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { useOSForm } from '../context/OSFormContext.jsx';
import { indexedDbService } from '../services/indexedDbService.js';

export default function Home() {
  const navigate = useNavigate();
  const { dispatch } = useOSForm();
  
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState(null);
  
  const [rascunhos, setRascunhos] = useState([]);
  const [mostrarModalRascunho, setMostrarModalRascunho] = useState(false);

  useEffect(() => {
    async function buscarRascunhos() {
      const drafts = await indexedDbService.listarRascunhos();
      if (drafts.length > 0) {
        setRascunhos(drafts);
        setMostrarModalRascunho(true);
      }
    }
    buscarRascunhos();
  }, []);

  const handleIniciarOS = async () => {
    dispatch({ type: 'INICIAR_OS', payload: { tipo_os: tipoSelecionado, tipo_manutencao: manutencaoSelecionada } });
    
    // Cria rascunho em branco inicial e pega a ID
    const path = tipoSelecionado === 'EMPILHADEIRA' ? '/nova-os/empilhadeira' : '/nova-os/controlador';
    navigate(path);
  };

  const handleRetomarRascunho = (rascunho) => {
    dispatch({ type: 'CARREGAR_RASCUNHO', payload: rascunho });
    const path = rascunho.tipo_os === 'EMPILHADEIRA' ? '/nova-os/empilhadeira' : '/nova-os/controlador';
    navigate(path);
  };

  const handleDescartarRascunhos = async () => {
    const confirmar = window.confirm('Tem certeza que deseja descartar o(s) rascunho(s)? Esta ação não pode ser desfeita e os dados não salvos serão perdidos.');
    if (!confirmar) return;

    for (const r of rascunhos) {
      await indexedDbService.deletarOrdem(r.id);
    }
    setMostrarModalRascunho(false);
  };

  return (
    <>
      <Header title="EMPFREITAS" subtitle="Sistema de Gestão de Manutenção" />
      
      {/* Modal de Rascunho */}
      {mostrarModalRascunho && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: '24px 20px 20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 className="title-md" style={{ color: 'var(--color-warning)', fontSize: '1rem', margin: 0 }}>
                📝 {rascunhos.length} Rascunho{rascunhos.length > 1 ? 's' : ''} em aberto
              </h3>
              <button
                onClick={() => setMostrarModalRascunho(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', fontSize: '1.3rem', cursor: 'pointer', padding: '0 4px' }}
                aria-label="Fechar"
              >×</button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: 16 }}>
              Deseja retomar uma OS anterior ou criar uma nova?
            </p>

            {/* Lista de rascunhos (max 3) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {rascunhos.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRetomarRascunho(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>
                    {r.tipo_os === 'EMPILHADEIRA' ? '🚜' : '⚡'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>
                      {r.tipo_os}{r.numero_os ? ` · #${r.numero_os}` : ' · Rascunho'}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.cliente_nome?.trim() || 'Cliente não preenchido'} · {new Date(r.atualizado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>Retomar →</span>
                </button>
              ))}
              {rascunhos.length > 3 && (
                <button
                  onClick={() => { setMostrarModalRascunho(false); navigate('/rascunhos'); }}
                  style={{ padding: 10, background: 'transparent', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  + {rascunhos.length - 3} outro{rascunhos.length - 3 > 1 ? 's' : ''} — Ver todos os rascunhos
                </button>
              )}
            </div>

            {/* Ações principais */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setMostrarModalRascunho(false)}
                style={{ padding: 12, background: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                ➕ Criar Nova OS (manter rascunhos)
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setMostrarModalRascunho(false); navigate('/rascunhos'); }}
                  style={{ flex: 1, padding: 10, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  📝 Gerenciar rascunhos
                </button>
                <button
                  onClick={handleDescartarRascunhos}
                  style={{ flex: 1, padding: 10, background: 'transparent', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🗑 Descartar todos
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      <main className="page-container fade-in" style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
        
        <h2 className="title-sm" style={{ marginBottom: 16 }}>1. Selecione o Tipo de Equipamento</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <button 
            className={`card ${tipoSelecionado === 'EMPILHADEIRA' ? 'selected' : ''}`}
            onClick={() => setTipoSelecionado('EMPILHADEIRA')}
            style={{ padding: 24, textAlign: 'center', border: tipoSelecionado === 'EMPILHADEIRA' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🚜</div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Empilhadeira</h3>
          </button>
          
          <button 
            className={`card ${tipoSelecionado === 'CONTROLADOR' ? 'selected' : ''}`}
            onClick={() => setTipoSelecionado('CONTROLADOR')}
            style={{ padding: 24, textAlign: 'center', border: tipoSelecionado === 'CONTROLADOR' ? '2px solid var(--color-accent)' : '2px solid transparent' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚡</div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Controlador</h3>
          </button>
        </div>

        <h2 className="title-sm" style={{ marginBottom: 16 }}>2. Tipo de Manutenção</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <button 
            className={`card ${manutencaoSelecionada === 'CORRETIVA' ? 'selected' : ''}`}
            onClick={() => setManutencaoSelecionada('CORRETIVA')}
            style={{ padding: 16, textAlign: 'center', border: manutencaoSelecionada === 'CORRETIVA' ? '1px solid var(--color-danger)' : '1px solid var(--color-border)' }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: manutencaoSelecionada === 'CORRETIVA' ? 'var(--color-danger)' : 'inherit' }}>Corretiva</h3>
          </button>
          
          <button 
            className={`card ${manutencaoSelecionada === 'PREVENTIVA' ? 'selected' : ''}`}
            onClick={() => setManutencaoSelecionada('PREVENTIVA')}
            style={{ padding: 16, textAlign: 'center', border: manutencaoSelecionada === 'PREVENTIVA' ? '1px solid var(--color-success)' : '1px solid var(--color-border)' }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: manutencaoSelecionada === 'PREVENTIVA' ? 'var(--color-success)' : 'inherit' }}>Preventiva</h3>
          </button>
        </div>

        <button 
          onClick={handleIniciarOS}
          disabled={!tipoSelecionado || !manutencaoSelecionada}
          style={{ 
            width: '100%', 
            padding: 16, 
            borderRadius: 'var(--radius-md)', 
            background: tipoSelecionado && manutencaoSelecionada ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: tipoSelecionado && manutencaoSelecionada ? '#000' : 'var(--color-text-dim)',
            fontWeight: 700,
            border: 'none',
            fontSize: '1rem',
            cursor: tipoSelecionado && manutencaoSelecionada ? 'pointer' : 'not-allowed',
            opacity: tipoSelecionado && manutencaoSelecionada ? 1 : 0.6
          }}
        >
          Iniciar Ordem de Serviço
        </button>

      </main>
      <BottomNav />
    </>
  );
}

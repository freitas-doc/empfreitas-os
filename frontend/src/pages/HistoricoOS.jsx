import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { indexedDbService } from '../services/indexedDbService.js';
import { formatarDataHora, formatarNumeroOS } from '../utils/formatters.js';

export default function HistoricoOS() {
  const [ordens, setOrdens] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarOrdens() {
      // Prioriza a base local offline, o DB tem todas as rascunhos e finalizadas salvas localmente
      const local = await indexedDbService.db.ordens.reverse().sortBy('atualizado_em');
      setOrdens(local);
    }
    carregarOrdens();
  }, []);

  const ordensFiltradas = ordens.filter(o => {
    if (filtroStatus === 'TODOS') return true;
    if (filtroStatus === 'FINALIZADA') return o.status === 'FINALIZADA' || o.status === 'COMPLETA - COM PENDENCIA';
    return o.status === filtroStatus;
  });

  return (
    <>
      <Header title="Histórico" showBack />
      <main className="page-container fade-in" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 40px)' }}>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {['TODOS', 'FINALIZADA', 'RASCUNHO'].map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                background: filtroStatus === status ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: filtroStatus === status ? '#000' : 'var(--color-text)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {status === 'FINALIZADA' ? 'FINALIZADAS (ASSINADAS)' : status}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ordensFiltradas.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhuma OS encontrada com estes filtros.</p>
          ) : (
            ordensFiltradas.map(os => (
              <div key={os.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `4px solid ${os.status === 'FINALIZADA' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{os.cliente_nome || 'Sem Nome'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{os.tipo_os} • {os.tipo_manutencao}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: 4, background: 'var(--color-surface-3)' }}>
                    {formatarNumeroOS(os.numero_os || os.id.slice(0,6))}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem' }}>Equipamento: <strong>{os.equipamento_modelo || 'N/A'}</strong></p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>Atualizado em: {formatarDataHora(os.atualizado_em)}</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  {os.status === 'RASCUNHO' ? (
                     <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: 'var(--color-warning)', border: 'none', color: '#000', borderRadius: 4, fontWeight: 700 }}>
                       Retomar
                     </button>
                  ) : (
                    <button onClick={() => navigate(`/historico/${os.id}`)} style={{ padding: '8px 16px', background: 'var(--color-success)', border: 'none', color: '#fff', borderRadius: 4, fontWeight: 700 }}>
                       Ver PDF
                     </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </main>
      <BottomNav />
    </>
  );
}

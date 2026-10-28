import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { indexedDbService } from '../services/indexedDbService.js';
import { api } from '../services/api.js';
import { formatarDataHora, formatarNumeroOS } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function HistoricoOS() {
  const [ordens, setOrdens] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function carregarOrdens() {
      setCarregando(true);
      const username = user?.role === 'admin' ? null : user?.username;

      // 1. Carrega do IndexedDB local (offline-first, exibe rápido)
      const local = await indexedDbService.listarTodasOrdens(username);
      setOrdens(local); // exibe imediatamente o que há no cache

      // 2. Tenta buscar do backend para recuperar OS que não estão no cache local
      try {
        const filtros = {};
        if (username) filtros.tecnico_nome = username;
        const doBackend = await api.ordens.listar(filtros);

        // 3. Mescla: backend é fonte de verdade para IDs desconhecidos localmente
        const idsLocais = new Set(local.map(o => o.id));
        const novas = doBackend.filter(o => !idsLocais.has(o.id));

        // Salva no IndexedDB as OS que vieram do backend mas não estavam no cache
        for (const os of novas) {
          try {
            let extra = {};
            if (os.dados_formulario_json) {
              try { extra = JSON.parse(os.dados_formulario_json); } catch (_) {}
            }
            const osLocal = {
              ...extra,
              id: os.id,
              status: os.status,
              numero_os: os.numero_os,
              tipo_os: os.tipo_os,
              tipo_manutencao: os.tipo_manutencao,
              cliente_nome: os.cliente_nome,
              cliente_documento: os.cliente_documento,
              cliente_endereco: os.cliente_endereco,
              equipamento_modelo: os.equipamento_modelo,
              equipamento_serie: os.equipamento_serie,
              equipamento_horimetro: os.equipamento_horimetro,
              tecnico_nome: os.tecnico_nome,
              descricao_problema: os.descricao_problema,
              servico_executado: os.servico_executado,
              observacoes: os.observacoes,
              data_abertura: os.data_abertura,
              data_fechamento: os.data_fechamento,
              atualizado_em: os.atualizado_em || os.criado_em,
            };
            await indexedDbService.salvarOrdem(osLocal);
          } catch (_) { /* ignora erros individuais */ }
        }

        // 4. Relê o IndexedDB atualizado e exibe
        const atualizado = await indexedDbService.listarTodasOrdens(username);
        setOrdens(atualizado);
      } catch (_) {
        // Backend indisponível — mantém o que foi carregado do IndexedDB
      }
      setCarregando(false);
    }
    carregarOrdens();
  }, [user]);

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

          {carregando && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', alignSelf: 'center', marginLeft: 8, flexShrink: 0 }}>
              🔄 Sincronizando...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ordensFiltradas.length === 0 && !carregando ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhuma OS encontrada com estes filtros.</p>
          ) : (
            ordensFiltradas.map(os => (
              <div key={os.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `4px solid ${os.status === 'FINALIZADA' || os.status === 'COMPLETA - COM PENDENCIA' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
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

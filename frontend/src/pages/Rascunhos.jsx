import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { useOSForm } from '../context/OSFormContext.jsx';
import { indexedDbService } from '../services/indexedDbService.js';

const ICONE_TIPO = {
  EMPILHADEIRA: '🚜',
  CONTROLADOR: '⚡',
};

const COR_MANUTENCAO = {
  CORRETIVA: 'var(--color-danger)',
  PREVENTIVA: 'var(--color-success)',
};

function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Rascunhos() {
  const navigate = useNavigate();
  const { dispatch } = useOSForm();
  const [rascunhos, setRascunhos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState(null); // id do rascunho sendo excluído

  const carregar = useCallback(async () => {
    setCarregando(true);
    const lista = await indexedDbService.listarRascunhos();
    setRascunhos(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleRetomar = (rascunho) => {
    dispatch({ type: 'CARREGAR_RASCUNHO', payload: rascunho });
    const path = rascunho.tipo_os === 'EMPILHADEIRA' ? '/nova-os/empilhadeira' : '/nova-os/controlador';
    navigate(path);
  };

  const handleExcluir = async (rascunho) => {
    const nome = rascunho.cliente_nome?.trim()
      ? `"${rascunho.cliente_nome}"`
      : `OS ${rascunho.numero_os || rascunho.tipo_os}`;
    const confirmar = window.confirm(`Deseja excluir o rascunho ${nome}?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmar) return;

    setExcluindo(rascunho.id);
    await indexedDbService.deletarOrdem(rascunho.id);
    setExcluindo(null);
    carregar();
  };

  const handleExcluirTodos = async () => {
    if (rascunhos.length === 0) return;
    const confirmar = window.confirm(`Deseja excluir TODOS os ${rascunhos.length} rascunho(s)?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmar) return;

    for (const r of rascunhos) {
      await indexedDbService.deletarOrdem(r.id);
    }
    carregar();
  };

  return (
    <>
      <Header title="Rascunhos" subtitle="Ordens de serviço em andamento" />

      <main className="page-container fade-in" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>

        {carregando && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-dim)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <p>Carregando rascunhos...</p>
          </div>
        )}

        {!carregando && rascunhos.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: 8,
            }}>📝</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Nenhum rascunho salvo
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', maxWidth: 260, lineHeight: 1.5 }}>
              As ordens de serviço que você iniciar aparecerão aqui enquanto não forem finalizadas.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 8,
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent)',
                color: '#000',
                fontWeight: 700,
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              ➕ Criar Nova OS
            </button>
          </div>
        )}

        {!carregando && rascunhos.length > 0 && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                {rascunhos.length} rascunho{rascunhos.length > 1 ? 's' : ''} em aberto
              </p>
              <button
                onClick={handleExcluirTodos}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Excluir todos
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rascunhos.map((r) => (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    opacity: excluindo === r.id ? 0.4 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {/* Faixa de tipo de manutenção */}
                  <div style={{
                    height: 4,
                    background: r.tipo_manutencao ? COR_MANUTENCAO[r.tipo_manutencao] : 'var(--color-border)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  }} />

                  <div style={{ padding: '16px 16px 12px' }}>
                    {/* Cabeçalho do card */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        flexShrink: 0,
                      }}>
                        {ICONE_TIPO[r.tipo_os] || '📄'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                            {r.tipo_os || '—'}
                          </span>
                          {r.tipo_manutencao && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 99,
                              background: COR_MANUTENCAO[r.tipo_manutencao] + '22',
                              color: COR_MANUTENCAO[r.tipo_manutencao],
                              border: `1px solid ${COR_MANUTENCAO[r.tipo_manutencao]}44`,
                            }}>
                              {r.tipo_manutencao}
                            </span>
                          )}
                          {r.numero_os && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                              #{r.numero_os}
                            </span>
                          )}
                        </div>

                        <p style={{
                          fontSize: '0.82rem',
                          color: r.cliente_nome ? 'var(--color-text-muted)' : 'var(--color-text-dim)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {r.cliente_nome?.trim() || 'Cliente não preenchido'}
                        </p>

                        {r.equipamento_modelo?.trim() && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', margin: '2px 0 0' }}>
                            {r.equipamento_modelo}
                            {r.equipamento_serie ? ` · S/N ${r.equipamento_serie}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Data de atualização */}
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginBottom: 12 }}>
                      🕒 Última edição: {formatarData(r.atualizado_em)}
                    </p>

                    {/* Botões de ação */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleRetomar(r)}
                        disabled={excluindo === r.id}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-accent)',
                          color: '#000',
                          fontWeight: 700,
                          border: 'none',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        ▶ Retomar
                      </button>
                      <button
                        onClick={() => handleExcluir(r)}
                        disabled={excluindo === r.id}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'transparent',
                          border: '1px solid var(--color-danger)',
                          color: 'var(--color-danger)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                ➕ Criar Nova OS
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </>
  );
}

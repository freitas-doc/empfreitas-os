import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header.jsx';
import { indexedDbService } from '../services/indexedDbService.js';
import { api } from '../services/api.js';

/**
 * Página de Recuperação/Sincronização de OS
 * Exporta todas as OS do IndexedDB local para o banco de dados de produção.
 * Use no dispositivo original que ainda tem o IndexedDB com os dados históricos.
 */
export default function SincronizarOS() {
  const [ordens, setOrdens] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [progresso, setProgresso] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const todas = await indexedDbService.listarTodasOrdens(null);
      setOrdens(todas);
      setCarregando(false);
    }
    carregar();
  }, []);

  const sincronizar = async () => {
    if (!window.confirm(`Deseja enviar ${ordens.length} OS(s) do cache local para o banco de produção?\n\nOS que já existem no banco serão atualizadas; as novas serão criadas.`)) return;

    setSincronizando(true);
    setProgresso([]);
    let criadas = 0, atualizadas = 0, erros = 0;

    for (const os of ordens) {
      try {
        const log = (msg) => setProgresso(p => [...p, msg]);

        // Verifica se já existe no backend
        let existe = false;
        try {
          await api.ordens.buscar(os.id);
          existe = true;
        } catch (_) { existe = false; }

        const payload = {
          ...os,
          dados_formulario_json: JSON.stringify(os),
        };

        if (existe) {
          await api.ordens.atualizar(os.id, payload);
          // Se era FINALIZADA, garante que o status está correto
          if (os.status === 'FINALIZADA' || os.status === 'COMPLETA - COM PENDENCIA') {
            await api.ordens.finalizar(os.id);
          }
          atualizadas++;
          log(`✅ Atualizada: OS ${os.numero_os || os.id.slice(0,8)} — ${os.cliente_nome || 'sem nome'}`);
        } else {
          await api.ordens.criar(payload);
          if (os.status === 'FINALIZADA' || os.status === 'COMPLETA - COM PENDENCIA') {
            await api.ordens.finalizar(os.id);
          }
          criadas++;
          log(`🆕 Criada: OS ${os.numero_os || os.id.slice(0,8)} — ${os.cliente_nome || 'sem nome'}`);
        }
      } catch (e) {
        erros++;
        setProgresso(p => [...p, `❌ Erro em OS ${os.numero_os || os.id.slice(0,8)}: ${e.message}`]);
      }
    }

    setResumo({ criadas, atualizadas, erros });
    setSincronizando(false);
  };

  const finalizadasFaltando = ordens.filter(o => o.status === 'FINALIZADA' || o.status === 'COMPLETA - COM PENDENCIA');
  const rascunhos = ordens.filter(o => o.status === 'RASCUNHO');

  return (
    <>
      <Header title="Sincronizar OS" showBack />
      <main className="page-container fade-in" style={{ paddingBottom: 40 }}>

        {/* Aviso de uso */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 10,
          background: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.4)',
          marginBottom: 24,
          fontSize: '0.82rem',
          color: 'var(--color-text)',
          lineHeight: 1.6,
        }}>
          <strong>⚠️ Use esta página no dispositivo original</strong><br />
          Esta ferramenta envia as OS salvas no cache local deste dispositivo para o banco de dados de produção. Use-a no celular/navegador onde as OS foram criadas originalmente.
        </div>

        {/* Estatísticas do cache local */}
        {carregando ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>⏳ Carregando dados locais...</p>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>📋 Dados no cache local deste dispositivo</h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>{ordens.length}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>Total OS</p>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{finalizadasFaltando.length}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>Finalizadas</p>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning)' }}>{rascunhos.length}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>Rascunhos</p>
                </div>
              </div>
            </div>

            {/* Lista de OS encontradas */}
            {ordens.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>OS encontradas no cache:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                  {[...ordens]
                    .sort((a, b) => (parseInt(a.numero_os) || 0) - (parseInt(b.numero_os) || 0))
                    .map(os => (
                    <div key={os.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'var(--color-surface-2)',
                      fontSize: '0.8rem',
                    }}>
                      <span>
                        <strong>OS {os.numero_os || '?'}</strong> — {os.cliente_nome || 'sem nome'}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: os.status === 'FINALIZADA' ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)',
                        color: os.status === 'FINALIZADA' ? 'var(--color-success)' : 'var(--color-warning)',
                        fontWeight: 600,
                      }}>
                        {os.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão de sincronizar */}
            {ordens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-dim)' }}>
                <p>Nenhuma OS encontrada no cache local deste dispositivo.</p>
              </div>
            ) : (
              <button
                onClick={sincronizar}
                disabled={sincronizando}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 10,
                  border: 'none',
                  background: sincronizando
                    ? 'var(--color-surface-2)'
                    : 'linear-gradient(135deg, var(--color-accent), #d97706)',
                  color: sincronizando ? 'var(--color-text-dim)' : '#000',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: sincronizando ? 'not-allowed' : 'pointer',
                  marginBottom: 24,
                }}
              >
                {sincronizando ? '⏳ Sincronizando...' : `🚀 Enviar ${ordens.length} OS para o servidor`}
              </button>
            )}
          </>
        )}

        {/* Progresso da sincronização */}
        {progresso.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>Progresso:</h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: 300,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
            }}>
              {progresso.map((msg, i) => (
                <p key={i} style={{ margin: 0, color: 'var(--color-text-muted)' }}>{msg}</p>
              ))}
            </div>
          </div>
        )}

        {/* Resumo final */}
        {resumo && (
          <div style={{
            padding: '16px',
            borderRadius: 10,
            background: resumo.erros === 0
              ? 'rgba(16,185,129,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${resumo.erros === 0 ? 'var(--color-success)' : 'var(--color-danger)'}`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>
              {resumo.erros === 0 ? '✅' : '⚠️'}
            </p>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Sincronização concluída!</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              🆕 Criadas: {resumo.criadas} &nbsp;|&nbsp;
              ✏️ Atualizadas: {resumo.atualizadas} &nbsp;|&nbsp;
              ❌ Erros: {resumo.erros}
            </p>
          </div>
        )}

      </main>
    </>
  );
}

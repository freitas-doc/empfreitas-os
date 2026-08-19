import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { useOSForm } from '../context/OSFormContext.jsx';
import AssinaturaCliente from '../components/assinatura/AssinaturaCliente.jsx';
import AssinaturaTecnico from '../components/assinatura/AssinaturaTecnico.jsx';
import { api } from '../services/api.js';
import { indexedDbService } from '../services/indexedDbService.js';
import { gerarPdfOS } from '../services/pdfGenerator.js';

// ── Componente de Preview de PDF ───────────────────────────
function PreviewPDF({ state }) {
  const [url, setUrl]         = useState(null);
  const [gerando, setGerando] = useState(true);
  const [erro, setErro]       = useState(null);

  useEffect(() => {
    let objectUrl = null;
    (async () => {
      try {
        setGerando(true);
        setErro(null);
        const bytes = await gerarPdfOS(state);
        const blob  = new Blob([bytes], { type: 'application/pdf' });
        objectUrl   = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        setErro(e.message || 'Erro ao gerar pre-visualizacao.');
      } finally {
        setGerando(false);
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, []); // roda só uma vez — preview é do rascunho puro, sem assinaturas

  const handleBaixarPreview = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `RASCUNHO_OS_${state.numero_os || 'preview'}.pdf`;
    a.click();
  };

  if (gerando) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>
        <p style={{ fontSize: '0.85rem' }}>Gerando pre-visualizacao do documento...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', borderRadius: 8, color: 'var(--color-danger)', fontSize: '0.85rem' }}>
        ⚠️ {erro}
      </div>
    );
  }

  return (
    <div>
      {/* Iframe do PDF */}
      <div style={{ height: 500, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: 12 }}>
        <iframe
          src={`${url}#toolbar=0&navpanes=0`}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Pre-visualizacao PDF sem assinatura"
        />
      </div>

      {/* Botão de baixar rascunho */}
      <button
        onClick={handleBaixarPreview}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        ⬇️ Baixar rascunho (sem assinatura)
      </button>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────
export default function RevisaoAssinaturas() {
  const { state, dispatch } = useOSForm();
  const navigate = useNavigate();

  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro]               = useState(null);

  const assinaturasCompletas = state.assinaturas.cliente && state.assinaturas.tecnico;

  const handleFinalizar = async () => {
    if (!assinaturasCompletas) {
      setErro('Ambas as assinaturas são obrigatórias para finalizar a OS.');
      return;
    }

    setFinalizando(true);
    setErro(null);

    try {
      // ── Validação de horários antes de finalizar ──────────
      const agora = new Date();

      if (state.data_termino_servico) {
        const termino = new Date(state.data_termino_servico);

        if (termino > agora) {
          setErro(
            'O término do serviço não pode ser posterior ao horário atual de fechamento da OS. ' +
            'Corrija o campo "Término do Serviço" antes de finalizar.'
          );
          setFinalizando(false);
          return;
        }

        if (state.data_inicio_servico && termino < new Date(state.data_inicio_servico)) {
          setErro('O término do serviço não pode ser anterior ao início. Corrija as horas antes de finalizar.');
          setFinalizando(false);
          return;
        }
      }

      const finalId     = state.id || crypto.randomUUID();
      const temPendencia = state.pecas_pendentes && state.pecas_pendentes.length > 0;
      const statusFinal  = temPendencia ? 'COMPLETA - COM PENDENCIA' : 'FINALIZADA';

      // ── Atribui o número sequencial APENAS na finalização ────
      const proximoNum = parseInt(localStorage.getItem('empfreitas_os_contador') || '0') + 1;
      localStorage.setItem('empfreitas_os_contador', String(proximoNum));

      const finalOS = {
        ...state,
        id: finalId,
        status: statusFinal,
        numero_os: proximoNum,
        data_fechamento: new Date().toISOString(),
      };

      // Gera o PDF final — agora COM as assinaturas embutidas
      const pdfBytes = await gerarPdfOS(finalOS);

      // Persiste localmente
      await indexedDbService.salvarOrdem(finalOS);
      await indexedDbService.db.pdfs.put({
        ordem_servico_id: finalId,
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      });

      // Sincroniza com backend (silencioso se offline)
      try {
        await api.ordens.atualizar(finalId, { ...finalOS, dados_formulario_json: JSON.stringify(finalOS) });
        await api.ordens.finalizar(finalId);
      } catch (e) { console.warn('Backend indisponível. Salvo localmente.', e); }

      dispatch({ type: 'ATUALIZAR_CAMPOS', payload: { status: statusFinal, numero_os: proximoNum } });

      // Download / Share do PDF final com assinaturas
      const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
      const filename = `OS_${proximoNum}_ASSINADA.pdf`;
      const file     = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: `OS #${proximoNum} - ${finalOS.cliente_nome}`, files: [file] });
        } catch (e) { console.log('Share cancelado', e); }
      } else {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      navigate('/historico');

    } catch (err) {
      setErro(err.message || 'Erro crítico ao gerar o documento final.');
      setFinalizando(false);
    }
  };

  return (
    <>
      <Header title="Revisao e Assinaturas" showBack />
      <main className="page-container fade-in" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 120px)' }}>

        {/* ══════════════════════════════════════════
            PASSO 1 — PRÉ-VISUALIZAÇÃO (sem assinatura)
        ══════════════════════════════════════════ */}
        <section className="card" style={{ marginBottom: 24 }}>
          {/* Badge de passo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 800, flexShrink: 0,
            }}>1</div>
            <div>
              <h2 className="title-sm" style={{ margin: 0 }}>Revise o Documento</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                Verifique todos os dados antes de prosseguir com a assinatura.
              </p>
            </div>
          </div>

          <PreviewPDF state={state} />
        </section>

        {/* ══════════════════════════════════════════
            PASSO 2 — ASSINATURAS
        ══════════════════════════════════════════ */}
        <section className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: assinaturasCompletas ? 'var(--color-success)' : 'var(--color-surface-3)',
              color: assinaturasCompletas ? '#fff' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 800, flexShrink: 0,
              transition: 'all 0.3s ease',
            }}>2</div>
            <div>
              <h2 className="title-sm" style={{ margin: 0 }}>Assinaturas</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                Colha a assinatura do cliente e registre a sua.
              </p>
            </div>
          </div>

          <AssinaturaCliente />
          <AssinaturaTecnico />

          {/* Status das assinaturas */}
          <div style={{ marginTop: 8, fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: state.assinaturas.cliente ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
              <span>{state.assinaturas.cliente ? '✔' : '○'}</span>
              <span>Assinatura do cliente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: state.assinaturas.tecnico ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
              <span>{state.assinaturas.tecnico ? '✔' : '○'}</span>
              <span>Assinatura do tecnico</span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            PASSO 3 — GERAR PDF FINAL COM ASSINATURAS
        ══════════════════════════════════════════ */}
        <section className="card" style={{ marginBottom: 24, borderColor: assinaturasCompletas ? 'var(--color-success)' : 'var(--color-border)', borderWidth: 1, borderStyle: 'solid', opacity: assinaturasCompletas ? 1 : 0.5, transition: 'all 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: assinaturasCompletas ? 'var(--color-success)' : 'var(--color-surface-3)',
              color: assinaturasCompletas ? '#fff' : 'var(--color-text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 800, flexShrink: 0,
              transition: 'all 0.3s ease',
            }}>3</div>
            <div>
              <h2 className="title-sm" style={{ margin: 0 }}>Gerar Documento Final</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
                {assinaturasCompletas
                  ? 'Tudo pronto! Clique para gerar o PDF com as assinaturas.'
                  : 'Disponivel apos ambas as assinaturas.'}
              </p>
            </div>
          </div>

          {erro && (
            <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', borderRadius: 6, color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: 12 }}>
              ⚠️ {erro}
            </div>
          )}

          <button
            onClick={handleFinalizar}
            disabled={!assinaturasCompletas || finalizando}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: assinaturasCompletas
                ? 'linear-gradient(135deg, var(--color-success), #059669)'
                : 'var(--color-surface-2)',
              color: assinaturasCompletas ? '#fff' : 'var(--color-text-dim)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: assinaturasCompletas && !finalizando ? 'pointer' : 'not-allowed',
              boxShadow: assinaturasCompletas ? '0 8px 24px rgba(16,185,129,0.3)' : 'none',
              transition: 'all 0.3s ease',
              opacity: finalizando ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {finalizando
              ? '⏳ Gerando documento final...'
              : '✅ Gerar PDF com Assinaturas e Finalizar'}
          </button>
        </section>

      </main>
      <BottomNav />
    </>
  );
}

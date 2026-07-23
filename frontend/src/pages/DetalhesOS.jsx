import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import { indexedDbService } from '../services/indexedDbService.js';
import { formatarNumeroOS } from '../utils/formatters.js';
import { gerarPdfOS } from '../services/pdfGenerator.js';

export default function DetalhesOS() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [osData, setOsData] = useState(null);
  const [gerando, setGerando] = useState(false);

  // Gera o PDF a partir dos dados da OS, sempre forçando regerar
  const regerarPdf = useCallback(async (os) => {
    if (!os) return;
    setGerando(true);
    setPdfBlob(null);
    setPdfUrl(null);
    try {
      const bytes = await gerarPdfOS(os);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      // Apaga o cache antigo e salva o novo
      await indexedDbService.db.pdfs.delete(id);
      await indexedDbService.db.pdfs.put({ ordem_servico_id: id, blob });
      const url = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfUrl(url);
    } catch (e) {
      console.error('Erro ao gerar PDF', e);
      alert('Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.');
    } finally {
      setGerando(false);
    }
  }, [id]);

  useEffect(() => {
    async function carregar() {
      const os = await indexedDbService.buscarOrdem(id);
      if (os) setOsData(os);

      // Sempre regera com o novo template — não usa cache antigo
      await regerarPdf(os);
    }
    carregar();
    // Limpa a URL ao desmontar o componente para evitar vazamento de memória
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [id]);

  const handleDownload = () => {
    if (!pdfBlob || !osData) return;
    const filename = `OS_${osData.numero_os || id.slice(0, 6)}.pdf`;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!pdfBlob || !osData) return;
    const filename = `OS_${osData.numero_os || id.slice(0, 6)}.pdf`;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: 'Ordem de Serviço', files: [file] });
      } catch (err) {
        console.error('Erro ao compartilhar', err);
      }
    } else {
      alert('Seu dispositivo não suporta compartilhamento nativo. Use o botão Baixar.');
    }
  };

  return (
    <>
      <Header title={`OS ${osData ? formatarNumeroOS(osData.numero_os || id.slice(0, 6)) : '...'}`} showBack />
      <main className="page-container fade-in" style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column' }}>

        {pdfUrl ? (
          <div style={{ width: '100%', height: 'calc(100vh - 210px)', minHeight: 500, marginBottom: 16, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#fff' }}>
            <iframe src={`${pdfUrl}#toolbar=0`} width="100%" height="100%" style={{ border: 'none', display: 'block' }} title="PDF Gerado" />
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            {gerando ? (
              <>
                <div style={{ fontSize: '2rem' }}>⏳</div>
                <p>Gerando PDF com o novo layout...</p>
              </>
            ) : (
              <p>PDF não encontrado.</p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <button
            onClick={() => navigate('/historico')}
            style={{ padding: '14px 0', background: 'var(--color-surface-2)', border: 'none', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
          >
            Voltar
          </button>
          <button
            onClick={() => regerarPdf(osData)}
            disabled={gerando}
            style={{ padding: '14px 0', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
          >
            {gerando ? '...' : '🔄 Regerar'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!pdfBlob || gerando}
            style={{ padding: '14px 0', background: 'var(--color-accent)', border: 'none', color: '#000', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem' }}
          >
            Baixar
          </button>
          <button
            onClick={handleShare}
            disabled={!pdfBlob || gerando}
            style={{ padding: '14px 0', background: 'var(--color-info)', border: 'none', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem' }}
          >
            Compartilhar
          </button>
        </div>

      </main>
    </>
  );
}

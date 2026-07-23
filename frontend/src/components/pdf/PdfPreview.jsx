import React, { useEffect, useState } from 'react';
import { gerarPdfOS } from '../../services/pdfGenerator.js';

export default function PdfPreview({ osState }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [gerando, setGerando] = useState(true);

  useEffect(() => {
    async function criarBlob() {
      try {
        setGerando(true);
        const bytes = await gerarPdfOS(osState);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e) {
        console.error('Erro ao gerar preview', e);
      } finally {
        setGerando(false);
      }
    }
    if (osState) {
      criarBlob();
    }
    
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [osState]);

  if (gerando) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>Renderizando Documento PDF...</div>;
  }

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      {pdfUrl && (
        <iframe 
          src={`${pdfUrl}#toolbar=0`} 
          width="100%" 
          height="100%" 
          style={{ border: 'none' }}
          title="Pré-visualização do PDF"
        />
      )}
    </div>
  );
}

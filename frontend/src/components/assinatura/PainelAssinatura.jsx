import React, { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';

export default function PainelAssinatura({ titulo, descricao, onSalvar, onClose }) {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Ajuste de redimensionamento do canvas para telas de alta densidade (Retina, mobile)
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const width = canvas.parentElement.offsetWidth;
      const height = 200; // altura fixa amigável para celular

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      canvas.getContext('2d').scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        penColor: '#000', // Assinatura no PDF será preta
        backgroundColor: '#fff', // Fundo branco ajuda a leitura
      });
    }

    // Prevenir scrolling da tela enquanto desenha na assinatura no mobile
    const handleTouch = (e) => e.preventDefault();
    const cvs = canvasRef.current;
    if (cvs) {
      cvs.addEventListener('touchmove', handleTouch, { passive: false });
      return () => cvs.removeEventListener('touchmove', handleTouch);
    }
  }, []);

  const handleLimpar = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleConfirmar = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      // Extrair apenas os traços (PNG base64 transparente ou com fundo, escolhi com fundo pois definimos backgroundColor)
      const base64 = signaturePadRef.current.toDataURL('image/png');
      onSalvar(base64);
    } else {
      alert('Por favor, faça a assinatura antes de confirmar.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--page-padding)'
    }}>
      <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: 500, borderRadius: 'var(--radius-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 className="title-md">{titulo}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{descricao}</p>
        </div>

        <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#fff' }}>
          <canvas ref={canvasRef} style={{ touchAction: 'none' }}></canvas>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={handleLimpar} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-surface-3)', color: 'var(--color-text)', fontWeight: 600 }}>
            Limpar
          </button>
          <button onClick={handleConfirmar} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-accent)', color: '#000', fontWeight: 700 }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

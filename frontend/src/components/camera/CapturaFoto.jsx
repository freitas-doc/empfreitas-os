import React, { useRef, useState } from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';
import { CATEGORIA_FOTO, FOTOS_OBRIGATORIAS } from '../../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';

// Categorias livres (não obrigatórias) disponíveis no seletor
const CATEGORIAS_LIVRES = [
  CATEGORIA_FOTO.ANTES,
  CATEGORIA_FOTO.DEPOIS,
  CATEGORIA_FOTO.PECA,
  CATEGORIA_FOTO.OUTRO,
];

function comprimirFoto(file, onDone) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (ev) => {
    const img = new Image();
    img.src = ev.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1280;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      onDone(canvas.toDataURL('image/jpeg', 0.6));
    };
  };
}

// ── Botão de foto obrigatória ────────────────────────────
function FotoObrigatoria({ config, fotos, onCaptura }) {
  const fileRef = useRef(null);
  const [comprimindo, setComprimindo] = useState(false);
  const jaTemFoto = fotos.some(f => f.categoria === config.categoria);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setComprimindo(true);
    comprimirFoto(file, (base64) => {
      onCaptura(config.categoria, base64);
      setComprimindo(false);
      if (fileRef.current) fileRef.current.value = '';
    });
  };

  return (
    <div style={{
      flex: 1,
      border: jaTemFoto ? '2px solid var(--color-success)' : '2px dashed var(--color-danger)',
      borderRadius: 'var(--radius-md)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      background: jaTemFoto ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }} onClick={() => fileRef.current?.click()}>
      <span style={{ fontSize: '1.6rem' }}>{jaTemFoto ? '✅' : config.icon}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: jaTemFoto ? 'var(--color-success)' : 'var(--color-danger)', textAlign: 'center' }}>
        {config.label}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        {jaTemFoto ? 'Foto registrada ✓' : comprimindo ? 'Processando...' : 'Obrigatório — Toque para fotografar'}
      </span>
      {jaTemFoto && (() => {
        const foto = fotos.find(f => f.categoria === config.categoria);
        return (
          <img
            src={foto.imagem_base64}
            alt={config.label}
            style={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: 4 }}
          />
        );
      })()}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileRef}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────
export default function CapturaFoto() {
  const { state, dispatch } = useOSForm();
  const fileInputRef = useRef(null);
  const [categoria, setCategoria] = useState(CATEGORIA_FOTO.ANTES);
  const [comprimindo, setComprimindo] = useState(false);

  const adicionarFoto = (cat, base64) => {
    // Para fotos obrigatórias: substitui se já existir (só 1 por categoria)
    const ehObrigatoria = FOTOS_OBRIGATORIAS.some(f => f.categoria === cat);
    if (ehObrigatoria) {
      const fotoExistente = state.fotos.find(f => f.categoria === cat);
      if (fotoExistente) {
        dispatch({ type: 'REMOVER_FOTO', id: fotoExistente.id });
      }
    }
    dispatch({
      type: 'ADICIONAR_FOTO',
      payload: { id: uuidv4(), categoria: cat, imagem_base64: base64, criado_em: new Date().toISOString() }
    });
  };

  const handleCaptura = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setComprimindo(true);
    comprimirFoto(file, (base64) => {
      adicionarFoto(categoria, base64);
      setComprimindo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 className="title-sm" style={{ marginBottom: 16 }}>📷 Fotos</h2>

      {/* ── Fotos Obrigatórias ── */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚠️</span> Fotos obrigatórias — necessárias para finalizar a OS
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          {FOTOS_OBRIGATORIAS.map(config => (
            <FotoObrigatoria
              key={config.categoria}
              config={config}
              fotos={state.fotos}
              onCaptura={adicionarFoto}
            />
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: 14, paddingTop: 14 }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>Outras fotos (livre)</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: '#fff', fontSize: '0.9rem' }}
          >
            {CATEGORIAS_LIVRES.map(c => (
              <option key={c} value={c}>Foto: {c}</option>
            ))}
          </select>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={comprimindo}
            style={{
              flex: 2,
              background: 'var(--color-info)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: comprimindo ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {comprimindo ? 'Processando...' : '📷 Tirar Foto'}
          </button>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleCaptura}
        style={{ display: 'none' }}
      />
    </section>
  );
}

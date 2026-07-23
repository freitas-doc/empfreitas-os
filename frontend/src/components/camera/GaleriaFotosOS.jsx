import React from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';

export default function GaleriaFotosOS() {
  const { state, dispatch } = useOSForm();

  if (state.fotos.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginBottom: 24 }}>
      {state.fotos.map((foto) => (
        <div key={foto.id} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)', aspectRatio: '1/1' }}>
          <img 
            src={foto.imagem_base64} 
            alt={`Foto ${foto.categoria}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '4px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 600 }}>
            {foto.categoria}
          </div>
          <button
            onClick={() => dispatch({ type: 'REMOVER_FOTO', id: foto.id })}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'rgba(239,68,68,0.9)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

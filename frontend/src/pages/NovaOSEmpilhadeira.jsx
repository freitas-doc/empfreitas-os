import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import { useOSForm } from '../context/OSFormContext.jsx';
import { indexedDbService } from '../services/indexedDbService.js';
import useAutosave from '../hooks/useAutosave.js';
import { FOTOS_OBRIGATORIAS } from '../utils/constants.js';

import DadosCliente from '../components/form/DadosCliente.jsx';
import DadosEquipamento from '../components/form/DadosEquipamento.jsx';
import ChecklistManutencao from '../components/form/ChecklistManutencao.jsx';
import PecasTrocadas from '../components/form/PecasTrocadas.jsx';
import PecasPendentes from '../components/form/PecasPendentes.jsx';
import CampoObservacoes from '../components/form/CampoObservacoes.jsx';
import CapturaFoto from '../components/camera/CapturaFoto.jsx';
import GaleriaFotosOS from '../components/camera/GaleriaFotosOS.jsx';
import ControleHoras from '../components/form/ControleHoras.jsx';
import DeslocamentoKm from '../components/form/DeslocamentoKm.jsx';

export default function NovaOSEmpilhadeira() {
  const { state, dispatch } = useOSForm();
  const navigate = useNavigate();

  useAutosave();

  useEffect(() => {
    if (!state.id) navigate('/');
  }, [state.id, navigate]);

  if (!state.id) return null;

  const isCorretiva = state.tipo_manutencao === 'CORRETIVA';

  const handleAvancar = () => {
    if (!state.cliente_nome?.trim() || !state.equipamento_modelo?.trim()) {
      alert("Por favor, preencha o 'Nome / Razão Social' do Cliente e o 'Modelo' do Equipamento antes de avançar.");
      return;
    }
    // Validação de fotos obrigatórias
    const fotosFaltando = FOTOS_OBRIGATORIAS.filter(
      f => !state.fotos.some(foto => foto.categoria === f.categoria)
    );
    if (fotosFaltando.length > 0) {
      const nomes = fotosFaltando.map(f => f.label).join(' e ');
      alert(`⚠️ Foto(s) obrigatória(s) pendente(s): ${nomes}\n\nTire as fotos antes de avançar.`);
      return;
    }
    navigate(`/revisao/${state.id}`);
  };

  return (
    <>
      <Header
        title="OS — Empilhadeira"
        subtitle={isCorretiva ? 'Manutenção Corretiva' : 'Manutenção Preventiva'}
        showBack
      />
      <main className="page-container fade-in" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 120px)' }}>
        
        <div style={{ textAlign: 'right', marginBottom: 16, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {state.ultima_sincronizacao 
            ? `✔ Rascunho salvo às ${new Date(state.ultima_sincronizacao).toLocaleTimeString('pt-BR')}`
            : 'Sincronizando...'}
        </div>

        <DadosCliente />
        <DadosEquipamento />
        <ControleHoras />
        <DeslocamentoKm />
        {!isCorretiva && <ChecklistManutencao />}
        <PecasTrocadas />
        <PecasPendentes />
        <CampoObservacoes />
        <CapturaFoto />
        <GaleriaFotosOS />

        <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 16px)', left: 0, right: 0, padding: '0 var(--page-padding)', zIndex: 99, maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleAvancar}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-success), #059669)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
            }}
          >
            Avançar para Assinaturas →
          </button>
          <button
            onClick={async () => {
              await indexedDbService.salvarOrdem({ ...state, dados_formulario_json: JSON.stringify(state) });
              dispatch({ type: 'RESETAR' });
              navigate('/');
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'rgba(13,27,42,0.9)',
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            💾 Salvar Rascunho e Voltar
          </button>
        </div>

      </main>
      <BottomNav />
    </>
  );
}

import React, { useMemo, useEffect } from 'react';
import { useOSForm } from '../../context/OSFormContext.jsx';
import { v4 as uuidv4 } from 'uuid';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula horas entre dois datetime-local strings.
 * Retorna null se os valores forem inválidos ou termino <= inicio.
 */
function calcularHorasSessao(inicio, termino) {
  if (!inicio || !termino) return null;
  const i = new Date(inicio);
  const t = new Date(termino);
  if (isNaN(i) || isNaN(t) || t <= i) return null;
  return (t - i) / (1000 * 60 * 60);
}

/** Formata horas decimais para "Xh Ymin" */
function formatarHoras(horas) {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ── Componente de sessão individual ──────────────────────────────────────────
function SessaoTrabalho({ sessao, index, total, onAtualizar, onRemover }) {
  const horas = calcularHorasSessao(sessao.inicio, sessao.termino);
  const invalido = sessao.inicio && sessao.termino && horas === null;

  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: `1px solid ${invalido ? 'var(--color-danger)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.2s',
    }}>
      {/* Cabeçalho da sessão */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
          📅 Sessão {index + 1}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {horas !== null && (
            <span style={{
              fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--color-success)',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 999, padding: '2px 10px',
            }}>
              {formatarHoras(horas)}
            </span>
          )}
          {total > 1 && (
            <button
              onClick={() => onRemover(sessao.id)}
              title="Remover sessão"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-danger)'; }}
            >
              ✕ Remover
            </button>
          )}
        </div>
      </div>

      {/* Campos Início e Término */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Início
          </label>
          <input
            type="datetime-local"
            value={sessao.inicio}
            onChange={e => onAtualizar(sessao.id, { inicio: e.target.value })}
            style={{
              width: '100%', padding: '10px 8px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', background: 'var(--color-bg)',
              color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Término
          </label>
          <input
            type="datetime-local"
            value={sessao.termino}
            min={sessao.inicio || undefined}
            onChange={e => onAtualizar(sessao.id, { termino: e.target.value })}
            style={{
              width: '100%', padding: '10px 8px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${invalido ? 'var(--color-danger)' : 'var(--color-border)'}`,
              background: 'var(--color-bg)',
              color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {invalido && (
        <p style={{ fontSize: '0.72rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
          ⚠️ O término não pode ser anterior ou igual ao início.
        </p>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ControleHoras() {
  const { state, dispatch, atualizarCampo } = useOSForm();

  // Garante que sempre há pelo menos 1 sessão
  useEffect(() => {
    if (state.sessoes_trabalho.length === 0) {
      dispatch({ type: 'ADICIONAR_SESSAO' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Soma total das horas válidas de todas as sessões
  const totalHoras = useMemo(() => {
    return state.sessoes_trabalho.reduce((acc, s) => {
      const h = calcularHorasSessao(s.inicio, s.termino);
      return h !== null ? acc + h : acc;
    }, 0);
  }, [state.sessoes_trabalho]);

  const temHoras = totalHoras > 0;

  // Persiste o total de horas calculado no campo do backend
  useEffect(() => {
    atualizarCampo('horas_trabalhadas', parseFloat(totalHoras.toFixed(2)));
  }, [totalHoras]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAtualizar = (id, dados) => {
    dispatch({ type: 'ATUALIZAR_SESSAO', id, dados });
  };

  const handleRemover = (id) => {
    dispatch({ type: 'REMOVER_SESSAO', id });
  };

  const handleAdicionar = () => {
    dispatch({ type: 'ADICIONAR_SESSAO' });
  };

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: '1.3rem' }}>⏱️</span>
        <div>
          <h2 className="title-sm" style={{ margin: 0 }}>Controle de Horas</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>
            Registre os períodos de trabalho — adicione uma sessão por dia ou turno
          </p>
        </div>
      </div>

      {/* Lista de sessões */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {state.sessoes_trabalho.map((sessao, index) => (
          <SessaoTrabalho
            key={sessao.id}
            sessao={sessao}
            index={index}
            total={state.sessoes_trabalho.length}
            onAtualizar={handleAtualizar}
            onRemover={handleRemover}
          />
        ))}
      </div>

      {/* Botão adicionar sessão */}
      <button
        onClick={handleAdicionar}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--color-border)',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 14,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
          e.currentTarget.style.color = 'var(--color-accent)';
          e.currentTarget.style.background = 'rgba(245,158,11,0.05)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-text-muted)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        + Adicionar Sessão
      </button>

      {/* Totalizador */}
      <div style={{
        background: temHoras ? 'rgba(16,185,129,0.07)' : 'rgba(100,100,100,0.07)',
        border: `1px solid ${temHoras ? 'rgba(16,185,129,0.25)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.3s ease',
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            ⏱️ Total de horas trabalhadas
          </span>
          {state.sessoes_trabalho.length > 1 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', margin: '2px 0 0' }}>
              Soma de {state.sessoes_trabalho.length} sessões
            </p>
          )}
        </div>
        <span style={{
          fontSize: '1.2rem', fontWeight: 800,
          color: temHoras ? 'var(--color-success)' : 'var(--color-text-dim)',
        }}>
          {temHoras ? formatarHoras(totalHoras) : '—'}
        </span>
      </div>
    </section>
  );
}
